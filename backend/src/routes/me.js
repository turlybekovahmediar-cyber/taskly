/* Профиль и личные данные текущего пользователя.
   PUT /api/me/draft · PATCH /api/me/business · PATCH /api/me/specialist · PUT|DELETE /api/me/saved/:projectId
   POST /api/notifications/:id/read · POST /api/notifications/read-all · POST /api/demo/reset */
import { Router } from 'express';
import { z } from 'zod';
import { query, tx } from '../db.js';
import { requireUser } from '../auth.js';
import { h, parse, fail, sendState } from '../http.js';
import { resetDemoData } from '../seed.js';

const router = Router();
router.use(['/me', '/notifications', '/demo'], requireUser);

const str = (max) => z.string().trim().max(max);
const list = (max, len = 80) => z.array(z.string().trim().min(1).max(len)).max(max);

/* Черновик мастера создания проекта — сохраняется по ходу заполнения */
router.put('/me/draft', h(async (req, res) => {
  const draft = req.body && typeof req.body === 'object' && Object.keys(req.body).length ? req.body : null;
  if (draft && JSON.stringify(draft).length > 20000) fail(413, 'Черновик слишком большой');
  await query(`UPDATE users SET draft = $2 WHERE id = $1`, [req.user.id, draft]);
  res.json({ ok: true });
}));

const BusinessBody = z.object({
  company: str(120).min(2, 'Название компании не может быть пустым').optional(),
  sphere: str(80).optional(), city: str(80).optional(), site: str(160).optional(), about: str(2000).optional(),
});
router.patch('/me/business', h(async (req, res) => {
  const b = parse(BusinessBody, req.body);
  await query(`INSERT INTO business_profiles (user_id, company) VALUES ($1, $2) ON CONFLICT DO NOTHING`, [req.user.id, b.company || req.user.name]);
  await query(`
    UPDATE business_profiles SET company = coalesce($2, company), sphere = coalesce($3, sphere), city = coalesce($4, city),
      site = coalesce($5, site), about = coalesce($6, about) WHERE user_id = $1`,
    [req.user.id, b.company, b.sphere, b.city, b.site, b.about]);
  await sendState(res, req.user.id);
}));

const SpecialistBody = z.object({
  name: str(120).min(2, 'Укажите имя и фамилию').optional(),
  headline: str(120).optional(), about: str(3000).optional(), city: str(80).optional(), availability: str(80).optional(),
  directions: list(8, 40).optional(), skills: list(20).optional(),
  portfolio: z.array(z.object({ t: str(120).min(1), s: str(200).optional().default(''), ph: str(80).optional().default('работа') })).max(12).optional(),
});
router.patch('/me/specialist', h(async (req, res) => {
  const b = parse(SpecialistBody, req.body);
  await tx(async (db) => {
    await db.query(`INSERT INTO specialist_profiles (user_id) VALUES ($1) ON CONFLICT DO NOTHING`, [req.user.id]);
    if (b.name) await db.query(`UPDATE users SET name = $2 WHERE id = $1`, [req.user.id, b.name]);
    await db.query(`
      UPDATE specialist_profiles SET headline = coalesce($2, headline), about = coalesce($3, about), city = coalesce($4, city),
        availability = coalesce($5, availability), directions = coalesce($6, directions), skills = coalesce($7, skills),
        portfolio = coalesce($8, portfolio)
      WHERE user_id = $1`,
      [req.user.id, b.headline, b.about, b.city, b.availability, b.directions, b.skills, b.portfolio ? JSON.stringify(b.portfolio) : null]);
  });
  await sendState(res, req.user.id);
}));

router.put('/me/saved/:projectId', h(async (req, res) => {
  await query(`INSERT INTO saved_projects (user_id, project_id) SELECT $1, id FROM projects WHERE id = $2 ON CONFLICT DO NOTHING`, [req.user.id, req.params.projectId]);
  await sendState(res, req.user.id);
}));
router.delete('/me/saved/:projectId', h(async (req, res) => {
  await query(`DELETE FROM saved_projects WHERE user_id = $1 AND project_id = $2`, [req.user.id, req.params.projectId]);
  await sendState(res, req.user.id);
}));

router.post('/notifications/:id/read', h(async (req, res) => {
  await query(`UPDATE notifications SET unread = false WHERE id = $2 AND user_id = $1`, [req.user.id, req.params.id]);
  await sendState(res, req.user.id);
}));
router.post('/notifications/read-all', h(async (req, res) => {
  const { role } = parse(z.object({ role: z.enum(['client', 'specialist']) }), req.body);
  await query(`UPDATE notifications SET unread = false WHERE user_id = $1 AND role = $2`, [req.user.id, role]);
  await sendState(res, req.user.id);
}));

/* Сброс базы к демо-данным — только из демо-аккаунта (для подготовки к показу) */
router.post('/demo/reset', h(async (req, res) => {
  if (!req.user.is_demo) fail(403, 'Сброс доступен только в демо-аккаунте');
  await tx(resetDemoData);
  await sendState(res, req.user.id);
}));

export default router;
