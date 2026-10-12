export const FEE = 0.05;
export const commission = (price) => {
  const p = Math.max(0, Math.round(Number(price) || 0));
  const fee = Math.round(p * FEE);
  return { price: p, fee, payout: p - fee };
};

export const money = (n) => Math.round(Number(n) || 0).toLocaleString('ru-RU') + ' ₸';

export function plural(n, [one, few, many]) {
  const a = Math.abs(n) % 100;
  const b = a % 10;
  if (a > 10 && a < 20) return many;
  if (b > 1 && b < 5) return few;
  if (b === 1) return one;
  return many;
}
export const pluralN = (n, forms) => n + ' ' + plural(n, forms);

export const W = {
  day: ['день', 'дня', 'дней'],
  proposal: ['отклик', 'отклика', 'откликов'],
  project: ['проект', 'проекта', 'проектов'],
  review: ['отзыв', 'отзыва', 'отзывов'],
  round: ['круг', 'круга', 'кругов'],
  task: ['задача', 'задачи', 'задач'],
  file: ['файл', 'файла', 'файлов'],
  skill: ['навык', 'навыка', 'навыков'],
  work: ['работа', 'работы', 'работ'],
  record: ['запись', 'записи', 'записей'],
  specialist: ['специалист', 'специалиста', 'специалистов'],
  stage: ['этап', 'этапа', 'этапов'],
};

export function daysLabel(days) {
  if (!days) return '—';
  if (days % 30 === 0) return pluralN(days / 30, ['месяц', 'месяца', 'месяцев']);
  if (days % 7 === 0) return pluralN(days / 7, ['неделя', 'недели', 'недель']);
  return pluralN(days, W.day);
}

export const editsLabel = (n) => (n ? pluralN(n, W.round) + ' правок' : 'Без правок');

export function parseDate(iso) {
  if (!iso) return null;
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}
export function toISO(date) {
  const p = (n) => String(n).padStart(2, '0');
  return date.getFullYear() + '-' + p(date.getMonth() + 1) + '-' + p(date.getDate());
}
export function addDays(iso, n) {
  const d = iso ? parseDate(iso) : new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + n);
  return toISO(d);
}
export const today = () => toISO(new Date());
export function dateLabel(iso) {
  const d = parseDate(iso);
  return d ? d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' }) : '—';
}
export function daysLeft(iso) {
  const d = parseDate(iso);
  if (!d) return null;
  const now = parseDate(today());
  return Math.round((d - now) / 86400000);
}
export function daysLeftLabel(iso) {
  const n = daysLeft(iso);
  if (n == null) return '—';
  if (n === 0) return 'Сегодня';
  if (n < 0) return 'Просрочен на ' + pluralN(-n, W.day);
  return pluralN(n, W.day);
}
export const nowLabel = () => new Date().toLocaleString('ru-RU', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });

export const ratingLabel = (r) => (r == null ? '—' : String(r.toFixed(1)).replace('.', ','));
export const initials = (name) => (name || '').split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || '—';
export const shortName = (name) => { const [a, b] = (name || '').split(' '); return b ? a + ' ' + b[0] + '.' : a || ''; };
