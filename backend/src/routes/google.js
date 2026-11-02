import { Router } from 'express';
import crypto from 'node:crypto';
import { query, tx } from '../db.js';
import { setSession, adminEmails } from '../auth.js';
import { securityEvent, log } from '../log.js';
import { switchRole } from './auth.js';
import { googleEnabled } from '../config.js';

const router = Router();
const STATE_COOKIE = 'taskly_oauth';

const redirectUri = (req) => process.env.GOOGLE_REDIRECT_URI || `${req.protocol}://${req.get('host')}/api/auth/google/callback`;
const home = (role) => (role === 'specialist' ? '/spec' : '/biz');

router.get('/auth/google', (req, res) => {
  if (!googleEnabled()) return res.redirect('/signin?error=google_off');
  const role = req.query.role === 'specialist' ? 'specialist' : 'client';
  const state = crypto.randomBytes(24).toString('base64url');
  res.cookie(STATE_COOKIE, JSON.stringify({ state, role }), {
    httpOnly: true, sameSite: 'lax', path: '/api/auth/google', maxAge: 10 * 60 * 1000,
    secure: process.env.NODE_ENV === 'production',
  });
  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  url.search = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID,
    redirect_uri: redirectUri(req),
    response_type: 'code',
    scope: 'openid email profile',
    state,
    prompt: 'select_account',
  });
  res.redirect(url.toString());
});

router.get('/auth/google/callback', async (req, res) => {
  const fail = (reason) => {
    securityEvent(req, 'google_login_failed', { reason });
    res.redirect('/signin?error=google');
  };
  let saved = {};
  try { saved = JSON.parse(req.cookies?.[STATE_COOKIE] || '{}'); } catch {}
  res.clearCookie(STATE_COOKIE, { path: '/api/auth/google' });
  if (!googleEnabled()) return fail('disabled');
  if (!req.query.code || !saved.state || req.query.state !== saved.state) return fail('bad_state');

  try {
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      body: new URLSearchParams({
        code: String(req.query.code),
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: redirectUri(req),
        grant_type: 'authorization_code',
      }),
      signal: AbortSignal.timeout(8000),
    });
    const token = await tokenRes.json();
    if (!tokenRes.ok || !token.access_token) return fail('token_exchange');

    const infoRes = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
      headers: { Authorization: 'Bearer ' + token.access_token },
      signal: AbortSignal.timeout(8000),
    });
    const info = await infoRes.json();
    if (!infoRes.ok || !info.sub || !info.email || !info.email_verified) return fail('unverified_email');

    const email = info.email.toLowerCase();
    const role = saved.role === 'specialist' ? 'specialist' : 'client';
    const { rows } = await query(`SELECT id, blocked_at, is_demo FROM users WHERE google_sub = $1 OR email = $2 ORDER BY (google_sub = $1) DESC LIMIT 1`, [info.sub, email]);
    let user = rows[0];
    let isNew = false;

    if (user?.is_demo) return fail('demo_account');
    if (user?.blocked_at) {
      securityEvent(req, 'login_blocked', { provider: 'google' }, user.id);
      return res.redirect('/signin?error=blocked');
    }
    if (user) {
      await query(`UPDATE users SET google_sub = $2 WHERE id = $1 AND google_sub IS NULL`, [user.id, info.sub]);
    } else {
      isNew = true;
      user = await tx(async (db) => {
        const r = await db.query(
          `INSERT INTO users (email, password_hash, name, active_role, auth_provider, google_sub, is_admin)
           VALUES ($1, '!', $2, $3, 'google', $4, $5) RETURNING id`,
          [email, (info.name || email.split('@')[0]).slice(0, 120), role, info.sub, adminEmails().includes(email)]);
        await switchRole(db, r.rows[0].id, role);
        return r.rows[0];
      });
      securityEvent(req, 'register', { provider: 'google' }, user.id);
    }

    securityEvent(req, 'login_ok', { provider: 'google' }, user.id);
    await setSession(res, user.id);
    const { rows: cur } = await query(`SELECT active_role FROM users WHERE id = $1`, [user.id]);
    const r = cur[0]?.active_role || role;
    res.redirect(isNew ? (r === 'specialist' ? '/onboarding/specialist' : '/onboarding/business') : home(r));
  } catch (e) {
    log('error', 'google_callback_error', { message: e.message });
    fail('exception');
  }
});

export default router;
