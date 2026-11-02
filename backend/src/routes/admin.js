import { Router } from 'express';
import { z } from 'zod';
import { query, tx } from '../db.js';
import { requireAdmin } from '../auth.js';
import { h, parse, fail } from '../http.js';
import { securityEvent } from '../log.js';
import { resetDemoData } from '../seed.js';
import { ago, stamp } from '../time.js';
import { refundCapture } from '../paypal.js';
import { refundInDb } from './payments.js';

const router = Router();
router.use('/admin', requireAdmin);

const pct = (a, b) => (b ? Math.round((a / b) * 1000) / 10 : 0);

router.get('/admin/overview', h(async (req, res) => {
  const [users, projects, money, funnel, week] = await Promise.all([
    query(`
      SELECT count(*)::int AS total,
        count(*) FILTER (WHERE email NOT LIKE '%taskly.demo')::int AS real,
        (SELECT count(*) FROM business_profiles)::int AS businesses,
        (SELECT count(*) FROM specialist_profiles)::int AS specialists,
        count(*) FILTER (WHERE auth_provider = 'google')::int AS google,
        count(*) FILTER (WHERE blocked_at IS NOT NULL)::int AS blocked
      FROM users`),
    query(`SELECT status, count(*)::int AS n FROM projects GROUP BY status`),
    query(`
      SELECT coalesce(sum(amount) FILTER (WHERE status = 'released'), 0)::bigint AS gmv,
        coalesce(sum(fee) FILTER (WHERE status = 'released'), 0)::bigint AS revenue,
        coalesce(sum(amount) FILTER (WHERE status = 'reserved'), 0)::bigint AS escrow,
        count(*) FILTER (WHERE status = 'released')::int AS paid_out
      FROM payments`),
    query(`
      SELECT
        (SELECT count(*) FROM business_profiles)::int AS businesses,
        (SELECT count(DISTINCT client_id) FROM projects)::int AS posted,
        (SELECT count(DISTINCT client_id) FROM projects WHERE paid)::int AS paid,
        (SELECT count(*) FROM specialist_profiles)::int AS specialists,
        (SELECT count(DISTINCT specialist_id) FROM proposals)::int AS applied,
        (SELECT count(DISTINCT specialist_id) FROM projects WHERE status = 'done')::int AS earned`),
    query(`
      SELECT
        (SELECT count(*) FROM users WHERE created_at > now() - interval '7 days')::int AS new_users,
        (SELECT count(*) FROM projects WHERE posted_at > now() - interval '7 days')::int AS new_projects,
        (SELECT count(*) FROM proposals WHERE created_at > now() - interval '7 days')::int AS new_proposals,
        (SELECT count(DISTINCT id) FROM users WHERE last_login_at > now() - interval '7 days')::int AS active_users`),
  ]);
  const f = funnel.rows[0];
  res.json({
    users: users.rows[0],
    projects: Object.fromEntries(projects.rows.map((r) => [r.status, r.n])),
    money: Object.fromEntries(Object.entries(money.rows[0]).map(([k, v]) => [k, Number(v)])),
    week: week.rows[0],
    funnel: {
      business: [
        { step: 'Зарегистрировались', n: f.businesses },
        { step: 'Опубликовали проект', n: f.posted, pct: pct(f.posted, f.businesses) },
        { step: 'Оплатили сделку', n: f.paid, pct: pct(f.paid, f.businesses) },
      ],
      specialist: [
        { step: 'Зарегистрировались', n: f.specialists },
        { step: 'Откликнулись', n: f.applied, pct: pct(f.applied, f.specialists) },
        { step: 'Завершили проект', n: f.earned, pct: pct(f.earned, f.specialists) },
      ],
    },
  });
}));

