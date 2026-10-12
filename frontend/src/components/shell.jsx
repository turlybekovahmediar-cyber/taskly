/* Taskly — оболочка: шапка, футер, кабинет, демо-панель. */
import React, { useState, useEffect, useRef } from 'react';
import { Icon, useApp, Link, Dropdown, Badge } from './ui.jsx';
import { parseRoute } from '../lib/router.js';
import { shortName } from '../lib/format.js';

/* ------------------------------- Logo ------------------------------- */
function Logo({ to }) {
  return (
    <Link to={to || '/'} className="logo" aria-label="Taskly — на главную">
      <span className="logo-mark">T</span>
      <span className="logo-word">Taskly</span>
    </Link>
  );
}

/* ------------------------------ Header ------------------------------ */
const PUBLIC_NAV = [
  { label: 'Найти проекты', to: '/spec/projects' },
  { label: 'Найти специалистов', to: '/biz/specialists' },
  { label: 'Как это работает', to: '/how' },
  { label: 'Для бизнеса', to: '/business' },
  { label: 'Для специалистов', to: '/specialists' },
];
const CLIENT_NAV = [
  { label: 'Проекты', to: '/biz', match: ['/biz', '/biz/projects', '/biz/workspace', '/biz/history'] },
  { label: 'Найти специалистов', to: '/biz/specialists' },
  { label: 'Сообщения', to: '/biz/messages' },
];
const SPEC_NAV_TOP = [
  { label: 'Найти проекты', to: '/spec/projects' },
  { label: 'Мои проекты', to: '/spec', match: ['/spec', '/spec/workspace', '/spec/proposals', '/spec/history'] },
  { label: 'Сообщения', to: '/spec/messages' },
];

function useIsOn() {
  const app = useApp();
  const { path } = parseRoute(app.route);
  return (n) => {
    if (n.match) return n.match.some((m) => (m === '/biz' || m === '/spec' ? path === m : path === m || path.startsWith(m + '/')));
    return path === n.to || (n.to !== '/' && path.startsWith(n.to + '/'));
  };
}

