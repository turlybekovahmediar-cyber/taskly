import { Router } from 'express';
import { z } from 'zod';
import { tx } from '../db.js';
import { requireUser } from '../auth.js';
import { h, parse, fail, sendState, notify, systemMessage } from '../http.js';
import { commission, money } from '../money.js';

const router = Router();
router.use(['/projects', '/proposals', '/changes'], requireUser);

const OPEN = ['published', 'searching'];
const ACTIVE = ['awaiting_payment', 'in_work', 'on_review', 'needs_fix'];
const STAGES4 = ['Подготовка', 'Основная работа', 'Проверка', 'Финальный результат'];

const priceOf = (p) => p.agreed_price ?? p.price;
const daysOf = (p) => p.agreed_days ?? p.days;
const relation = (p, userId) => (p.client_id === userId ? 'client' : p.specialist_id === userId ? 'specialist' : null);
const workspace = (role, id, section) => (role === 'client' ? '/biz/workspace/' : '/spec/workspace/') + id + (section ? '?s=' + section : '');
const need = (cond, status, message) => { if (!cond) fail(status, message); };
const WRONG_STATUS = 'Действие недоступно на текущем этапе проекта. Обновите страницу.';

async function lockProject(db, id) {
  const { rows } = await db.query(`SELECT * FROM projects WHERE id = $1 FOR UPDATE`, [id]);
  need(rows[0], 404, 'Проект не найден');
  return rows[0];
}
async function lockAs(db, id, user, role) {
  const p = await lockProject(db, id);
  const rel = relation(p, user.id);
  need(rel, 403, 'Нет доступа к этому проекту');
  if (role) need(rel === role, 403, role === 'client' ? 'Это действие доступно только заказчику' : 'Это действие доступно только исполнителю');
  return { p, rel };
}

const str = (min, max, msg) => z.string().trim().min(min, msg).max(max);
const strList = (max, len = 200) => z.array(z.string().trim().min(1).max(len)).max(max);
const int = (min, max, msg) => z.coerce.number({ message: msg }).int(msg).min(min, msg).max(max, msg);

const DraftBody = z.object({
  title: str(4, 140, 'Назовите проект — хотя бы коротко'),
  brief: str(20, 5000, 'Опишите задачу подробнее, минимум 2–3 предложения'),
  result: str(10, 3000, 'Опишите, что должно получиться на выходе'),
  includes: strList(30).default([]),
  excludes: z.union([z.string().max(3000), strList(30)]).default(''),
  materials: strList(30).default([]),
  note: z.string().trim().max(3000).default(''),
  days: int(1, 365, 'Срок — от 1 до 365 дней'),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).or(z.literal('')).nullish(),
  price: int(5000, 100_000_000, 'Минимальная стоимость проекта — 5 000 ₸'),
  edits: int(0, 10, 'Количество правок — от 0 до 10'),
  level: z.enum(['any', 'junior', 'core']).default('any'),
  directions: strList(8, 40).min(1, 'Выберите хотя бы одно направление'),
  skills: strList(20, 80).min(1, 'Выберите хотя бы один навык'),
  format: strList(8, 40).default([]),
  stages: z.boolean().default(true),
});

router.post('/projects', h(async (req, res) => {
  need(req.user.active_role === 'client' && req.user.has_business, 403, 'Публиковать проекты можно из кабинета бизнеса');
  const d = parse(DraftBody, req.body);
  const today = new Date().toISOString().slice(0, 10);
  need(!d.dueDate || d.dueDate >= today, 400, 'Дата дедлайна уже прошла');
  const excludes = Array.isArray(d.excludes) ? d.excludes : d.excludes.split(/\n|,/).map((x) => x.trim()).filter(Boolean);
  const id = await tx(async (db) => {
    const { rows } = await db.query(`
      INSERT INTO projects (client_id, title, brief, result, includes, excludes, materials, requirements,
        price, days, due_date, edits, level, directions, skills, format, stages, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, 'searching') RETURNING id`,
      [req.user.id, d.title, d.brief, d.result, d.includes, excludes, d.materials, d.note,
        d.price, d.days, d.dueDate || null, d.edits, d.level, d.directions, d.skills, d.format, d.stages ? STAGES4 : ['Результат']]);
    await db.query(`UPDATE users SET draft = NULL WHERE id = $1`, [req.user.id]);
    return rows[0].id;
  });
  await sendState(res, req.user.id, { id });
}));