router.get('/admin/users', h(async (req, res) => {
  const q = String(req.query.q || '').trim().toLowerCase().slice(0, 80);
  const { rows } = await query(`
    SELECT u.id, u.email, u.name, u.active_role, u.is_admin, u.is_demo, u.auth_provider, u.blocked_at, u.created_at, u.last_login_at,
      (SELECT count(*) FROM projects p WHERE p.client_id = u.id)::int AS projects,
      (SELECT count(*) FROM proposals x WHERE x.specialist_id = u.id)::int AS proposals
    FROM users u
    WHERE $1 = '' OR lower(u.email) LIKE '%' || $1 || '%' OR lower(u.name) LIKE '%' || $1 || '%'
    ORDER BY u.created_at DESC LIMIT 100`, [q]);
  res.json({
    users: rows.map((u) => ({
      id: u.id, email: u.email, name: u.name, role: u.active_role, isAdmin: u.is_admin, isDemo: u.is_demo,
      provider: u.auth_provider, blocked: !!u.blocked_at,
      lastLogin: u.last_login_at ? ago(u.last_login_at) : '—', projects: u.projects, proposals: u.proposals,
    })),
  });
}));

router.post('/admin/users/:id/:action(block|unblock)', h(async (req, res) => {
  const block = req.params.action === 'block';
  const { rows } = await query(`SELECT id, is_admin, is_demo FROM users WHERE id = $1`, [req.params.id]);
  const u = rows[0];
  if (!u) fail(404, 'Пользователь не найден');
  if (u.id === req.user.id) fail(400, 'Нельзя заблокировать себя');
  if (u.is_admin) fail(400, 'Нельзя заблокировать администратора');
  if (u.is_demo) fail(400, 'Демо-аккаунты не блокируются');
  await query(
    block
      ? `UPDATE users SET blocked_at = now(), token_version = token_version + 1 WHERE id = $1`
      : `UPDATE users SET blocked_at = NULL WHERE id = $1`,
    [u.id]);
  securityEvent(req, block ? 'admin_block_user' : 'admin_unblock_user', { target: u.id });
  res.json({ ok: true });
}));

router.get('/admin/security-events', h(async (req, res) => {
  const { rows } = await query(`
    SELECT e.id, e.event, e.ip, e.details, e.created_at, u.email
    FROM security_events e LEFT JOIN users u ON u.id = e.user_id
    ORDER BY e.created_at DESC LIMIT 100`);
  res.json({ events: rows.map((e) => ({ id: e.id, event: e.event, ip: e.ip, email: e.email || e.details?.email || null, details: e.details, when: stamp(e.created_at) })) });
}));

router.get('/admin/payments', h(async (req, res) => {
  const { rows } = await query(`
    SELECT pay.*, p.title, p.status AS project_status, u.email AS client_email
    FROM payments pay JOIN projects p ON p.id = pay.project_id JOIN users u ON u.id = p.client_id
    ORDER BY pay.created_at DESC LIMIT 100`);
  res.json({
    payments: rows.map((x) => ({
      id: x.id, projectId: x.project_id, title: x.title, projectStatus: x.project_status, client: x.client_email,
      amount: x.amount, fee: x.fee, payout: x.payout, usd: x.amount_usd ? Number(x.amount_usd) : null,
      status: x.status, provider: x.provider, orderId: x.provider_order_id, captureId: x.capture_id, when: stamp(x.created_at),
    })),
  });
}));

router.post('/admin/payments/:id/refund', h(async (req, res) => {
  const { rows } = await query(`SELECT * FROM payments WHERE id = $1`, [req.params.id]);
  const pay = rows[0];
  if (!pay) fail(404, 'Платёж не найден');
  if (pay.status !== 'reserved') fail(409, 'Вернуть можно только зарезервированную оплату (до приёмки работы)');
  if (pay.provider === 'paypal') {
    if (!pay.capture_id) fail(409, 'У платежа нет идентификатора списания PayPal');
    await refundCapture(pay.capture_id, 'refund-' + pay.id);
  }
  await tx(async (db) => {
    const cur = (await db.query(`SELECT * FROM payments WHERE id = $1 FOR UPDATE`, [pay.id])).rows[0];
    if (cur.status === 'reserved') await refundInDb(db, cur, 'решение администратора');
  });
  securityEvent(req, 'admin_refund', { paymentId: pay.id, projectId: pay.project_id, amount: pay.amount });
  res.json({ ok: true });
}));

router.post('/admin/demo/reset', h(async (req, res) => {
  parse(z.object({}).passthrough(), req.body);
  await tx(resetDemoData);
  securityEvent(req, 'admin_demo_reset');
  res.json({ ok: true });
}));

export default router;
