/* Taskly — UI-примитивы. Всё, что повторяется на страницах, живёт здесь. */
import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../store/store.jsx';
import { statuses } from '../data/mock.js';
import { commission, money } from '../lib/format.js';
import { navigate } from '../lib/router.js';

/* ============================ Icons ============================ */
const PATHS = {
  search: 'M10.5 4a6.5 6.5 0 1 0 4.6 11.1l3.4 3.4M10.5 4a6.5 6.5 0 0 1 0 13',
  arrowR: 'M4 10h12M11 5l5 5-5 5',
  arrowL: 'M16 10H4M9 5l-5 5 5 5',
  check: 'M4 10.5l4 4 8-9',
  plus: 'M10 4v12M4 10h12',
  x: 'M5 5l10 10M15 5L5 15',
  bell: 'M6 8a4 4 0 1 1 8 0c0 4 1.5 5 1.5 5h-11S6 12 6 8zM8.5 16a1.6 1.6 0 0 0 3 0',
  chat: 'M4 6.5A2.5 2.5 0 0 1 6.5 4h7A2.5 2.5 0 0 1 16 6.5v4A2.5 2.5 0 0 1 13.5 13H9l-3.6 3v-3H6.5A2.5 2.5 0 0 1 4 10.5z',
  folder: 'M3.5 6.5A1.5 1.5 0 0 1 5 5h3l1.6 2H15a1.5 1.5 0 0 1 1.5 1.5v5A1.5 1.5 0 0 1 15 15H5a1.5 1.5 0 0 1-1.5-1.5z',
  layers: 'M10 3l6.5 3.5L10 10 3.5 6.5zM3.5 10.5L10 14l6.5-3.5M3.5 14L10 17.5 16.5 14',
  shield: 'M10 3l6 2.2v4.4c0 3.6-2.5 6.3-6 7.4-3.5-1.1-6-3.8-6-7.4V5.2z',
  chevD: 'M6 8.5l4 4 4-4',
  chevR: 'M8.5 6l4 4-4 4',
  user: 'M10 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM4.5 16.5c0-2.6 2.5-4 5.5-4s5.5 1.4 5.5 4',
  briefcase: 'M3.5 8.5h13v6a1.5 1.5 0 0 1-1.5 1.5H5a1.5 1.5 0 0 1-1.5-1.5zM7.5 8.5V6a1.5 1.5 0 0 1 1.5-1.5h2A1.5 1.5 0 0 1 12.5 6v2.5',
  sparkle: 'M10 3.5l1.6 4.4L16 9.5l-4.4 1.6L10 15.5 8.4 11.1 4 9.5l4.4-1.6z',
  clock: 'M10 5.5V10l3 1.8M10 3a7 7 0 1 0 0 14 7 7 0 0 0 0-14z',
  wallet: 'M3.5 7.5h13v6.5a1.5 1.5 0 0 1-1.5 1.5H5a1.5 1.5 0 0 1-1.5-1.5zM3.5 7.5V6A1.5 1.5 0 0 1 5 4.5h7M13.5 11h1.5',
  calendar: 'M4 6.5A1.5 1.5 0 0 1 5.5 5h9A1.5 1.5 0 0 1 16 6.5v8A1.5 1.5 0 0 1 14.5 16h-9A1.5 1.5 0 0 1 4 14.5zM4 8.5h12M7.5 3.5v3M12.5 3.5v3',
  edit: 'M13.5 4.5l2 2-8 8-3 1 1-3zM12 6l2 2',
  more: 'M5 10h.01M10 10h.01M15 10h.01',
  info: 'M10 9v5M10 6.4h.01M10 3a7 7 0 1 0 0 14 7 7 0 0 0 0-14z',
  alert: 'M10 7.5v3.5M10 14h.01M8.6 3.6 2.9 13.4A1.6 1.6 0 0 0 4.3 16h11.4a1.6 1.6 0 0 0 1.4-2.6L11.4 3.6a1.6 1.6 0 0 0-2.8 0z',
  trash: 'M4.5 6.5h11M8 6.5V5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v1.5M6.5 6.5l.6 8.2a1 1 0 0 0 1 .8h3.8a1 1 0 0 0 1-.8l.6-8.2',
  download: 'M10 4v8M6.5 9l3.5 3.5L13.5 9M4.5 15.5h11',
  upload: 'M10 12.5V4M6.5 7.5 10 4l3.5 3.5M4.5 15.5h11',
  filter: 'M3.5 6h13M6 10h8M8.5 14h3',
  grid: 'M4 4h5v5H4zM11 4h5v5h-5zM4 11h5v5H4zM11 11h5v5h-5z',
  star: 'M10 3.8l1.9 3.9 4.3.6-3.1 3 .7 4.3-3.8-2-3.8 2 .7-4.3-3.1-3 4.3-.6z',
  logout: 'M12.5 6.5V5A1.5 1.5 0 0 0 11 3.5H5A1.5 1.5 0 0 0 3.5 5v10A1.5 1.5 0 0 0 5 16.5h6a1.5 1.5 0 0 0 1.5-1.5v-1.5M8.5 10h8M14 7.5l2.5 2.5L14 12.5',
  settings: 'M10 12.4a2.4 2.4 0 1 0 0-4.8 2.4 2.4 0 0 0 0 4.8zM16 10a6 6 0 0 0-.1-1l1.5-1.1-1.4-2.4-1.8.7a6 6 0 0 0-1.7-1L12.1 3.4h-2.8l-.4 1.8a6 6 0 0 0-1.7 1l-1.8-.7-1.4 2.4L5.5 9a6 6 0 0 0 0 2l-1.5 1.1 1.4 2.4 1.8-.7a6 6 0 0 0 1.7 1l.4 1.8h2.8l.4-1.8a6 6 0 0 0 1.7-1l1.8.7 1.4-2.4L16 11a6 6 0 0 0 .1-1z',
  help: 'M10 13.4h.01M8.2 8.2A2 2 0 0 1 12 8.8c0 1.6-2 1.7-2 3M10 3a7 7 0 1 0 0 14 7 7 0 0 0 0-14z',
  eye: 'M2.8 10S5.4 5.5 10 5.5 17.2 10 17.2 10 14.6 14.5 10 14.5 2.8 10 2.8 10zM10 12a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
  send: 'M3.5 10 16.5 4l-3 12-4-4.5zM9.5 11.5 16.5 4',
  link: 'M8.5 11.5 11.5 8.5M7.8 6.6l1.4-1.4a2.6 2.6 0 0 1 3.7 3.7l-1.4 1.3M12.2 13.4l-1.4 1.4a2.6 2.6 0 0 1-3.7-3.7l1.4-1.3',
  lock: 'M6.5 9V7.5a3.5 3.5 0 0 1 7 0V9M5.5 9h9v6a1.5 1.5 0 0 1-1.5 1.5H7A1.5 1.5 0 0 1 5.5 15z',
  book: 'M4 5.5A1.5 1.5 0 0 1 5.5 4H9v12H5.5A1.5 1.5 0 0 0 4 17.5zM16 5.5A1.5 1.5 0 0 0 14.5 4H11v12h3.5A1.5 1.5 0 0 1 16 17.5z',
  list: 'M6 6h10M6 10h10M6 14h10M3.5 6h.01M3.5 10h.01M3.5 14h.01',
  flag: 'M5.5 16V4.5h8l-1.2 3 1.2 3h-8',
  swap: 'M4.5 7.5h10L12 5M15.5 12.5h-10L10 15',
  card: 'M3.5 7h13v6.5a1.5 1.5 0 0 1-1.5 1.5H5a1.5 1.5 0 0 1-1.5-1.5zM3.5 9.5h13',
  bulb: 'M10 13v1.5M7.5 11.5a3 3 0 1 1 5 0c-.6.7-1 1-1 1.8h-3c0-.8-.4-1.1-1-1.8zM8.5 16h3',
  bookmark: 'M5.5 16V4.5h9V16l-4.5-2.6z',
};

