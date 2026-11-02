import express from 'express';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { pool } from './db.js';
import { migrate } from './migrate.js';
import { loadUser } from './auth.js';
import { HttpError } from './http.js';
import { log, requestLogger, securityEvent } from './log.js';
import authRoutes from './routes/auth.js';
import googleRoutes from './routes/google.js';
import meRoutes from './routes/me.js';
import dealRoutes from './routes/deal.js';
import adminRoutes from './routes/admin.js';
import paymentRoutes from './routes/payments.js';
import { PayPalError } from './paypal.js';

const PROD = process.env.NODE_ENV === 'production';
const DIST = fileURLToPath(new URL('../../frontend/dist', import.meta.url));
const RECAPTCHA = ['https://www.google.com/recaptcha/', 'https://www.gstatic.com/recaptcha/'];

const app = express();
app.set('trust proxy', 1);
app.disable('x-powered-by');

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      'default-src': ["'self'"],
      'script-src': ["'self'", ...RECAPTCHA],
      'style-src': ["'self'", "'unsafe-inline'"],
      'img-src': ["'self'", 'data:', 'https://www.gstatic.com'],
      'connect-src': ["'self'", ...RECAPTCHA],
      'frame-src': ['https://www.google.com/recaptcha/', 'https://recaptcha.google.com/recaptcha/'],
      'frame-ancestors': ["'none'"],
      'form-action': ["'self'"],
      'upgrade-insecure-requests': PROD ? [] : null,
    },
  },
  frameguard: { action: 'deny' },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  strictTransportSecurity: { maxAge: 31536000, includeSubDomains: true },
}));
app.use((req, res, next) => {
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=(), usb=()');
  next();
});
app.use(express.json({ limit: '100kb' }));
app.use(cookieParser());

app.get('/api/health', async (req, res) => {
  try { await pool.query('SELECT 1'); res.json({ ok: true, db: 'up' }); }
  catch { res.status(503).json({ ok: false, db: 'down' }); }
});
app.use('/api', requestLogger, loadUser, authRoutes, googleRoutes, meRoutes, dealRoutes, paymentRoutes, adminRoutes);
app.use('/api', (req, res) => res.status(404).json({ error: 'Нет такого метода API: ' + req.method + ' ' + req.originalUrl }));

if (existsSync(DIST)) {
  app.use('/assets', express.static(DIST + '/assets', { immutable: true, maxAge: '1y' }));
  app.use(express.static(DIST, { index: false, maxAge: '1h' }));
  app.get('*', (req, res) => res.sendFile(DIST + '/index.html', { headers: { 'Cache-Control': 'no-cache' } }));
} else {
  app.get('/', (req, res) => res.type('text').send('API работает. Фронтенд не собран: npm --prefix frontend run build (или запустите npm run dev во frontend/).'));
}

app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Некорректный JSON' });
  if (err.type === 'entity.too.large') return res.status(413).json({ error: 'Слишком большой запрос' });
  if (err instanceof PayPalError) {
    log('error', 'paypal_error', { message: err.message, status: err.status, issue: err.issue, path: req.originalUrl });
    return res.status(502).json({ error: 'Платёжная система не ответила: ' + err.message + '. Попробуйте ещё раз через минуту.' });
  }
  const status = err instanceof HttpError || err.expose ? err.status : null;
  if (status === 403) securityEvent(req, 'access_denied', { path: req.originalUrl.split('?')[0], method: req.method });
  if (status) return res.status(status).json({ error: err.message });
  if (err.code === '23505') return res.status(409).json({ error: 'Такая запись уже есть' });
  log('error', 'unhandled_error', { message: err.message, stack: PROD ? undefined : err.stack, path: req.originalUrl });
  res.status(500).json({ error: 'Ошибка сервера. Попробуйте ещё раз.' });
});

const port = Number(process.env.PORT) || 3000;
await migrate();
app.listen(port, () => log('info', 'server_started', { port, env: PROD ? 'production' : 'development' }));
