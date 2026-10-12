import bcrypt from 'bcryptjs';
import { seedEntities, specialists, DEMO_BUSINESS } from '../../frontend/src/data/mock.js';
import { parseLabel } from './time.js';
import { commission } from './money.js';
import { isMain } from './isMain.js';

export const DEMO_PASSWORD = 'taskly2026';
export const DEMO_ACCOUNTS = {
  client: { id: 'c-1', email: 'biz@taskly.demo' },
  specialist: { id: 's-1', email: 'aruzhan@taskly.demo' },
};
const NO_LOGIN = '!';

const LEVEL = { verified: 'verified', experienced: 'experienced', new: 'new' };
const clientIdOf = (id) => (id === 'c-me' ? DEMO_ACCOUNTS.client.id : id);

export async function seedDemo(db) {
  const e = seedEntities();
  const hash = await bcrypt.hash(DEMO_PASSWORD, 10);

  const clients = new Map([[DEMO_ACCOUNTS.client.id, { company: DEMO_BUSINESS.name, verified: true, since: 2025, demo: true }]]);
  for (const p of e.projects) {
    const id = clientIdOf(p.clientId);
    if (!clients.has(id)) clients.set(id, { company: p.client, verified: !!p.verified, since: p.clientSince || 2025 });
  }
  for (const [id, c] of clients) {
    await db.query(
      `INSERT INTO users (id, email, password_hash, name, active_role, is_demo) VALUES ($1, $2, $3, $4, 'client', $5)`,
      [id, c.demo ? DEMO_ACCOUNTS.client.email : id + '@clients.taskly.demo', c.demo ? hash : NO_LOGIN, c.company, !!c.demo]);
    await db.query(
      `INSERT INTO business_profiles (user_id, company, sphere, city, site, verified, since) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [id, c.company, c.demo ? DEMO_BUSINESS.sphere : null, c.demo ? DEMO_BUSINESS.city : null, c.demo ? DEMO_BUSINESS.site : null, c.verified, c.since]);
  }

  for (const s of specialists) {
    const demo = s.id === DEMO_ACCOUNTS.specialist.id;
    await db.query(
      `INSERT INTO users (id, email, password_hash, name, active_role, is_demo) VALUES ($1, $2, $3, $4, 'specialist', $5)`,
      [s.id, demo ? DEMO_ACCOUNTS.specialist.email : s.id + '@specialists.taskly.demo', demo ? hash : NO_LOGIN, s.name, demo]);
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
      [p.id, clientIdOf(p.clientId), p.specialistId, p.title, p.brief, p.result, p.includes, p.excludes, p.materials, p.requirements || '',
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
      const author = m.from === 'client' ? clientIdOf(p.clientId) : m.from === 'specialist' ? p.specialistId : null;
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
      [r.id, r.projectId, r.from, r.from === 'client' ? clientIdOf(p.clientId) : p.specialistId, r.to, r.stars, r.tags, r.text, parseLabel(r.when)]);
  }

  for (const n of e.notifications) {
    await db.query(
      `INSERT INTO notifications (id, user_id, role, link, text, kind, unread, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [n.id, DEMO_ACCOUNTS[n.role].id, n.role, n.to, n.text, n.kind, n.unread, parseLabel(n.when)]);
  }

  for (const id of ['p-1045', 'p-1048']) {
    await db.query(`INSERT INTO saved_projects (user_id, project_id) VALUES ($1, $2)`, [DEMO_ACCOUNTS.specialist.id, id]);
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
    console.log('Демо-данные загружены. Вход: ' + DEMO_ACCOUNTS.client.email + ' / ' + DEMO_ACCOUNTS.specialist.email + ', пароль ' + DEMO_PASSWORD);
  });
  await pool.end();
}