function Icon({ name, size = 20, className = '', style }) {
  const d = PATHS[name] || PATHS.info;
  const filled = name === 'sparkle' || name === 'star';
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}
      style={{ flex: 'none', ...style }} aria-hidden="true">
      <path d={d} stroke={filled ? 'none' : 'currentColor'} fill={filled ? 'currentColor' : 'none'}
        strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ============================ Primitives ============================ */
function Btn({ variant = 'secondary', size, full, icon, iconRight, children, className = '', type = 'button', ...rest }) {
  const cls = ['btn', `btn--${variant}`, size ? `btn--${size}` : '', full ? 'btn--full' : '', className].filter(Boolean).join(' ');
  return (
    <button type={type} className={cls} {...rest}>
      {icon && <Icon name={icon} size={size === 'sm' ? 15 : 17} />}
      {children}
      {iconRight && <Icon name={iconRight} size={size === 'sm' ? 15 : 17} />}
    </button>
  );
}

/* Ссылка с настоящим href: открывается в новой вкладке по Ctrl/Cmd-клику. */
function Link({ to, children, className = '', style, onClick, ...rest }) {
  return (
    <a href={to} className={className} style={style} {...rest}
      onClick={(e) => {
        if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        e.preventDefault();
        onClick && onClick(e);
        navigate(to);
      }}>{children}</a>
  );
}

