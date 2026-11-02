import React, { useCallback, useEffect, useState } from 'react';
import { Icon, useApp, Btn, Badge, Tabs, Metric, Empty, Skel } from '../components/ui.jsx';
import { AppShell } from '../components/shell.jsx';
import { api } from '../lib/api.js';
import { money } from '../lib/format.js';
import { statuses } from '../data/mock.js';

const EVENT_NAMES = {
  login_ok: ['Успешный вход', 'ok'],
  login_failed: ['Неудачный вход', 'stop'],
  login_blocked: ['Вход заблокированного', 'stop'],
  register: ['Регистрация', 'info'],
  rate_limited: ['Превышен лимит попыток', 'stop'],
  captcha_failed: ['Капча не пройдена', 'stop'],
  captcha_missing: ['Запрос без капчи', 'warn'],
  access_denied: ['Отказано в доступе (403)', 'warn'],
  google_login_failed: ['Ошибка входа через Google', 'warn'],
  password_changed: ['Смена пароля', 'info'],
  password_change_failed: ['Неверный текущий пароль', 'warn'],
  logout_all: ['Выход со всех устройств', 'info'],
  admin_block_user: ['Админ заблокировал', 'warn'],
  admin_unblock_user: ['Админ разблокировал', 'info'],
  admin_demo_reset: ['Пересоздан демо-каталог', 'info'],
  admin_refund: ['Возврат оплаты админом', 'warn'],
  webhook_rejected: ['Отклонён поддельный webhook', 'stop'],
};

const PAY_STATUS = {
  pending: ['Ожидает оплаты', 'warn'],
  reserved: ['В резерве', 'info'],
  released: ['Выплачено', 'ok'],
  refunded: ['Возвращено', 'stop'],
  failed: ['Ошибка оплаты', 'stop'],
  cancelled: ['Отменено', undefined],
};

const usdLabel = (v) => 'USD ' + Number(v).toFixed(2);

