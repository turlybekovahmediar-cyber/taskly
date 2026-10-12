/* Снимок данных для фронтенда — ровно то, что текущему пользователю можно видеть.
   Форма совпадает с entities во frontend/src/store/store.jsx, поэтому страницы не пришлось переписывать.
   Гость видит каталог открытых проектов, специалистов и отзывы. */
import { query } from './db.js';
import { ago, stamp, dayLabel, fileDay } from './time.js';

const LEVEL_NAME = { new: 'Новый специалист', verified: 'Проверенный специалист', experienced: 'Опытный на Taskly' };
const initials = (name) => (name || '').split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || '—';
const groupBy = (rows, key, map) => rows.reduce((acc, r) => { (acc[r[key]] ||= []).push(map(r)); return acc; }, {});

export function serializeSpecialist(r, withEmail) {
  const L = r.legacy || {};
  const reviewsCount = (L.reviews || 0) + r.review_count;
  const ratingSum = (L.rating || 0) * (L.reviews || 0) + r.review_sum;
  return {
    id: r.id, name: r.name, initials: initials(r.name), avatar: r.avatar, handle: r.handle || '',
    ...(withEmail ? { email: r.email } : {}),
    headline: r.headline, level: r.level, levelName: LEVEL_NAME[r.level] || LEVEL_NAME.new, about: r.about,
    directions: r.directions, skills: r.skills, city: r.city,
    completed: (L.completed || 0) + r.done_count,
    onTime: L.onTime ?? (r.done_count ? 100 : null),
    successRate: L.successRate ?? (r.done_count ? 100 : null),
    reviews: reviewsCount,
    rating: reviewsCount ? Math.round((ratingSum / reviewsCount) * 10) / 10 : null,
    responseTime: r.response_time, verifiedVia: r.verified_via, availability: r.availability,
    portfolio: r.portfolio || [], reviewList: L.reviewList || [], archive: L.archive || [],
  };
}

export const SPECIALISTS_SQL = `
  SELECT u.id, u.name, u.email, sp.*,
    (SELECT count(*) FROM projects p WHERE p.specialist_id = u.id AND p.status = 'done')::int AS done_count,
    (SELECT count(*) FROM reviews r WHERE r.target_id = u.id AND r.from_role = 'client')::int AS review_count,
    (SELECT coalesce(sum(stars), 0) FROM reviews r WHERE r.target_id = u.id AND r.from_role = 'client')::int AS review_sum
  FROM users u JOIN specialist_profiles sp ON sp.user_id = u.id`;

function serializeProject(r, me, visibleProposals) {
  return {
    id: r.id, title: r.title, client: r.company, clientId: r.client_id, mine: !!me && r.client_id === me,
    verified: r.verified, clientSince: r.since,
    brief: r.brief, result: r.result, includes: r.includes, excludes: r.excludes, materials: r.materials, requirements: r.requirements,
    price: r.price, days: r.days, edits: r.edits, editsUsed: r.edits_used, level: r.level,
    directions: r.directions, skills: r.skills, format: r.format, stages: r.stages,
    status: r.status, stage: r.stage, specialistId: r.specialist_id, paid: r.paid,
    agreedPrice: r.agreed_price, agreedDays: r.agreed_days, dueDate: r.due_date,
    reviewByClient: r.review_by_client, reviewBySpecialist: r.review_by_specialist,
    completedAt: r.completed_at ? dayLabel(r.completed_at) : undefined,
    posted: ago(r.posted_at),
    /* Отклики, которых этот пользователь не видит (чужие), показываются только числом */
    otherProposals: r.other_proposals + Math.max(0, r.proposals_total - (visibleProposals[r.id] || 0)),
  };
}

