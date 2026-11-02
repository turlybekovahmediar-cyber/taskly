import { seedEntities, specialists } from '../../frontend/src/data/mock.js';
import { parseLabel } from './time.js';
import { commission } from './money.js';
import { isMain } from './isMain.js';

const NO_LOGIN = '!';
const REMOVED_CLIENT = 'c-me';
const REMOVED_SPECIALIST = 's-1';

const LEVEL = { verified: 'verified', experienced: 'experienced', new: 'new' };

function catalog() {
  const e = seedEntities();
  e.projects = e.projects.filter((p) => p.clientId !== REMOVED_CLIENT && p.specialistId !== REMOVED_SPECIALIST);
  const ids = new Set(e.projects.map((p) => p.id));
  const keep = (x) => ids.has(x.projectId);
  e.proposals = e.proposals.filter((x) => keep(x) && x.specialistId !== REMOVED_SPECIALIST);
  e.messages = Object.fromEntries(Object.entries(e.messages).filter(([id]) => ids.has(id)));
  e.files = Object.fromEntries(Object.entries(e.files).filter(([id]) => ids.has(id)));
  e.changeRequests = e.changeRequests.filter(keep);
  e.reviews = e.reviews.filter(keep);
  return { e, team: specialists.filter((s) => s.id !== REMOVED_SPECIALIST) };
}

export async function seedDemo(db) {
  const { e, team } = catalog();

  const clients = new Map();
  for (const p of e.projects) {
    if (!clients.has(p.clientId)) clients.set(p.clientId, { company: p.client, verified: !!p.verified, since: p.clientSince || 2025 });
  }
  for (const [id, c] of clients) {
    await db.query(
      `INSERT INTO users (id, email, password_hash, name, active_role, is_demo) VALUES ($1, $2, $3, $4, 'client', true)`,
      [id, id + '@clients.taskly.demo', NO_LOGIN, c.company]);
    await db.query(
      `INSERT INTO business_profiles (user_id, company, verified, since) VALUES ($1, $2, $3, $4)`,
      [id, c.company, c.verified, c.since]);
  }

  for (const s of team) {
    await db.query(
      `INSERT INTO users (id, email, password_hash, name, active_role, is_demo) VALUES ($1, $2, $3, $4, 'specialist', true)`,
      [s.id, s.id + '@specialists.taskly.demo', NO_LOGIN, s.name]);
    await db.query(
      `INSERT INTO specialist_profiles (user_id, handle, avatar, headline, about, level, city, availability, response_time,
         directions, skills, verified_via, portfolio, legacy)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
      [s.id, s.handle, s.avatar, s.headline, s.about, LEVEL[s.level] || 'new', s.city, s.availability, s.responseTime,
        s.directions, s.skills, s.verifiedVia, JSON.stringify(s.portfolio),
        JSON.stringify({ completed: s.completed, onTime: s.onTime, successRate: s.successRate, reviews: s.reviews, rating: s.rating,
          reviewList: s.reviewList, archive: s.archive })]);
  }

  for (const p of e.projects) {
    await db.query(
      `INSERT INTO projects (id, client_id, specialist_id, title, brief, result, includes, excludes, materials, requirements,
         price, days, edits, edits_used, level, directions, skills, format, stages, status, stage,
         agreed_price, agreed_days, due_date, paid, other_proposals, review_by_client, review_by_specialist, posted_at, completed_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30)`,
      [p.id, p.clientId, p.specialistId, p.title, p.brief, p.result, p.includes, p.excludes, p.materials, p.requirements || '',
        p.price, p.days, p.edits, p.editsUsed, p.level, p.directions, p.skills, p.format, p.stages, p.status, p.stage,
        p.agreedPrice ?? null, p.agreedDays ?? null, p.dueDate || null, p.paid, p.otherProposals || 0,
        !!p.reviewByClient, !!p.reviewBySpecialist, parseLabel(p.posted), p.completedAt ? parseLabel(p.completedAt) : null]);
    if (p.paid) {
      const c = commission(p.agreedPrice ?? p.price);
      await db.query(
        `INSERT INTO payments (project_id, amount, fee, payout, status, released_at) VALUES ($1, $2, $3, $4, $5, $6)`,
        [p.id, c.price, c.fee, c.payout, p.status === 'done' ? 'released' : 'reserved', p.status === 'done' ? parseLabel(p.completedAt) : null]);
    }
  }

  for (const x of e.proposals) {
    await db.query(
      `INSERT INTO proposals (id, project_id, specialist_id, price, days, message, portfolio, status, read, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [x.id, x.projectId, x.specialistId, x.price, x.days, x.message, x.portfolio, x.status, x.read, parseLabel(x.created)]);
  }

  for (const [projectId, list] of Object.entries(e.messages)) {
    const p = e.projects.find((q) => q.id === projectId);
    for (const m of list) {
      const author = m.from === 'client' ? p.clientId : m.from === 'specialist' ? p.specialistId : null;
      await db.query(
        `INSERT INTO messages (id, project_id, sender, author_id, text, file, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [m.id, projectId, m.from, author, m.text, m.file || null, parseLabel(m.when)]);
    }
  }

  for (const [projectId, list] of Object.entries(e.files)) {
    for (const f of list) {
      await db.query(
        `INSERT INTO files (project_id, name, size, kind, who, final, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [projectId, f.name, f.size, f.kind, f.who, !!f.final, parseLabel(f.when)]);
    }
  }

  for (const c of e.changeRequests) {
    await db.query(
      `INSERT INTO change_requests (id, project_id, proposed_by, status, title, what, note, price_from, price_to, days_from, days_to, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [c.id, c.projectId, c.proposedBy, c.status, c.title, c.what, c.note, c.priceFrom, c.priceTo, c.daysFrom, c.daysTo, parseLabel(c.when)]);
  }

  for (const r of e.reviews) {
    const p = e.projects.find((q) => q.id === r.projectId);
    await db.query(
      `INSERT INTO reviews (id, project_id, from_role, author_id, target_id, stars, tags, text, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [r.id, r.projectId, r.from, r.from === 'client' ? p.clientId : p.specialistId, r.to, r.stars, r.tags, r.text, parseLabel(r.when)]);
  }

}

export const ALL_TABLES = 'saved_projects, notifications, reviews, change_requests, files, messages, payments, proposals, projects, specialist_profiles, business_profiles, users';

export async function resetDemoData(db) {
  await db.query(`DELETE FROM users WHERE email LIKE '%taskly.demo'`);
  await seedDemo(db);
}

export async function resetDemo(db) {
  await db.query(`TRUNCATE ${ALL_TABLES} CASCADE`);
  await seedDemo(db);
}

if (isMain(import.meta.url)) {
  const { tx, pool } = await import('./db.js');
  const { migrate } = await import('./migrate.js');
  await migrate();
  const reset = process.argv.includes('--reset');
  await tx(async (db) => {
    const { rows } = await db.query('SELECT count(*)::int AS n FROM users');
    if (rows[0].n && !reset) { console.log('База уже заполнена. Для полного сброса: npm run seed -- --reset'); return; }
    if (reset) await resetDemo(db); else await seedDemo(db);
    console.log('Каталог заполнен демо-проектами и специалистами');
  });
  await pool.end();
}
