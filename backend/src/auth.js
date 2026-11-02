import jwt from 'jsonwebtoken';
import { query } from './db.js';

const COOKIE = 'taskly_session';
const SECRET = process.env.JWT_SECRET;
if (!SECRET) { console.error('Не задан JWT_SECRET — см. backend/.env.example'); process.exit(1); }
const MAX_AGE = 30 * 24 * 3600 * 1000;

export const adminEmails = () => (process.env.ADMIN_EMAILS || '').split(',').map((e) => e.trim().toLowerCase()).filter(Boolean);

export async function setSession(res, userId) {
  const { rows } = await query(`UPDATE users SET last_login_at = now() WHERE id = $1 RETURNING token_version`, [userId]);
  const token = jwt.sign({ sub: userId, v: rows[0]?.token_version ?? 0 }, SECRET, { expiresIn: '30d' });
  res.cookie(COOKIE, token, {
    httpOnly: true, sameSite: 'lax', path: '/', maxAge: MAX_AGE,
    secure: process.env.NODE_ENV === 'production',
  });
}
export const clearSession = (res) => res.clearCookie(COOKIE, { path: '/' });

export const USER_SQL = `
  SELECT u.id, u.email, u.name, u.active_role, u.is_demo, u.draft, u.is_admin, u.auth_provider, u.token_version, u.blocked_at,
         (u.password_hash LIKE '$2%') AS has_password,
         bp.company, bp.sphere, bp.city, bp.site, bp.about, (bp.user_id IS NOT NULL) AS has_business, (sp.user_id IS NOT NULL) AS has_specialist
  FROM users u
  LEFT JOIN business_profiles bp ON bp.user_id = u.id
  LEFT JOIN specialist_profiles sp ON sp.user_id = u.id
  WHERE u.id = $1`;

export async function loadUser(req, res, next) {
  req.user = null;
  const token = req.cookies?.[COOKIE];
  if (!token) return next();
  try {
    const { sub, v = 0 } = jwt.verify(token, SECRET);
    const { rows } = await query(USER_SQL, [sub]);
    const user = rows[0];
    if (user && user.token_version === v && !user.blocked_at) req.user = user;
    else clearSession(res);
    next();
  } catch (e) {
    if (e.name === 'JsonWebTokenError' || e.name === 'TokenExpiredError') { clearSession(res); return next(); }
    next(e);
  }
}

export const requireUser = (req, res, next) => (req.user ? next() : res.status(401).json({ error: 'Войдите в аккаунт' }));

export function requireAdmin(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Войдите в аккаунт' });
  if (!req.user.is_admin) return next(Object.assign(new Error('Доступ только для администратора'), { status: 403, expose: true }));
  next();
}
