/* Подписи времени для интерфейса: «2 часа назад», «26 сентября, 10:02». Часовой пояс — Алматы. */
const TZ = 'Asia/Almaty';

const plural = (n, [one, few, many]) => {
  const a = Math.abs(n) % 100, b = a % 10;
  if (a > 10 && a < 20) return many;
  if (b > 1 && b < 5) return few;
  if (b === 1) return one;
  return many;
};
const UNITS = {
  min: ['минуту', 'минуты', 'минут'],
  hour: ['час', 'часа', 'часов'],
  day: ['день', 'дня', 'дней'],
  week: ['неделю', 'недели', 'недель'],
  month: ['месяц', 'месяца', 'месяцев'],
};
const n_ = (n, u) => n + ' ' + plural(n, UNITS[u]) + ' назад';

export function ago(ts) {
  if (!ts) return '';
  const s = (Date.now() - new Date(ts).getTime()) / 1000;
  if (s < 60) return 'только что';
  const m = Math.floor(s / 60);
  if (m < 60) return n_(m, 'min');
  const h = Math.floor(m / 60);
  if (h < 24) return n_(h, 'hour');
  const d = Math.floor(h / 24);
  if (d === 1) return 'вчера';
  if (d < 7) return n_(d, 'day');
  if (d < 30) return n_(Math.floor(d / 7), 'week');
  return n_(Math.max(1, Math.floor(d / 30)), 'month');
}

const stampFmt = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit', timeZone: TZ });
const dayFmt = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', timeZone: TZ });

export const stamp = (ts) => (ts ? stampFmt.format(new Date(ts)).replace(' в ', ', ') : '');
export const dayLabel = (ts) => (ts ? dayFmt.format(new Date(ts)) : '');
/* «сегодня» для свежих файлов, иначе дата */
export const fileDay = (ts) => (ts && Date.now() - new Date(ts).getTime() < 864e5 && dayFmt.format(new Date(ts)) === dayFmt.format(new Date()) ? 'сегодня' : dayLabel(ts));

/* Обратное преобразование подписей демо-данных («3 часа назад», «26 сентября, 10:02») в дату — нужно только для seed */
const MONTHS = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
export function parseLabel(label) {
  const now = Date.now();
  if (!label || label === 'только что' || label === 'сегодня') return new Date(now);
  if (label === 'вчера') return new Date(now - 864e5);
  const rel = label.match(/^(\d+)?\s*(\S+)\s+назад$/);
  if (rel) {
    const n = Number(rel[1] || 1), w = rel[2];
    const unit = /^мин/.test(w) ? 6e4 : /^час/.test(w) ? 36e5 : /^(день|дн)/.test(w) ? 864e5 : /^недел/.test(w) ? 6048e5 : /^месяц/.test(w) ? 2592e6 : 864e5;
    return new Date(now - n * unit);
  }
  const abs = label.match(/^(\d+)\s+(\S+?)(?:,\s*(\d+):(\d+))?$/);
  if (abs) {
    const mi = MONTHS.indexOf(abs[2]);
    if (mi >= 0) {
      const y = new Date().getFullYear();
      let d = new Date(Date.UTC(y, mi, Number(abs[1]), Number(abs[3] || 12) - 5, Number(abs[4] || 0)));
      if (d.getTime() > now) d = new Date(Date.UTC(y - 1, mi, Number(abs[1]), Number(abs[3] || 12) - 5, Number(abs[4] || 0)));
      return d;
    }
  }
  return new Date(now);
}
