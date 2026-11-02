import { Router } from 'express';
import { query, tx } from '../db.js';
import { requireUser } from '../auth.js';
import { h, fail, notify, systemMessage } from '../http.js';
import { commission, money } from '../money.js';
import { log, securityEvent } from '../log.js';
import { paypalEnabled } from '../config.js';
import { createOrder, captureOrder, kztToUsd, verifyWebhook, PayPalError } from '../paypal.js';
import { priceOf, movePayment, startWork } from '../escrow.js';

const router = Router();
const REUSE_MS = 3 * 60 * 60 * 1000;
const origin = (req) => process.env.APP_URL || `${req.protocol}://${req.get('host')}`;

router.post('/projects/:id/checkout', requireUser, h(async (req, res) => {
  if (!paypalEnabled()) fail(400, 'Онлайн-оплата не настроена');
  const result = await tx(async (db) => {
    const { rows } = await db.query(`SELECT * FROM projects WHERE id = $1 FOR UPDATE`, [req.params.id]);
    const p = rows[0];
    if (!p) fail(404, 'Проект не найден');
    if (p.client_id !== req.user.id) fail(403, 'Оплатить проект может только заказчик');
    if (p.status !== 'awaiting_payment' || !p.specialist_id) fail(409, 'Проект сейчас не ожидает оплаты. Обновите страницу.');

    const active = await db.query(
      `SELECT * FROM payments WHERE project_id = $1 AND status IN ('pending', 'reserved') ORDER BY created_at DESC LIMIT 1`, [p.id]);
    const prev = active.rows[0];
    if (prev?.status === 'reserved') fail(409, 'Проект уже оплачен');
    if (prev && prev.approve_url && Date.now() - new Date(prev.created_at).getTime() < REUSE_MS && Number(prev.amount) === priceOf(p)) {
      return { url: prev.approve_url, reused: true };
    }
    if (prev) await movePayment(db, prev, 'cancelled');

    const c = commission(priceOf(p));
    const usd = kztToUsd(c.price);
    const ins = await db.query(
      `INSERT INTO payments (project_id, amount, fee, payout, status, provider, amount_usd) VALUES ($1, $2, $3, $4, 'pending', 'paypal', $5) RETURNING id`,
      [p.id, c.price, c.fee, c.payout, usd]);
    const paymentId = ins.rows[0].id;
    const order = await createOrder({
      referenceId: p.id,
      usd,
      description: 'Taskly · ' + p.title,
      returnUrl: origin(req) + '/api/payments/paypal/return',
      cancelUrl: origin(req) + '/api/payments/paypal/cancel',
      requestId: 'order-' + paymentId,
    });
    await db.query(`UPDATE payments SET provider_order_id = $2, approve_url = $3, updated_at = now() WHERE id = $1`, [paymentId, order.orderId, order.approveUrl]);
    log('info', 'payment_created', { paymentId, projectId: p.id, orderId: order.orderId, kzt: c.price, usd });
    return { url: order.approveUrl, reused: false };
  });
  res.json(result);
}));

export async function finalizeOrder(orderId) {
  const { rows } = await query(`SELECT * FROM payments WHERE provider_order_id = $1`, [orderId]);
  const pay = rows[0];
  if (!pay) return { ok: false, reason: 'unknown_order' };
  if (pay.status === 'reserved' || pay.status === 'released') return { ok: true, projectId: pay.project_id };
  if (pay.status !== 'pending') return { ok: false, projectId: pay.project_id, reason: pay.status };

  const cap = await captureOrder(orderId, 'capture-' + pay.id);
  return tx(async (db) => {
    const cur = (await db.query(`SELECT * FROM payments WHERE id = $1 FOR UPDATE`, [pay.id])).rows[0];
    if (cur.status === 'reserved') return { ok: true, projectId: cur.project_id };
    if (!cap.completed) {
      if (cur.status === 'pending') await movePayment(db, cur, 'failed');
      log('warn', 'payment_failed', { paymentId: cur.id, orderId, status: cap.status });
      return { ok: false, projectId: cur.project_id, reason: cap.status };
    }
    await movePayment(db, cur, 'reserved', { captureId: cap.captureId });
    const p = (await db.query(`SELECT * FROM projects WHERE id = $1 FOR UPDATE`, [cur.project_id])).rows[0];
    if (p.status === 'awaiting_payment') await startWork(db, p);
    else log('warn', 'payment_for_inactive_project', { paymentId: cur.id, projectId: p.id, status: p.status });
    log('info', 'payment_reserved', { paymentId: cur.id, projectId: p.id, captureId: cap.captureId, kzt: cur.amount });
    return { ok: true, projectId: p.id };
  });
}

