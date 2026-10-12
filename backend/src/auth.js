import jwt from 'jsonwebtoken';
import { query } from './db.js';

const COOKIE = 'taskly_session';
const SECRET = process.env.JWT_SECRET;
if (!SECRET) { console.error('Не задан JWT_SECRET — см. backend/.env.example'); process.exit(1); }
const MAX_AGE = 30 * 24 * 3600 * 1000;

export function setSession(res, userId) {
  const token = jwt.sign({ sub: userId }, SECRET, { expiresIn: '30d' });
  res.cookie(COOKIE, token, {
    httpOnly: true, sameSite: 'lax', path: '/', maxAge: MAX_AGE,
    secure: process.env.NODE_ENV === 'production',
  });
}
export const clearSession = (res) => res.clearCookie(COOKIE, { path: '/' });

export const USER_SQL = `
  SELECT u.id, u.email, u.name, u.active_role, u.is_demo, u.draft,
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
    const { sub } = jwt.verify(token, SECRET);
    const { rows } = await query(USER_SQL, [sub]);
    req.user = rows[0] || null;
    if (!req.user) clearSession(res);
    next();
  } catch (e) {
    if (e.name === 'JsonWebTokenError' || e.name === 'TokenExpiredError') { clearSession(res); return next(); }
    next(e);
  }
}

export const requireUser = (req, res, next) => (req.user ? next() : res.status(401).json({ error: 'Войдите в аккаунт' }));