function Field({ label, hint, error, required, children, id }) {
  return (
    <div className="field">
      {label && <label className="label" htmlFor={id}>{label}{required && <span className="req">*</span>}</label>}
      {children}
      {error ? <span className="err" role="alert">{error}</span> : hint ? <span className="helper">{hint}</span> : null}
    </div>
  );
}

function Tag({ children, tone }) { return <span className={'tag' + (tone ? ` tag--${tone}` : '')}>{children}</span>; }

function Badge({ children, tone, dot }) {
  return <span className={'badge' + (tone ? ` badge--${tone}` : '')}>{dot && <i className="dot" />}{children}</span>;
}

function StatusPill({ id }) {
  const s = statuses[id] || { label: id, tone: 'draft' };
  return <span className={'status status--' + s.tone}>{s.label}</span>;
}

function Avatar({ person, size, round, className = '' }) {
  if (!person) return null;
  const cls = ['avatar', person.avatar || 'avatar--a', size ? `avatar--${size}` : '', round ? 'avatar--round' : '', className].filter(Boolean).join(' ');
  return <div className={cls} aria-hidden="true">{person.initials}</div>;
}

/* Модальное окно: фокус внутрь, Esc закрывает, Tab не уходит за пределы, фон не прокручивается. */
function Modal({ title, sub, onClose, children, footer, wide }) {
  const ref = useRef(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const prevFocus = document.activeElement;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const first = ref.current?.querySelector('input, textarea, select');
    (first || ref.current)?.focus();
    const onKey = (e) => {
      if (e.key === 'Escape') { closeRef.current && closeRef.current(); return; }
      if (e.key !== 'Tab' || !ref.current) return;
      const f = [...ref.current.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')].filter((el) => !el.disabled);
      if (!f.length) return;
      if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
      if (prevFocus && prevFocus.focus && document.contains(prevFocus)) prevFocus.focus();
    };
  }, []);
  return (
    <div className="scrim" onMouseDown={(e) => { if (e.target === e.currentTarget && onClose) onClose(); }}>
      <div ref={ref} tabIndex={-1} className={'modal' + (wide ? ' modal--wide' : '')} role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal-head">
          <div>
            <h3 className="t-h3">{title}</h3>
            {sub && <p className="t-sm muted" style={{ marginTop: 4 }}>{sub}</p>}
          </div>
          <button type="button" className="btn btn--icon" onClick={onClose} aria-label="Закрыть"><Icon name="x" size={17} /></button>
        </div>
        {children}
        {footer && <div className="row g3 end wrap" style={{ marginTop: 'var(--s6)' }}>{footer}</div>}
      </div>
    </div>
  );
}

function Toasts() {
  const app = useApp();
  if (!app.toasts.length) return null;
  return (
    <div className="toasts" role="status" aria-live="polite">
      {app.toasts.map((t) => (
        <div key={t.id} className={'toast' + (t.kind === 'err' ? ' toast--err' : '')}>
          <i className="t-dot" />{t.msg}
        </div>
      ))}
    </div>
  );
}

function Empty({ icon = 'folder', title, text, action, secondary, inline }) {
  return (
    <div className={'empty' + (inline ? ' empty--inline' : '')}>
      <div className="empty-mark"><Icon name={icon} size={22} /></div>
      <h3 className="t-h4">{title}</h3>
      {text && <p>{text}</p>}
      {(action || secondary) && (
        <div className="row g3 wrap center">
          {action}
          {secondary}
        </div>
      )}
    </div>
  );
}

function Skel({ w = '100%', h = 14, r, style }) {
  return <div className="skel" style={{ width: w, height: h, borderRadius: r, ...style }} />;
}

function Ph({ label, variant = 'tall', style, children }) {
  return <div className={'ph' + (variant ? ` ph--${variant}` : '')} style={style}><span>{label}</span>{children}</div>;
}

function Tabs({ value, onChange, items }) {
  return (
    <div className="tabs" role="tablist">
      {items.map((it) => (
        <button type="button" role="tab" aria-selected={value === it.id} key={it.id} className={'tab' + (value === it.id ? ' is-on' : '')} onClick={() => onChange(it.id)}>
          {it.label}{it.count != null && <span className="count">{it.count}</span>}
        </button>
      ))}
    </div>
  );
}

function Stars({ value = 0, size = 14 }) {
  return (
    <span className="row g1" title={value + ' из 5'} aria-label={'Оценка ' + value + ' из 5'}>
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} width={size} height={size} viewBox="0 0 20 20" aria-hidden="true">
          <path d={PATHS.star} fill={i <= Math.round(value) ? 'var(--accent)' : 'var(--surface-3)'} />
        </svg>
      ))}
    </span>
  );
}