router.get('/payments/paypal/return', async (req, res) => {
  const orderId = String(req.query.token || '');
  try {
    const r = await finalizeOrder(orderId);
    const to = r.projectId ? '/biz/workspace/' + r.projectId : '/biz/projects';
    res.redirect(to + '?payment=' + (r.ok ? 'success' : 'failed'));
  } catch (e) {
    log('error', 'payment_return_error', { orderId, message: e.message, issue: e instanceof PayPalError ? e.issue : undefined });
    const { rows } = await query(`SELECT project_id FROM payments WHERE provider_order_id = $1`, [orderId]).catch(() => ({ rows: [] }));
    res.redirect((rows[0] ? '/biz/workspace/' + rows[0].project_id : '/biz/projects') + '?payment=failed');
  }
});

router.get('/payments/paypal/cancel', async (req, res) => {
  const orderId = String(req.query.token || '');
  const projectId = await tx(async (db) => {
    const { rows } = await db.query(`SELECT * FROM payments WHERE provider_order_id = $1 FOR UPDATE`, [orderId]);
    if (rows[0]?.status === 'pending') await movePayment(db, rows[0], 'cancelled');
    return rows[0]?.project_id;
  }).catch(() => null);
  res.redirect((projectId ? '/biz/workspace/' + projectId : '/biz/projects') + '?payment=cancelled');
});

router.post('/payments/paypal/webhook', async (req, res) => {
  try {
    if (!(await verifyWebhook(req))) {
      securityEvent(req, 'webhook_rejected', { type: req.body?.event_type || null });
      return res.status(200).json({ ok: true });
    }
    const type = req.body.event_type;
    const r = req.body.resource || {};
    log('info', 'paypal_webhook', { type, id: req.body.id });
    if (type === 'CHECKOUT.ORDER.APPROVED') await finalizeOrder(r.id);
    if (type === 'PAYMENT.CAPTURE.COMPLETED') {
      const orderId = r.supplementary_data?.related_ids?.order_id;
      if (orderId) await finalizeOrder(orderId);
    }
    if (type === 'PAYMENT.CAPTURE.REFUNDED' || type === 'PAYMENT.CAPTURE.REVERSED') {
      await tx(async (db) => {
        const { rows } = await db.query(`SELECT * FROM payments WHERE capture_id = $1 FOR UPDATE`, [r.id]);
        if (rows[0] && rows[0].status === 'reserved') await refundInDb(db, rows[0], 'возврат через PayPal');
      });
    }
  } catch (e) {
    log('error', 'paypal_webhook_error', { message: e.message });
  }
  res.status(200).json({ ok: true });
});

export async function refundInDb(db, pay, reason) {
  await movePayment(db, pay, 'refunded');
  const p = (await db.query(`SELECT * FROM projects WHERE id = $1 FOR UPDATE`, [pay.project_id])).rows[0];
  if (p && p.status !== 'done') {
    await db.query(`UPDATE projects SET status = 'cancelled' WHERE id = $1`, [p.id]);
  }
  await systemMessage(db, pay.project_id, 'Оплата возвращена заказчику · ' + money(pay.amount) + (reason ? ' (' + reason + ')' : ''));
  if (p) {
    await notify(db, p.client_id, 'client', '/biz/workspace/' + p.id, 'Оплата по проекту «' + p.title + '» возвращена', 'payment');
    if (p.specialist_id) await notify(db, p.specialist_id, 'specialist', '/spec/workspace/' + p.id, 'Проект «' + p.title + '» отменён, оплата возвращена заказчику', 'payment');
  }
}

export default router;