router.post('/projects/:id/proposals/read', h(async (req, res) => {
  await tx(async (db) => {
    await lockAs(db, req.params.id, req.user, 'client');
    await db.query(`
      UPDATE proposals SET read = true, status = CASE WHEN status = 'sent' THEN 'viewed' ELSE status END
      WHERE project_id = $1 AND read = false`, [req.params.id]);
  });
  await sendState(res, req.user.id);
}));

const ApplyBody = z.object({
  price: int(1000, 100_000_000, 'Укажите стоимость'),
  days: int(1, 365, 'Срок — от 1 до 365 дней'),
  message: str(20, 3000, 'Напишите 2–3 предложения: как вы поняли задачу и почему справитесь'),
  portfolio: z.string().trim().max(200).nullish(),
});
router.post('/projects/:id/proposals', h(async (req, res) => {
  need(req.user.active_role === 'specialist' && req.user.has_specialist, 403, 'Откликаться можно из кабинета специалиста');
  const b = parse(ApplyBody, req.body);
  await tx(async (db) => {
    const p = await lockProject(db, req.params.id);
    need(OPEN.includes(p.status), 409, 'Проект уже не принимает отклики');
    need(p.client_id !== req.user.id, 409, 'Нельзя откликнуться на свой проект');
    const dup = await db.query(`SELECT 1 FROM proposals WHERE project_id = $1 AND specialist_id = $2 AND status IN ('sent', 'viewed', 'invited', 'accepted')`, [p.id, req.user.id]);
    need(!dup.rowCount, 409, 'Вы уже откликнулись на этот проект');
    await db.query(`INSERT INTO proposals (project_id, specialist_id, price, days, message, portfolio) VALUES ($1, $2, $3, $4, $5, $6)`,
      [p.id, req.user.id, b.price, b.days, b.message, b.portfolio || null]);
    await notify(db, p.client_id, 'client', '/biz/projects/' + p.id + '/proposals', 'Новый отклик на проект «' + p.title + '» · ' + money(b.price), 'proposal');
  });
  await sendState(res, req.user.id);
}));

const InviteBody = z.object({
  specialistId: z.string().min(1),
  message: str(10, 3000, 'Напишите пару слов о задаче'),
});
router.post('/projects/:id/invite', h(async (req, res) => {
  const b = parse(InviteBody, req.body);
  await tx(async (db) => {
    const { p } = await lockAs(db, req.params.id, req.user, 'client');
    need(OPEN.includes(p.status), 409, 'Проект уже не принимает отклики');
    need(b.specialistId !== req.user.id, 409, 'Нельзя пригласить себя');
    const sp = await db.query(`SELECT 1 FROM specialist_profiles WHERE user_id = $1`, [b.specialistId]);
    need(sp.rowCount, 404, 'Специалист не найден');
    const { rows } = await db.query(`
      SELECT id, status FROM proposals WHERE project_id = $1 AND specialist_id = $2 AND status IN ('sent', 'viewed', 'invited', 'accepted') FOR UPDATE`,
      [p.id, b.specialistId]);
    if (rows[0]) {
      need(rows[0].status !== 'invited', 409, 'Этот специалист уже приглашён');
      await db.query(`UPDATE proposals SET status = 'invited' WHERE id = $1`, [rows[0].id]);
    } else {
      await db.query(`
        INSERT INTO proposals (project_id, specialist_id, price, days, message, status, read) VALUES ($1, $2, $3, $4, $5, 'invited', true)`,
        [p.id, b.specialistId, p.price, p.days, b.message]);
    }
    await notify(db, b.specialistId, 'specialist', '/spec/proposals', 'Вас приглашают в проект «' + p.title + '» · ' + money(p.price), 'invite');
  });
  await sendState(res, req.user.id);
}));

async function lockOwnProposal(db, id, user) {
  const { rows } = await db.query(`SELECT * FROM proposals WHERE id = $1 FOR UPDATE`, [id]);
  need(rows[0], 404, 'Отклик не найден');
  need(rows[0].specialist_id === user.id, 403, 'Это не ваш отклик');
  return rows[0];
}

router.post('/proposals/:id/withdraw', h(async (req, res) => {
  await tx(async (db) => {
    const pr = await lockOwnProposal(db, req.params.id, req.user);
    need(['sent', 'viewed', 'invited'].includes(pr.status), 409, WRONG_STATUS);
    await db.query(`UPDATE proposals SET status = 'withdrawn' WHERE id = $1`, [pr.id]);
    if (pr.status === 'invited') {
      const p = await lockProject(db, pr.project_id);
      await notify(db, p.client_id, 'client', '/biz/projects/' + p.id + '/proposals', 'Специалист отказался от приглашения в проект «' + p.title + '»', 'proposal');
    }
  });
  await sendState(res, req.user.id);
}));