export async function buildState(user) {
  const me = user?.id ?? null;
  const [projects, proposals, messages, files, changes, reviews, notifications, specialists, saved] = await Promise.all([
    query(`
      SELECT p.*, bp.company, bp.verified, bp.since,
        (SELECT count(*) FROM proposals x WHERE x.project_id = p.id AND x.status <> 'withdrawn')::int AS proposals_total
      FROM projects p JOIN business_profiles bp ON bp.user_id = p.client_id
      WHERE p.status IN ('published', 'searching') OR p.client_id = $1 OR p.specialist_id = $1
      ORDER BY p.posted_at DESC`, [me]),
    query(`
      SELECT x.* FROM proposals x JOIN projects p ON p.id = x.project_id
      WHERE p.client_id = $1 OR x.specialist_id = $1 ORDER BY x.created_at DESC`, [me]),
    query(`
      SELECT m.* FROM messages m JOIN projects p ON p.id = m.project_id
      WHERE p.client_id = $1 OR p.specialist_id = $1 ORDER BY m.created_at, m.id`, [me]),
    query(`
      SELECT f.* FROM files f JOIN projects p ON p.id = f.project_id
      WHERE p.client_id = $1 OR p.specialist_id = $1 ORDER BY f.created_at`, [me]),
    query(`
      SELECT c.* FROM change_requests c JOIN projects p ON p.id = c.project_id
      WHERE p.client_id = $1 OR p.specialist_id = $1 ORDER BY c.created_at DESC`, [me]),
    query(`SELECT r.*, p.client_id FROM reviews r JOIN projects p ON p.id = r.project_id ORDER BY r.created_at DESC`),
    query(`SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 100`, [me]),
    query(SPECIALISTS_SQL + ' ORDER BY u.created_at, u.id'),
    query(`SELECT project_id FROM saved_projects WHERE user_id = $1`, [me]),
  ]);

  const visible = proposals.rows.reduce((acc, x) => { acc[x.project_id] = (acc[x.project_id] || 0) + (x.status === 'withdrawn' ? 0 : 1); return acc; }, {});

  return {
    user: user ? {
      id: user.id, email: user.email, name: user.name, role: user.active_role, isDemo: user.is_demo,
      company: user.company, business: user.has_business ? { company: user.company, sphere: user.sphere, city: user.city, site: user.site, about: user.about } : null, hasBusiness: user.has_business, hasSpecialist: user.has_specialist,
    } : null,
    draft: user?.draft ?? null,
    savedProjects: saved.rows.map((r) => r.project_id),
    specialists: specialists.rows.map((r) => serializeSpecialist(r, r.id === me)),
    entities: {
      projects: projects.rows.map((r) => serializeProject(r, me, visible)),
      proposals: proposals.rows.map((x) => ({
        id: x.id, projectId: x.project_id, specialistId: x.specialist_id, price: x.price, days: x.days,
        message: x.message, portfolio: x.portfolio, status: x.status, read: x.read, created: ago(x.created_at),
      })),
      messages: groupBy(messages.rows, 'project_id', (m) => ({ id: m.id, from: m.sender, text: m.text, file: m.file || undefined, when: stamp(m.created_at) })),
      files: groupBy(files.rows, 'project_id', (f) => ({ name: f.name, size: f.size, kind: f.kind, who: f.who, final: f.final, when: fileDay(f.created_at) })),
      changeRequests: changes.rows.map((c) => ({
        id: c.id, projectId: c.project_id, proposedBy: c.proposed_by, status: c.status, title: c.title, what: c.what, note: c.note,
        priceFrom: c.price_from, priceTo: c.price_to, daysFrom: c.days_from, daysTo: c.days_to, when: dayLabel(c.created_at),
      })),
      reviews: reviews.rows.map((r) => ({
        id: r.id, projectId: r.project_id, from: r.from_role, to: r.target_id, stars: r.stars, tags: r.tags, text: r.text, when: ago(r.created_at),
      })),
      notifications: notifications.rows.map((n) => ({
        id: n.id, role: n.role, to: n.link, text: n.text, kind: n.kind, unread: n.unread, when: ago(n.created_at),
      })),
    },
  };
}
