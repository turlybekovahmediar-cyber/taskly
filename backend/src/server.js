/* Taskly — сервер. Один процесс отдаёт и API (/api/*), и собранный фронтенд (frontend/dist),
   поэтому всё работает по одной ссылке, без CORS. */
import express from 'express';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { pool } from './db.js';
import { migrate } from './migrate.js';
import { loadUser } from './auth.js';
import { HttpError } from './http.js';
import authRoutes from './routes/auth.js';
import meRoutes from './routes/me.js';
import dealRoutes from './routes/deal.js';

const PROD = process.env.NODE_ENV === 'production';
const DIST = fileURLToPath(new URL('../../frontend/dist', import.meta.url));

const app = express();
app.set('trust proxy', 1); // Render и другие хостинги стоят за прокси — нужно для secure-cookie и лимитов

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      'script-src': ["'self'"],
      'style-src': ["'self'", "'unsafe-inline'"],
      'img-src': ["'self'", 'data:'],
      'upgrade-insecure-requests': PROD ? [] : null,
    },
  },
}));
app.use(express.json({ limit: '100kb' }));
app.use(cookieParser());

/* ---------------- API ---------------- */
app.get('/api/health', async (req, res) => {
  try { await pool.query('SELECT 1'); res.json({ ok: true, db: 'up' }); }
  catch { res.status(503).json({ ok: false, db: 'down' }); }
});
app.use('/api', loadUser, authRoutes, meRoutes, dealRoutes);
app.use('/api', (req, res) => res.status(404).json({ error: 'Нет такого метода API: ' + req.method + ' ' + req.originalUrl }));

/* ---------------- Фронтенд ---------------- */
if (existsSync(DIST)) {
  app.use('/assets', express.static(DIST + '/assets', { immutable: true, maxAge: '1y' }));
  app.use(express.static(DIST, { index: false, maxAge: '1h' }));
  /* SPA: любой другой путь — index.html, маршрут разберёт роутер фронтенда */
  app.get('*', (req, res) => res.sendFile(DIST + '/index.html', { headers: { 'Cache-Control': 'no-cache' } }));
} else {
  app.get('/', (req, res) => res.type('text').send('API работает. Фронтенд не собран: npm --prefix frontend run build (или запустите npm run dev во frontend/).'));
}

/* ---------------- Ошибки ---------------- */
app.use((err, req, res, next) => {
  if (err instanceof HttpError) return res.status(err.status).json({ error: err.message });
  if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Некорректный JSON' });
  if (err.type === 'entity.too.large') return res.status(413).json({ error: 'Слишком большой запрос' });
  if (err.code === '23505') return res.status(409).json({ error: 'Такая запись уже есть' });
  console.error(err);
  res.status(500).json({ error: 'Ошибка сервера. Попробуйте ещё раз.' });
});

const port = Number(process.env.PORT) || 3000;
await migrate();
app.listen(port, () => console.log('Taskly: http://localhost:' + port));
