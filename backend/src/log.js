import { query } from './db.js';

export function log(level, event, fields = {}) {
  const line = JSON.stringify({ ts: new Date().toISOString(), level, event, ...fields });
  if (level === 'error') console.error(line);
  else console.log(line);
}

export function securityEvent(req, event, details = {}, userId = req.user?.id ?? null) {
  const ip = req.ip;
  log('warn', 'security.' + event, { userId, ip, ...details });
  query(`INSERT INTO security_events (user_id, event, ip, details) VALUES ($1, $2, $3, $4)`, [userId, event, ip, JSON.stringify(details)])
    .catch((e) => log('error', 'security_event_write_failed', { message: e.message }));
}

export function requestLogger(req, res, next) {
  const started = process.hrtime.bigint();
  res.on('finish', () => {
    const ms = Number(process.hrtime.bigint() - started) / 1e6;
    const level = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info';
    log(level, 'http', {
      method: req.method, path: req.originalUrl.split('?')[0], status: res.statusCode,
      ms: Math.round(ms), userId: req.user?.id ?? null, ip: req.ip,
    });
  });
  next();
}