function Metric({ value, label }) {
  return <div className="metric"><span className="m-val">{value}</span><span className="m-lab">{label}</span></div>;
}

function Money({ value, strong }) {
  return <span className="num" style={{ fontWeight: strong ? 600 : undefined }}>{money(value)}</span>;
}

/* Расчёт комиссии — везде через commission() */
function FeeCalc({ price, compact, note = true }) {
  const c = commission(price);
  return (
    <div className={'card card--soft' + (compact ? ' card--pad-sm' : '')} style={compact ? undefined : { padding: 'var(--s5)' }}>
      <div className="kv-rows">
        <div className="kv-row"><dt>Ваша цена</dt><dd><Money value={c.price} /></dd></div>
        <div className="kv-row"><dt>Комиссия Taskly 5%</dt><dd style={{ color: 'var(--ink-3)' }}>− <Money value={c.fee} /></dd></div>
        <div className="kv-row kv-row--total"><dt>Вы получите</dt><dd><Money value={c.payout} strong /></dd></div>
      </div>
      {note && <p className="t-cap muted" style={{ marginTop: 'var(--s3)' }}>Комиссия удерживается один раз, после успешного завершения проекта. Заказчик оплачивает согласованную стоимость без дополнительной комиссии.</p>}
    </div>
  );
}

/* Строки «стоимость → комиссия → получит» для панелей условий */
function PayoutRows({ price, label = 'Вы получите', priceLabel = 'Стоимость проекта' }) {
  const c = commission(price);
  return (
    <div className="kv-rows">
      <div className="kv-row"><dt>{priceLabel}</dt><dd><Money value={c.price} /></dd></div>
      <div className="kv-row"><dt>Комиссия Taskly 5%</dt><dd className="muted">− <Money value={c.fee} /></dd></div>
      <div className="kv-row kv-row--total"><dt>{label}</dt><dd><Money value={c.payout} strong /></dd></div>
    </div>
  );
}

function Rail({ stage, total }) {
  return <div className="rail" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={Math.min(stage, total)}>{[...Array(total)].map((_, i) => (
    <div key={i} className={'rail-seg' + (i < stage ? ' is-done' : i === stage ? ' is-now' : '')} />
  ))}</div>;
}

/* paid=false — оплата ещё не зарезервирована, честно об этом говорим */
function SafeNote({ amount, compact, paid = true }) {
  if (!paid) {
    return (
      <div className="note" style={{ alignItems: 'center' }}>
        <Icon name="shield" size={compact ? 15 : 17} />
        <div className="grow">
          <strong>Оплата пока не списывается.</strong> Резервирование — после выбора исполнителя и подтверждения условий.
        </div>
      </div>
    );
  }
  return (
    <div className="note note--ok" style={{ alignItems: 'center' }}>
      <Icon name="shield" size={compact ? 15 : 17} />
      <div className="grow">
        <strong>Оплата зарезервирована до завершения проекта.</strong>
        {amount ? <> Сумма {money(amount)} списана с карты заказчика и зарезервирована платёжной системой. </> : ' '}
        {!compact && 'Специалист получает оплату после подтверждения результата.'}
      </div>
    </div>
  );
}

function Dropdown({ label, children, align = 'right', variant = 'secondary', icon, size, ariaLabel }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onKey); };
  }, [open]);
  return (
    <div ref={ref} style={{ position: 'relative', minWidth: 0 }}>
      <button type="button" className={`btn btn--${variant}` + (icon && !label ? ' btn--icon' : '') + (size ? ` btn--${size}` : '')}
        style={{ maxWidth: '100%' }}
        aria-expanded={open} aria-haspopup="menu" aria-label={ariaLabel || (typeof label === 'string' ? label : undefined)} onClick={() => setOpen((o) => !o)}>
        {icon && <Icon name={icon} size={17} />}{label && <span className="trunc">{label}</span>}
      </button>
      {open && (
        <div className="menu" role="menu" style={align === 'right' ? { right: 0 } : { left: 0 }} onClick={() => setOpen(false)}>{children}</div>
      )}
    </div>
  );
}

/* Для функций, которые появятся вместе с бэкендом (загрузка файлов, PDF и т. п.) */
function useSoon() {
  const app = useApp();
  return (what) => app.toast((what ? what + ': ' : '') + 'появится после подключения сервера');
}

export { Icon, useApp, Btn, Link, Field, Tag, Badge, StatusPill, Avatar, Modal, Toasts, Empty, Skel, Ph, Tabs, Stars, Metric, Money, FeeCalc, PayoutRows, Rail, SafeNote, Dropdown, useSoon, commission, PATHS };

