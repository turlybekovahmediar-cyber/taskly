import { Router } from 'express';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { query, tx } from '../db.js';
import { setSession, clearSession, requireUser, adminEmails } from '../auth.js';
import { h, parse, fail, sendState } from '../http.js';
import { verifyCaptcha } from '../captcha.js';
import { securityEvent } from '../log.js';

const router = Router();

const role = z.enum(['client', 'specialist'], { message: 'Выберите роль: бизнес или специалист' });
const email = z.string().trim().toLowerCase().email('Введите корректный email, например name@company.kz').max(160);
const PASSWORD_RULE = 'Пароль: минимум 8 символов, заглавная и строчная буква и цифра';
export const strongPassword = z.string().min(8, PASSWORD_RULE).max(128)
  .regex(/[a-zа-яё]/, PASSWORD_RULE).regex(/[A-ZА-ЯЁ]/, PASSWORD_RULE).regex(/\d/, PASSWORD_RULE);
const captchaToken = z.string().max(4000).optional();

const RegisterBody = z.object({
  role,
  name: z.string().trim().min(2, 'Укажите имя или название компании').max(120),
  email,
  password: strongPassword,
  captchaToken,
});
const LoginBody = z.object({ email, password: z.string().min(1, 'Введите пароль').max(128), role: role.optional(), captchaToken });

const authLimit = rateLimit({
  windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: true, legacyHeaders: false,
  handler: (req, res) => {
    securityEvent(req, 'rate_limited', { path: req.originalUrl });
    res.status(429).json({ error: 'Слишком много попыток входа. Попробуйте через 15 минут.' });
  },
});

export const passwordMatches = (password, hash) => (hash?.startsWith('$2') ? bcrypt.compare(password, hash) : Promise.resolve(false));

export async function switchRole(db, userId, nextRole) {
  if (nextRole === 'client') {
    await db.query(`INSERT INTO business_profiles (user_id, company) SELECT id, name FROM users WHERE id = $1 ON CONFLICT DO NOTHING`, [userId]);
  } else {
    await db.query(`INSERT INTO specialist_profiles (user_id) VALUES ($1) ON CONFLICT DO NOTHING`, [userId]);
  }
  await db.query(`UPDATE users SET active_role = $2 WHERE id = $1`, [userId, nextRole]);
}

router.get('/state', h(async (req, res) => sendState(res, req.user?.id)));

router.post('/auth/register', authLimit, h(async (req, res) => {
  const b = parse(RegisterBody, req.body);
  await verifyCaptcha(req, b.captchaToken, 'register');
  if (b.password.toLowerCase().includes(b.email.split('@')[0])) fail(400, 'Пароль не должен содержать ваш email');
  const exists = await query(`SELECT 1 FROM users WHERE email = $1`, [b.email]);
  if (exists.rowCount) fail(409, 'Этот email уже зарегистрирован. Войдите или используйте другой.');
  const hash = await bcrypt.hash(b.password, 12);
  const id = await tx(async (db) => {
    const { rows } = await db.query(
      `INSERT INTO users (email, password_hash, name, active_role, is_admin) VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [b.email, hash, b.name, b.role, adminEmails().includes(b.email)]);
    await switchRole(db, rows[0].id, b.role);
    return rows[0].id;
  });
  securityEvent(req, 'register', { provider: 'password' }, id);
  await setSession(res, id);
  await sendState(res, id);
}));

router.post('/auth/login', authLimit, h(async (req, res) => {
  const b = parse(LoginBody, req.body);
  await verifyCaptcha(req, b.captchaToken, 'login');
  const { rows } = await query(`SELECT id, password_hash, is_demo, blocked_at FROM users WHERE email = $1`, [b.email]);
  const u = rows[0];
  if (!u || !(await passwordMatches(b.password, u.password_hash))) {
    securityEvent(req, 'login_failed', { email: b.email }, u?.id ?? null);
    fail(401, 'Неверный email или пароль');
  }
  if (u.blocked_at) {
    securityEvent(req, 'login_blocked', { email: b.email }, u.id);
    fail(403, 'Аккаунт заблокирован. Напишите в поддержку.');
  }
  if (b.role && !u.is_demo) await tx((db) => switchRole(db, u.id, b.role));
  securityEvent(req, 'login_ok', { provider: 'password' }, u.id);
  await setSession(res, u.id);
  await sendState(res, u.id);
}));

router.post('/auth/logout', (req, res) => { clearSession(res); sendState(res, null).catch(() => res.json({ user: null })); });

router.post('/auth/logout-all', requireUser, h(async (req, res) => {
  if (req.user.is_demo) fail(403, 'В демо-аккаунте это недоступно');
  await query(`UPDATE users SET token_version = token_version + 1 WHERE id = $1`, [req.user.id]);
  securityEvent(req, 'logout_all');
  clearSession(res);
  await sendState(res, null);
}));

const PasswordBody = z.object({ current: z.string().max(128).optional(), next: strongPassword });
router.post('/auth/password', requireUser, authLimit, h(async (req, res) => {
  if (req.user.is_demo) fail(403, 'В демо-аккаунте пароль менять нельзя');
  const b = parse(PasswordBody, req.body);
  const { rows } = await query(`SELECT password_hash FROM users WHERE id = $1`, [req.user.id]);
  if (req.user.has_password && !(await passwordMatches(b.current || '', rows[0].password_hash))) {
    securityEvent(req, 'password_change_failed');
    fail(400, 'Текущий пароль указан неверно');
  }
  const hash = await bcrypt.hash(b.next, 12);
  await query(`UPDATE users SET password_hash = $2, token_version = token_version + 1 WHERE id = $1`, [req.user.id, hash]);
  securityEvent(req, 'password_changed');
  await setSession(res, req.user.id);
  await sendState(res, req.user.id);
}));

router.patch('/auth/me', requireUser, h(async (req, res) => {
  const next = parse(z.object({ role }), req.body).role;
  await tx((db) => switchRole(db, req.user.id, next));
  await sendState(res, req.user.id);
}));

export default router;