function Header() {
  const app = useApp();
  const role = app.role;
  const isOn = useIsOn();
  const [burger, setBurger] = useState(false);
  useEffect(() => { setBurger(false); }, [app.route]);

  const unread = role === 'guest' ? 0 : app.entities.notifications.filter((n) => n.role === role && n.unread).length;
  const nav = role === 'client' ? CLIENT_NAV : role === 'specialist' ? SPEC_NAV_TOP : PUBLIC_NAV;
  const accountName = role === 'client' ? app.bizName : shortName(app.me.name);
  const logout = () => { app.setRole('guest'); app.navigate('/'); };
  const switchRole = () => { const next = role === 'client' ? 'specialist' : 'client'; app.setRole(next); app.navigate(next === 'client' ? '/biz' : '/spec'); };

  return (
    <header className="nav">
      <div className="page nav-in">
        <Logo to={role === 'client' ? '/biz' : role === 'specialist' ? '/spec' : '/'} />

        <nav className="nav-links" aria-label="Основная навигация">
          {nav.map((n) => (
            <Link key={n.to} to={n.to} className={'nav-link' + (isOn(n) ? ' is-on' : '')} aria-current={isOn(n) ? 'page' : undefined}>{n.label}</Link>
          ))}
        </nav>

        <div className="grow" />

        <div className="nav-links">
          {role === 'guest' ? (
            <>
              <Link to="/signin" className="nav-link">Войти</Link>
              <Link to="/signup" className="btn btn--primary btn--sm">Регистрация</Link>
            </>
          ) : (
            <>
              <Link to="/notifications" className="btn btn--icon" aria-label={'Уведомления' + (unread ? ', непрочитанных: ' + unread : '')} style={{ position: 'relative' }}>
                <Icon name="bell" size={19} />
                {unread > 0 && <i className="nav-dot" />}
              </Link>
              {role === 'client' && (
                <Link to="/biz/projects/new" className="btn btn--primary btn--sm">Создать проект</Link>
              )}
              <Dropdown label={accountName} variant="ghost" icon={role === 'specialist' ? 'user' : 'briefcase'}>
                <div className="menu-label">{role === 'client' ? 'Аккаунт бизнеса' : 'Аккаунт специалиста'}</div>
                <button type="button" className="menu-item" onClick={() => app.navigate(role === 'client' ? '/biz/profile' : '/spec/profile')}>
                  <Icon name="user" size={16} />{role === 'client' ? 'Профиль компании' : 'Мой профиль'}
                </button>
                <button type="button" className="menu-item" onClick={() => app.navigate(role === 'client' ? '/biz/projects' : '/spec/history')}>
                  <Icon name="list" size={16} />{role === 'client' ? 'Мои проекты' : 'История проектов'}
                </button>
                <button type="button" className="menu-item" onClick={() => app.navigate('/settings')}>
                  <Icon name="settings" size={16} />Настройки аккаунта
                </button>
                <button type="button" className="menu-item" onClick={() => app.navigate('/support')}>
                  <Icon name="help" size={16} />Поддержка
                </button>
                <div className="menu-sep" />
                <button type="button" className="menu-item" onClick={logout}>
                  <Icon name="logout" size={16} />Выйти
                </button>
                <div className="menu-label">Демо-доступ</div>
                <button type="button" className="menu-item" onClick={switchRole}>
                  <Icon name="swap" size={16} />Сменить роль на {role === 'client' ? 'специалиста' : 'бизнес'}
                </button>
              </Dropdown>
            </>
          )}
        </div>

        <button type="button" className="btn btn--icon nav-burger" aria-label="Меню" aria-expanded={burger} onClick={() => setBurger((b) => !b)}>
          <Icon name={burger ? 'x' : 'list'} size={19} />
        </button>
      </div>

      {burger && (
        <div className="page nav-mobile">
          <div className="card card--pad-sm stack g1">
            {nav.map((n) => (
              <Link key={n.to} to={n.to} className={'menu-item' + (isOn(n) ? ' is-on' : '')}>{n.label}</Link>
            ))}
            <div className="menu-sep" />
            {role === 'guest' ? (
              <>
                <Link to="/signin" className="menu-item">Войти</Link>
                <Link to="/signup" className="menu-item">Регистрация</Link>
              </>
            ) : (
              <>
                {role === 'client' && <Link to="/biz/projects/new" className="menu-item">Создать проект</Link>}
                <Link to="/notifications" className="menu-item">Уведомления{unread > 0 && <Badge tone="accent">{unread}</Badge>}</Link>
                <Link to={role === 'client' ? '/biz/profile' : '/spec/profile'} className="menu-item">Профиль</Link>
                <Link to="/settings" className="menu-item">Настройки</Link>
                <button type="button" className="menu-item" onClick={switchRole}>Сменить роль на {role === 'client' ? 'специалиста' : 'бизнес'}</button>
                <button type="button" className="menu-item" onClick={logout}>Выйти</button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

/* ------------------------------ Footer ------------------------------ */
function Footer() {
  const cols = [
    { h: 'Платформа', links: [['Найти проекты', '/spec/projects'], ['Найти специалистов', '/biz/specialists'], ['Как это работает', '/how'], ['Безопасная сделка', '/security']] },
    { h: 'Для бизнеса', links: [['Создать проект', '/biz/projects/new'], ['Личный кабинет', '/biz'], ['Тарифы и комиссия', '/pricing'], ['Поддержка', '/support']] },
    { h: 'Для специалистов', links: [['Найти проекты', '/spec/projects'], ['Создать профиль', '/signup?role=specialist'], ['Как считается комиссия', '/pricing'], ['Советы новичкам', '/how']] },
    { h: 'Компания', links: [['FAQ', '/faq'], ['Условия использования', '/terms'], ['Политика конфиденциальности', '/privacy'], ['Статус платформы', '/support']] },
  ];
  return (
    <footer className="footer">
      <div className="page">
        <div className="footer-grid">
          <div className="footer-col">
            <Logo />
            <p className="t-sm muted" style={{ maxWidth: 260, marginTop: 'var(--s3)' }}>
              Реальные задачи для специалистов.<br />Понятные решения для бизнеса.
            </p>
          </div>
          {cols.map((c) => (
            <div className="footer-col" key={c.h}>
              <h5>{c.h}</h5>
              {c.links.map(([label, to]) => <Link key={label + to} to={to}>{label}</Link>)}
            </div>
          ))}
        </div>
        <div className="footer-bot">
          <span>© 2026 Taskly. Комиссия 5% удерживается только с успешно завершённого проекта.</span>
          <span className="row g4">
            <Link to="/ui-kit">UI-kit</Link>
            <Link to="/map">Карта продукта</Link>
          </span>
        </div>
      </div>
    </footer>
  );
}

/* --------------------------- App shell ----------------------------- */
function Crumbs({ items }) {
  return (
    <nav className="crumbs" aria-label="Хлебные крошки">
      {items.map((c, i) => (
        <React.Fragment key={i}>
          {i > 0 && <span className="sep">/</span>}
          {c.to ? <Link to={c.to}>{c.label}</Link> : <span className="here">{c.label}</span>}
        </React.Fragment>
      ))}
    </nav>
  );
}

function AppShell({ crumbs, title, sub, actions, aside, children, wide, head }) {
  return (
    <>
      <div className="appbar">
        <div className={wide ? 'app' : 'page'} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s4)' }}>
          <div className="appbar-in">
            <div className="grow stack g2">
              {crumbs && <Crumbs items={crumbs} />}
              <div className="row g4 between wrap">
                <div className="stack g1" style={{ minWidth: 0 }}>
                  {head || <h1 className="t-h2">{title}</h1>}
                  {sub && <p className="t-sm muted">{sub}</p>}
                </div>
                {actions && <div className="row g3 wrap appbar-actions">{actions}</div>}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className={wide ? 'app' : 'page'} style={{ paddingTop: 'var(--s8)', paddingBottom: 'var(--s20)' }}>
        {aside ? <div className="shell-2">{aside}<main className="stack g6" style={{ minWidth: 0 }}>{children}</main></div> : <main className="stack g6" style={{ minWidth: 0 }}>{children}</main>}
      </div>
    </>
  );
}

function SideNav({ items, label }) {
  const app = useApp();
  const { path } = parseRoute(app.route);
  return (
    <nav className="side-nav" aria-label={label || 'Разделы кабинета'}>
      {items.map((it, i) => it.sep ? <div className="side-sep" key={'s' + i} /> : it.head ? <div className="side-label" key={'h' + i}>{it.head}</div> : (
        <Link key={it.to + it.label} to={it.to} className={'side-item' + (path === it.to ? ' is-on' : '')} aria-current={path === it.to ? 'page' : undefined}>
          {it.icon && <Icon name={it.icon} size={16} />}
          <span className="grow trunc">{it.label}</span>
          {it.count != null && <span className="count">{it.count}</span>}
        </Link>
      ))}
    </nav>
  );
}

/* -------------------------- Демо-панель -------------------------- */
const ACCENTS = ['#e04e2a', '#c2452f', '#d2691e', '#b4432b'];
const RADII = { 'обычный': ['5px', '7px', '10px', '14px', '20px'], 'скруглённый': ['8px', '11px', '14px', '18px', '24px'], 'строгий': ['2px', '4px', '6px', '8px', '10px'] };
const DENSITY = { 'плотная': ['18px', '24px', '36px', '48px'], 'обычная': ['24px', '32px', '48px', '64px'], 'просторная': ['30px', '40px', '56px', '80px'] };

/* Затемнение HEX-цвета для hover/press состояний акцента */
function shade(hex, k) {
  const n = parseInt(hex.slice(1), 16);
  const f = (v) => Math.max(0, Math.min(255, Math.round(v * (1 - k))));
  return '#' + [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(f).map((v) => v.toString(16).padStart(2, '0')).join('');
}

export function applyTweaks(t) {
  const r = document.documentElement.style;
  r.setProperty('--accent', t.accent);
  r.setProperty('--accent-hover', shade(t.accent, 0.11));
  r.setProperty('--accent-press', shade(t.accent, 0.22));
  const rad = RADII[t.radius] || RADII['обычный'];
  ['--r-xs', '--r-sm', '--r-md', '--r-lg', '--r-xl'].forEach((v, i) => r.setProperty(v, rad[i]));
  const den = DENSITY[t.density] || DENSITY['обычная'];
  ['--s6', '--s8', '--s12', '--s16'].forEach((v, i) => r.setProperty(v, den[i]));
}

function DemoPanel() {
  const app = useApp();
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ right: 20, bottom: 20 });
  const drag = useRef(null);
  const t = app.tweaks;

  useEffect(() => {
    const move = (e) => { const d = drag.current; if (d) setPos({ right: Math.max(8, d.r - (e.clientX - d.x)), bottom: Math.max(8, d.b - (e.clientY - d.y)) }); };
    const up = () => { drag.current = null; };
    window.addEventListener('mousemove', move); window.addEventListener('mouseup', up);
    return () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); };
  }, []);

  if (!open) {
    return (
      <button type="button" className="demo-tag" onClick={() => setOpen(true)} aria-label="Открыть демо-панель">
        <Icon name="settings" size={14} />Демо{app.emptyMode ? ' · пустой аккаунт' : ''}
      </button>
    );
  }

  const go = (role, to) => { app.setRole(role); app.navigate(to); };
  const row = (label, node) => (<div><div className="float-label">{label}</div>{node}</div>);

  return (
    <div className="float-panel" style={{ right: pos.right, bottom: pos.bottom }} role="dialog" aria-label="Демо-панель">
      <div className="float-head" onMouseDown={(e) => {
        if (e.target.closest('button')) return;
        e.preventDefault();
        const box = e.currentTarget.parentElement.getBoundingClientRect();
        drag.current = { x: e.clientX, y: e.clientY, r: window.innerWidth - box.right, b: window.innerHeight - box.bottom };
      }}>
        <strong>Демо-панель</strong>
        <button type="button" className="btn btn--icon btn--sm" onClick={() => setOpen(false)} aria-label="Скрыть панель"><Icon name="x" size={15} /></button>
      </div>
      <div className="float-body">
        {row('Роль в демо', (
          <select className="select" value={app.role} onChange={(e) => {
            const r = e.target.value;
            go(r, r === 'client' ? '/biz' : r === 'specialist' ? '/spec' : '/');
          }}>
            <option value="client">Бизнес (заказчик)</option>
            <option value="specialist">Специалист</option>
            <option value="guest">Гость (выйти)</option>
          </select>
        ))}
        <label className="switch">
          <input type="checkbox" checked={app.emptyMode} onChange={(e) => app.setEmptyMode(e.target.checked)} />
          Пустой аккаунт (empty states)
        </label>
        {row('Акцент', (
          <div className="swatches">
            {ACCENTS.map((c) => (
              <button type="button" key={c} className={'swatch' + (t.accent === c ? ' is-on' : '')} style={{ background: c }}
                onClick={() => app.setTweaks({ accent: c })} aria-label={'Акцент ' + c} aria-pressed={t.accent === c} />
            ))}
          </div>
        ))}
        {row('Плотность интерфейса', (
          <select className="select" value={t.density} onChange={(e) => app.setTweaks({ density: e.target.value })}>
            {Object.keys(DENSITY).map((o) => <option key={o}>{o}</option>)}
          </select>
        ))}
        {row('Радиусы', (
          <select className="select" value={t.radius} onChange={(e) => app.setTweaks({ radius: e.target.value })}>
            {Object.keys(RADII).map((o) => <option key={o}>{o}</option>)}
          </select>
        ))}
        <div className="menu-sep" />
        <div className="stack g1">
          <div className="float-label">Путь по продукту</div>
          <button type="button" className="menu-item" onClick={() => go('client', '/biz')}><Icon name="briefcase" size={15} />Путь бизнеса</button>
          <button type="button" className="menu-item" onClick={() => go('specialist', '/spec')}><Icon name="user" size={15} />Путь специалиста</button>
          <button type="button" className="menu-item" onClick={() => app.navigate('/ui-kit')}><Icon name="grid" size={15} />UI-kit</button>
          <button type="button" className="menu-item" onClick={() => app.navigate('/map')}><Icon name="layers" size={15} />Карта продукта и флоу</button>
          <button type="button" className="menu-item" onClick={async () => { if (await app.resetDemo()) app.toast('Демо-данные восстановлены'); }} disabled={!app.user?.isDemo} title={app.user?.isDemo ? undefined : 'Доступно в демо-аккаунте'}><Icon name="trash" size={15} />Сбросить демо-данные</button>
        </div>
        <p className="float-note">Данные хранятся на сервере. Настройки вида — только в этом браузере.</p>
      </div>
    </div>
  );
}

export { Logo, Header, Footer, AppShell, SideNav, Crumbs, DemoPanel };