function Overview({ data }) {
  const { users, projects, money: m, funnel, week } = data;
  const active = (projects.awaiting_payment || 0) + (projects.in_work || 0) + (projects.on_review || 0) + (projects.needs_fix || 0);
  return (
    <div className="stack g5">
      <div className="card card--pad-lg stack g5">
        <h3 className="t-h4">Ключевые показатели</h3>
        <div className="grid-4">
          <Metric value={users.real} label="Реальных пользователей" />
          <Metric value={money(m.gmv)} label="Оборот завершённых сделок" />
          <Metric value={money(m.revenue)} label="Выручка Taskly (5%)" />
          <Metric value={money(m.escrow)} label="Сейчас в резерве" />
        </div>
      </div>
      <div className="grid-2">
        <div className="card card--pad-lg stack g4">
          <h3 className="t-h4">Пользователи</h3>
          <div className="kv-rows">
            <div className="kv-row"><dt>Всего, включая демо-каталог</dt><dd>{users.total}</dd></div>
            <div className="kv-row"><dt>Профилей бизнеса</dt><dd>{users.businesses}</dd></div>
            <div className="kv-row"><dt>Профилей специалистов</dt><dd>{users.specialists}</dd></div>
            <div className="kv-row"><dt>Вошли через Google</dt><dd>{users.google}</dd></div>
            <div className="kv-row"><dt>Заблокировано</dt><dd>{users.blocked}</dd></div>
          </div>
        </div>
        <div className="card card--pad-lg stack g4">
          <h3 className="t-h4">За 7 дней</h3>
          <div className="kv-rows">
            <div className="kv-row"><dt>Новых пользователей</dt><dd>{week.new_users}</dd></div>
            <div className="kv-row"><dt>Активных пользователей</dt><dd>{week.active_users}</dd></div>
            <div className="kv-row"><dt>Новых проектов</dt><dd>{week.new_projects}</dd></div>
            <div className="kv-row"><dt>Новых откликов</dt><dd>{week.new_proposals}</dd></div>
          </div>
        </div>
      </div>
      <div className="grid-2">
        {[['Воронка бизнеса', funnel.business], ['Воронка специалистов', funnel.specialist]].map(([title, steps]) => (
          <div className="card card--pad-lg stack g4" key={title}>
            <h3 className="t-h4">{title}</h3>
            <div className="stack g3">
              {steps.map((s, i) => (
                <div className="stack g2" key={s.step}>
                  <div className="row between g3"><span className="t-sm">{s.step}</span><strong className="t-sm num">{s.n}{i > 0 ? ' · ' + s.pct + '%' : ''}</strong></div>
                  <div className="meter"><i style={{ width: (i === 0 ? 100 : s.pct) + '%' }} /></div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="card card--pad-lg stack g4">
        <h3 className="t-h4">Проекты по статусам</h3>
        <div className="row g3 wrap">
          {Object.keys(statuses).filter((k) => projects[k]).map((k) => <Badge key={k} tone={statuses[k].tone} dot>{statuses[k].label}: {projects[k]}</Badge>)}
        </div>
        <p className="t-cap muted">Активных сделок сейчас: {active}. Выплачено сделок: {m.paid_out}.</p>
      </div>
    </div>
  );
}

function Users() {
  const app = useApp();
  const [q, setQ] = useState('');
  const [list, setList] = useState(null);
  const load = useCallback(() => api('GET', '/admin/users?q=' + encodeURIComponent(q)).then((r) => setList(r.users)).catch((e) => app.toast(e.message, 'err')), [q]);
  useEffect(() => { const t = setTimeout(load, 250); return () => clearTimeout(t); }, [load]);
  const toggle = async (u) => {
    try {
      await api('POST', '/admin/users/' + u.id + '/' + (u.blocked ? 'unblock' : 'block'), {});
      app.toast(u.blocked ? 'Пользователь разблокирован' : 'Пользователь заблокирован, его сеансы завершены');
      load();
    } catch (e) { app.toast(e.message, 'err'); }
  };
  return (
    <div className="card card--pad-lg stack g5">
      <input className="input input--search" placeholder="Поиск по email или имени" value={q} onChange={(e) => setQ(e.target.value)} />
      {!list ? <Skel h={240} /> : list.length === 0 ? <Empty inline icon="search" title="Никого не нашли" /> : (
        <div className="rows">
          {list.map((u) => (
            <div className="row-item" key={u.id} style={{ cursor: 'default', flexWrap: 'wrap' }}>
              <span className="avatar"><Icon name={u.role === 'client' ? 'briefcase' : 'user'} size={16} /></span>
              <span className="stack g1 grow" style={{ minWidth: 220 }}>
                <span className="t-sm"><strong>{u.name}</strong> · {u.email}</span>
                <span className="t-cap muted">
                  {u.role === 'client' ? 'Бизнес' : 'Специалист'} · {u.provider === 'google' ? 'Google' : 'Email'} · регистрация {u.created} · вход {u.lastLogin} · проектов {u.projects}, откликов {u.proposals}
                </span>
              </span>
              <span className="row g2">
                {u.isAdmin && <Badge tone="accent">Админ</Badge>}
                {u.isDemo && <Badge>Демо-каталог</Badge>}
                {u.blocked && <Badge tone="stop" dot>Заблокирован</Badge>}
                {!u.isAdmin && !u.isDemo && (
                  <Btn size="sm" variant={u.blocked ? 'secondary' : 'danger'} onClick={() => toggle(u)}>{u.blocked ? 'Разблокировать' : 'Заблокировать'}</Btn>
                )}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Payments() {
  const app = useApp();
  const [list, setList] = useState(null);
  const load = () => api('GET', '/admin/payments').then((r) => setList(r.payments)).catch((e) => app.toast(e.message, 'err'));
  useEffect(() => { load(); }, []);
  const refund = async (x) => {
    if (!window.confirm('Вернуть ' + money(x.amount) + ' заказчику и отменить проект «' + x.title + '»?')) return;
    try { await api('POST', '/admin/payments/' + x.id + '/refund', {}); app.toast('Оплата возвращена, проект отменён'); load(); }
    catch (e) { app.toast(e.message, 'err'); }
  };
  return (
    <div className="card card--pad-lg stack g5">
      <div className="row between g3"><p className="t-sm muted">Возврат доступен, пока оплата в резерве — до приёмки работы.</p><Btn size="sm" icon="refresh" onClick={load}>Обновить</Btn></div>
      {!list ? <Skel h={240} /> : list.length === 0 ? <Empty inline icon="wallet" title="Платежей пока нет" /> : (
        <div className="rows">
          {list.map((x) => {
            const [label, tone] = PAY_STATUS[x.status] || [x.status];
            return (
              <div className="row-item" key={x.id} style={{ cursor: 'default', flexWrap: 'wrap' }}>
                <span className="stack g1 grow" style={{ minWidth: 240 }}>
                  <span className="t-sm"><strong>{x.title}</strong> · {x.client}</span>
                  <span className="t-cap muted num">
                    {money(x.amount)}{x.usd ? ' (' + usdLabel(x.usd) + ')' : ''} · комиссия {money(x.fee)} · {x.provider === 'paypal' ? 'PayPal' : 'демо'} · {x.when}
                  </span>
                </span>
                <span className="row g2">
                  <Badge tone={tone} dot>{label}</Badge>
                  {x.status === 'reserved' && <Btn size="sm" variant="danger" onClick={() => refund(x)}>Вернуть</Btn>}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Events() {
  const app = useApp();
  const [list, setList] = useState(null);
  const load = () => api('GET', '/admin/security-events').then((r) => setList(r.events)).catch((e) => app.toast(e.message, 'err'));
  useEffect(() => { load(); }, []);
  return (
    <div className="card card--pad-lg stack g5">
      <div className="row between g3"><p className="t-sm muted">Последние 100 событий: входы, ошибки, блокировки, отказы в доступе.</p><Btn size="sm" icon="refresh" onClick={load}>Обновить</Btn></div>
      {!list ? <Skel h={240} /> : list.length === 0 ? <Empty inline icon="shield" title="Событий пока нет" /> : (
        <div className="rows">
          {list.map((e) => {
            const [label, tone] = EVENT_NAMES[e.event] || [e.event, undefined];
            return (
              <div className="row-item" key={e.id} style={{ cursor: 'default', flexWrap: 'wrap' }}>
                <Badge tone={tone} dot>{label}</Badge>
                <span className="t-sm grow" style={{ minWidth: 200 }}>{e.email || 'неизвестный пользователь'}{e.details?.path ? ' · ' + e.details.path : ''}</span>
                <span className="t-cap muted num">{e.ip || '—'} · {e.when}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function AdminPage() {
  const app = useApp();
  const [tab, setTab] = useState('overview');
  const [data, setData] = useState(null);
  const load = () => api('GET', '/admin/overview').then(setData).catch((e) => app.toast(e.message, 'err'));
  useEffect(() => { load(); }, []);
  const reset = async () => {
    if (!window.confirm('Пересоздать демо-каталог (компании и специалисты-примеры с их проектами)? Реальные аккаунты и их проекты не затрагиваются.')) return;
    if (await app.resetDemo()) { app.toast('Демо-каталог пересоздан'); load(); }
  };
  return (
    <AppShell wide title="Админка" sub="Показатели платформы, пользователи, платежи и журнал безопасности. Доступно только администраторам."
      actions={<><Btn icon="refresh" onClick={load}>Обновить</Btn><Btn variant="ghost" icon="trash" onClick={reset}>Пересоздать демо-каталог</Btn></>}>
      <div className="stack g5">
        <Tabs value={tab} onChange={setTab} items={[
          { id: 'overview', label: 'Показатели' },
          { id: 'users', label: 'Пользователи' },
          { id: 'payments', label: 'Платежи' },
          { id: 'events', label: 'Безопасность' },
        ]} />
        {tab === 'overview' && (data ? <Overview data={data} /> : <Skel h={320} />)}
        {tab === 'users' && <Users />}
        {tab === 'payments' && <Payments />}
        {tab === 'events' && <Events />}
      </div>
    </AppShell>
  );
}
