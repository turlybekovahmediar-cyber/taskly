/* Регистрация, вход, выход, переключение роли.
   POST /api/auth/register · POST /api/auth/login · POST /api/auth/demo · POST /api/auth/logout · PATCH /api/auth/me · GET /api/state */
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { query, tx } from '../db.js';
import { setSession, clearSession, requireUser } from '../auth.js';
import { h, parse, fail, sendState } from '../http.js';
import { DEMO_ACCOUNTS } from '../seed.js';

const router = Router();

const role = z.enum(['client', 'specialist'], { message: 'Выберите роль: бизнес или специалист' });
const email = z.string().trim().toLowerCase().email('Введите корректный email, например name@company.kz').max(160);
const RegisterBody = z.object({
  role,
  name: z.string().trim().min(2, 'Укажите имя или название компании').max(120),
  email,
  password: z.string().min(8, 'Пароль — минимум 8 символов').max(128)
    .regex(/[a-zа-яё]/i, 'В пароле нужны буквы и цифры').regex(/\d/, 'В пароле нужны буквы и цифры'),
});
const LoginBody = z.object({ email, password: z.string().min(1, 'Введите пароль').max(128), role: role.optional() });

/* Не больше 20 попыток входа за 15 минут с одного адреса */
const loginLimit = rateLimit({
  windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: true, legacyHeaders: false,
  message: { error: 'Слишком много попыток входа. Попробуйте через 15 минут.' },
});

/* У аккаунта есть профиль для каждой роли, которой он пользовался. Профиль создаётся при первом переключении. */
export async function switchRole(db, userId, nextRole) {
  if (nextRole === 'client') {
    await db.query(`INSERT INTO business_profiles (user_id, company) SELECT id, name FROM users WHERE id = $1 ON CONFLICT DO NOTHING`, [userId]);
  } else {
    await db.query(`INSERT INTO specialist_profiles (user_id) VALUES ($1) ON CONFLICT DO NOTHING`, [userId]);
  }
  await db.query(`UPDATE users SET active_role = $2 WHERE id = $1`, [userId, nextRole]);
}

router.get('/state', h(async (req, res) => sendState(res, req.user?.id)));

router.post('/auth/register', loginLimit, h(async (req, res) => {
  const b = parse(RegisterBody, req.body);
  const exists = await query(`SELECT 1 FROM users WHERE email = $1`, [b.email]);
  if (exists.rowCount) fail(409, 'Этот email уже зарегистрирован. Войдите или используйте другой.');
  const hash = await bcrypt.hash(b.password, 10);
  const id = await tx(async (db) => {
    const { rows } = await db.query(
      `INSERT INTO users (email, password_hash, name, active_role) VALUES ($1, $2, $3, $4) RETURNING id`,
      [b.email, hash, b.name, b.role]);
    await switchRole(db, rows[0].id, b.role);
    return rows[0].id;
  });
  setSession(res, id);
  await sendState(res, id);
}));

router.post('/auth/login', loginLimit, h(async (req, res) => {
  const b = parse(LoginBody, req.body);
  const { rows } = await query(`SELECT id, password_hash, is_demo FROM users WHERE email = $1`, [b.email]);
  const ok = rows[0] && (await bcrypt.compare(b.password, rows[0].password_hash));
  if (!ok) fail(401, 'Неверный email или пароль');
  if (b.role && !rows[0].is_demo) await tx((db) => switchRole(db, rows[0].id, b.role));
  setSession(res, rows[0].id);
  await sendState(res, rows[0].id);
}));

/* Быстрый вход в демо-аккаунты для показа продукта */
router.post('/auth/demo', h(async (req, res) => {
  const r = parse(z.object({ role }), req.body).role;
  const id = DEMO_ACCOUNTS[r].id;
  const { rowCount } = await query(`SELECT 1 FROM users WHERE id = $1`, [id]);
  if (!rowCount) fail(404, 'Демо-аккаунт не найден — заполните базу: npm run seed');
  setSession(res, id);
  await sendState(res, id);
}));

router.post('/auth/logout', (req, res) => { clearSession(res); sendState(res, null).catch(() => res.json({ user: null })); });

/* Сменить открытый кабинет. Для демо-аккаунтов — переход во второй демо-аккаунт, чтобы показать обе стороны сделки. */
router.patch('/auth/me', requireUser, h(async (req, res) => {
  const next = parse(z.object({ role }), req.body).role;
  if (req.user.is_demo) {
    const id = DEMO_ACCOUNTS[next].id;
    setSession(res, id);
    return sendState(res, id);
  }
  await tx((db) => switchRole(db, req.user.id, next));
  await sendState(res, req.user.id);
}));

export default router;