async function assign(db, p, pr) {
  await db.query(`UPDATE proposals SET status = 'accepted', read = true WHERE id = $1`, [pr.id]);
  const others = await db.query(`
    UPDATE proposals SET status = 'declined' WHERE project_id = $1 AND id <> $2 AND status IN ('sent', 'viewed', 'invited')
    RETURNING specialist_id`, [p.id, pr.id]);
  await db.query(`
    UPDATE projects SET status = 'awaiting_payment', specialist_id = $2, agreed_price = $3, agreed_days = $4 WHERE id = $1`,
    [p.id, pr.specialist_id, pr.price, pr.days]);
  for (const o of others.rows) {
    await notify(db, o.specialist_id, 'specialist', '/spec/proposals', 'Заказчик выбрал другого исполнителя для проекта «' + p.title + '»', 'proposal');
  }
}

router.post('/projects/:id/select', h(async (req, res) => {
  const { proposalId } = parse(z.object({ proposalId: z.string().min(1) }), req.body);
  await tx(async (db) => {
    const { p } = await lockAs(db, req.params.id, req.user, 'client');
    need(OPEN.includes(p.status), 409, 'Исполнитель по проекту уже выбран');
    const { rows } = await db.query(`SELECT * FROM proposals WHERE id = $1 AND project_id = $2 FOR UPDATE`, [proposalId, p.id]);
    const pr = rows[0];
    need(pr, 404, 'Отклик не найден');
    need(['sent', 'viewed', 'invited'].includes(pr.status), 409, 'Этот отклик уже неактивен');
    await assign(db, p, pr);
    await notify(db, pr.specialist_id, 'specialist', workspace('specialist', p.id),
      'Вас выбрали исполнителем: «' + p.title + '». Ждём резерв оплаты от заказчика', 'invite');
  });
  await sendState(res, req.user.id);
}));

router.post('/proposals/:id/confirm', h(async (req, res) => {
  await tx(async (db) => {
    const pr = await lockOwnProposal(db, req.params.id, req.user);
    need(pr.status === 'invited', 409, WRONG_STATUS);
    const p = await lockProject(db, pr.project_id);
    need(OPEN.includes(p.status), 409, 'Исполнитель по проекту уже выбран');
    await assign(db, p, pr);
    await notify(db, p.client_id, 'client', workspace('client', p.id),
      'Специалист подтвердил условия по проекту «' + p.title + '» — зарезервируйте оплату', 'invite');
  });
  await sendState(res, req.user.id);
}));

router.post('/projects/:id/payment', h(async (req, res) => {
  await tx(async (db) => {
    const { p } = await lockAs(db, req.params.id, req.user, 'client');
    need(p.status === 'awaiting_payment' && p.specialist_id, 409, WRONG_STATUS);
    const c = commission(priceOf(p));
    await db.query(`INSERT INTO payments (project_id, amount, fee, payout) VALUES ($1, $2, $3, $4)`, [p.id, c.price, c.fee, c.payout]);
    await db.query(`
      UPDATE projects SET status = 'in_work', paid = true, stage = 0, due_date = current_date + $2::int WHERE id = $1`, [p.id, daysOf(p)]);
    await systemMessage(db, p.id, 'Оплата зарезервирована до завершения проекта · ' + money(c.price));
    await notify(db, p.specialist_id, 'specialist', workspace('specialist', p.id),
      'Оплата по проекту «' + p.title + '» зарезервирована — можно начинать работу', 'payment');
  });
  await sendState(res, req.user.id);
}));

router.post('/projects/:id/stages/complete', h(async (req, res) => {
  await tx(async (db) => {
    const { p } = await lockAs(db, req.params.id, req.user, 'specialist');
    need(p.status === 'in_work', 409, WRONG_STATUS);
    const last = Math.max(p.stages.length - 2, 0);
    need(p.stage < last, 409, 'Последний этап закрывается сдачей результата');
    await db.query(`UPDATE projects SET stage = $2 WHERE id = $1`, [p.id, p.stage + 1]);
    await notify(db, p.client_id, 'client', workspace('client', p.id, 'stages'),
      'Этап «' + p.stages[p.stage] + '» по проекту «' + p.title + '» выполнен', 'stage');
  });
  await sendState(res, req.user.id);
}));

