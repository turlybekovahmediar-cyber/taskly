/* Общие помощники для маршрутов: ошибки, проверка тела запроса, ответ со свежим состоянием. */
import { query } from './db.js';
import { USER_SQL } from './auth.js';
import { buildState } from './state.js';

export class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
export const fail = (status, message) => { throw new HttpError(status, message); };

/* Обёртка для async-обработчиков: ошибки уходят в общий обработчик */
export const h = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

/* Проверка тела запроса схемой zod. Возвращает очищенные данные или 400 с понятным текстом. */
export function parse(schema, data) {
  const r = schema.safeParse(data ?? {});
  if (!r.success) fail(400, r.error.issues[0]?.message || 'Проверьте данные формы');
  return r.data;
}

/* Ответ после действия: актуальный снимок данных для текущего пользователя */
export async function sendState(res, userId, extra = {}) {
  const user = userId ? (await query(USER_SQL, [userId])).rows[0] : null;
  res.json({ ...(await buildState(user)), ...extra });
}

export async function notify(db, userId, role, link, text, kind) {
  if (!userId) return;
  await db.query(`INSERT INTO notifications (user_id, role, link, text, kind) VALUES ($1, $2, $3, $4, $5)`, [userId, role, link, text, kind]);
}

export const systemMessage = (db, projectId, text) =>
  db.query(`INSERT INTO messages (project_id, sender, text) VALUES ($1, 'system', $2)`, [projectId, text]);
