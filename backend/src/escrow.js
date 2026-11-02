import { notify, systemMessage, fail } from './http.js';
import { money } from './money.js';

export const priceOf = (p) => p.agreed_price ?? p.price;
export const daysOf = (p) => p.agreed_days ?? p.days;

const TRANSITIONS = {
  pending: ['reserved', 'failed', 'cancelled'],
  reserved: ['released', 'refunded'],
  released: [],
  refunded: [],
  failed: [],
  cancelled: [],
};
export const canMove = (from, to) => TRANSITIONS[from]?.includes(to) ?? false;

export async function movePayment(db, payment, to, extra = {}) {
  if (!canMove(payment.status, to)) fail(409, `Платёж нельзя перевести из «${payment.status}» в «${to}»`);
  await db.query(
    `UPDATE payments SET status = $2, capture_id = coalesce($3, capture_id), released_at = CASE WHEN $2 = 'released' THEN now() ELSE released_at END, updated_at = now() WHERE id = $1`,
    [payment.id, to, extra.captureId ?? null]);
}

export async function startWork(db, p) {
  await db.query(
    `UPDATE projects SET status = 'in_work', paid = true, stage = 0, due_date = current_date + $2::int WHERE id = $1`,
    [p.id, daysOf(p)]);
  await systemMessage(db, p.id, 'Оплата зарезервирована до завершения проекта · ' + money(priceOf(p)));
  await notify(db, p.specialist_id, 'specialist', '/spec/workspace/' + p.id,
    'Оплата по проекту «' + p.title + '» зарезервирована — можно начинать работу', 'payment');
}