const DeliverBody = z.object({
  comment: z.string().trim().max(3000).default(''),
  files: z.array(z.object({ name: str(1, 160), size: z.string().max(20).optional(), kind: z.string().max(10).optional() })).max(10).default([]),
});
router.post('/projects/:id/deliver', h(async (req, res) => {
  const b = parse(DeliverBody, req.body);
  await tx(async (db) => {
    const { p } = await lockAs(db, req.params.id, req.user, 'specialist');
    need(['in_work', 'needs_fix'].includes(p.status), 409, WRONG_STATUS);
    await db.query(`UPDATE projects SET status = 'on_review', stage = GREATEST(stage, $2) WHERE id = $1`, [p.id, Math.max(p.stages.length - 2, 0)]);
    for (const f of b.files) {
      await db.query(`INSERT INTO files (project_id, name, size, kind, who, final) VALUES ($1, $2, $3, $4, 'specialist', true)`, [p.id, f.name, f.size || null, f.kind || null]);
    }
    await db.query(`INSERT INTO messages (project_id, sender, author_id, text, file) VALUES ($1, 'specialist', $2, $3, $4)`,
      [p.id, req.user.id, ('Результат отправлен на проверку. ' + b.comment).trim(), b.files[0]?.name || null]);
    await notify(db, p.client_id, 'client', workspace('client', p.id),
      'Исполнитель отправил результат по проекту «' + p.title + '»', 'delivery');
  });
  await sendState(res, req.user.id);
}));

router.post('/projects/:id/request-fix', h(async (req, res) => {
  const { text } = parse(z.object({ text: str(10, 3000, 'Опишите, что именно поправить') }), req.body);
  await tx(async (db) => {
    const { p } = await lockAs(db, req.params.id, req.user, 'client');
    need(p.status === 'on_review', 409, WRONG_STATUS);
    need(p.edits_used < p.edits, 409, 'Лимит правок по ТЗ исчерпан. Новые требования — через «Предложить изменение задачи».');
    await db.query(`UPDATE projects SET status = 'needs_fix', edits_used = edits_used + 1 WHERE id = $1`, [p.id]);
    await db.query(`INSERT INTO messages (project_id, sender, author_id, text) VALUES ($1, 'client', $2, $3)`, [p.id, req.user.id, 'Запрос правки: ' + text]);
    await notify(db, p.specialist_id, 'specialist', workspace('specialist', p.id), 'Заказчик запросил правку по проекту «' + p.title + '»', 'fix');
  });
  await sendState(res, req.user.id);
}));

router.post('/projects/:id/accept', h(async (req, res) => {
  await tx(async (db) => {
    const { p } = await lockAs(db, req.params.id, req.user, 'client');
    need(p.status === 'on_review', 409, WRONG_STATUS);
    const pay = await db.query(`
      UPDATE payments SET status = 'released', released_at = now() WHERE project_id = $1 AND status = 'reserved' RETURNING amount, fee, payout`, [p.id]);
    const c = pay.rows[0] || commission(priceOf(p));
    await db.query(`UPDATE projects SET status = 'done', stage = $2, completed_at = now() WHERE id = $1`, [p.id, p.stages.length]);
    await systemMessage(db, p.id, 'Работа принята. Исполнителю выплачено ' + money(c.payout) + ' (комиссия Taskly ' + money(c.fee) + ')');
    await notify(db, p.specialist_id, 'specialist', '/spec/payout', 'Выплата ' + money(c.payout) + ' за «' + p.title + '» оформлена', 'payout');
  });
  await sendState(res, req.user.id);
}));

const ReviewBody = z.object({
  stars: int(1, 5, 'Поставьте оценку от 1 до 5'),
  tags: strList(8, 40).default([]),
  text: z.string().trim().max(2000).default(''),
});
router.post('/projects/:id/reviews', h(async (req, res) => {
  const b = parse(ReviewBody, req.body);
  await tx(async (db) => {
    const { p, rel } = await lockAs(db, req.params.id, req.user);
    need(p.status === 'done', 409, 'Отзыв можно оставить после завершения проекта');
    const target = rel === 'client' ? p.specialist_id : p.client_id;
    const r = await db.query(`
      INSERT INTO reviews (project_id, from_role, author_id, target_id, stars, tags, text) VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (project_id, from_role) DO NOTHING RETURNING id`, [p.id, rel, req.user.id, target, b.stars, b.tags, b.text]);
    need(r.rowCount, 409, 'Вы уже оставили отзыв по этому проекту');
    await db.query(`UPDATE projects SET ${rel === 'client' ? 'review_by_client' : 'review_by_specialist'} = true WHERE id = $1`, [p.id]);
    const other = rel === 'client' ? 'specialist' : 'client';
    await notify(db, target, other, other === 'specialist' ? '/spec/reviews' : '/biz/history',
      'Новый отзыв (' + b.stars + ' из 5) по проекту «' + p.title + '»', 'review');
  });
  await sendState(res, req.user.id);
}));

router.post('/projects/:id/messages', h(async (req, res) => {
  const b = parse(z.object({ text: str(1, 3000, 'Сообщение пустое'), file: z.string().max(160).nullish() }), req.body);
  await tx(async (db) => {
    const { rel } = await lockAs(db, req.params.id, req.user);
    await db.query(`INSERT INTO messages (project_id, sender, author_id, text, file) VALUES ($1, $2, $3, $4, $5)`,
      [req.params.id, rel, req.user.id, b.text, b.file || null]);
  });
  await sendState(res, req.user.id);
}));

const ChangeBody = z.object({
  title: str(3, 140, 'Назовите изменение'),
  what: str(10, 3000, 'Опишите, что именно меняется и почему'),
  note: z.string().trim().max(2000).default(''),
  priceTo: int(1000, 100_000_000, 'Укажите стоимость'),
  daysTo: int(1, 365, 'Срок — от 1 до 365 дней'),
});
router.post('/projects/:id/changes', h(async (req, res) => {
  const b = parse(ChangeBody, req.body);
  await tx(async (db) => {
    const { p, rel } = await lockAs(db, req.params.id, req.user);
    need(ACTIVE.includes(p.status), 409, WRONG_STATUS);
    await db.query(`
      INSERT INTO change_requests (project_id, proposed_by, title, what, note, price_from, price_to, days_from, days_to)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`, [p.id, rel, b.title, b.what, b.note, priceOf(p), b.priceTo, daysOf(p), b.daysTo]);
    const other = rel === 'client' ? 'specialist' : 'client';
    await notify(db, other === 'client' ? p.client_id : p.specialist_id, other, workspace(other, p.id, 'changes'),
      (rel === 'client' ? 'Заказчик' : 'Исполнитель') + ' предлагает изменить задачу «' + p.title + '»', 'change');
  });
  await sendState(res, req.user.id);
}));

router.post('/changes/:id/:decision(approve|reject)', h(async (req, res) => {
  const approve = req.params.decision === 'approve';
  await tx(async (db) => {
    const { rows } = await db.query(`SELECT * FROM change_requests WHERE id = $1 FOR UPDATE`, [req.params.id]);
    const cr = rows[0];
    need(cr, 404, 'Изменение не найдено');
    const { p, rel } = await lockAs(db, cr.project_id, req.user);
    need(rel !== cr.proposed_by, 403, 'Решение принимает вторая сторона');
    need(cr.status === 'pending', 409, 'По этому изменению уже принято решение');
    await db.query(`UPDATE change_requests SET status = $2 WHERE id = $1`, [cr.id, approve ? 'approved' : 'rejected']);
    if (approve) {
      await db.query(`
        UPDATE projects SET agreed_price = $2, agreed_days = $3,
          due_date = CASE WHEN due_date IS NULL THEN NULL ELSE due_date + $4::int END WHERE id = $1`,
        [p.id, cr.price_to, cr.days_to, cr.days_to - cr.days_from]);
      const c = commission(cr.price_to);
      await db.query(`UPDATE payments SET amount = $2, fee = $3, payout = $4 WHERE project_id = $1 AND status = 'reserved'`, [p.id, c.price, c.fee, c.payout]);
      await systemMessage(db, p.id, 'Изменение «' + cr.title + '» подтверждено обеими сторонами. Новая стоимость ' + money(cr.price_to));
    }
    const proposer = cr.proposed_by;
    await notify(db, proposer === 'client' ? p.client_id : p.specialist_id, proposer, workspace(proposer, p.id, 'changes'),
      'Изменение «' + cr.title + '» ' + (approve ? 'подтверждено' : 'отклонено'), 'change');
  });
  await sendState(res, req.user.id);
}));

export default router;
