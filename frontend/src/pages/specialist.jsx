import React, { useState } from 'react';
import { Icon, useApp, Btn, Link, Field, Tag, Badge, StatusPill, Avatar, Modal, Empty, Ph, Money, FeeCalc, PayoutRows, SafeNote, Rail, Metric, Tabs, Stars, Dropdown, useSoon, commission } from '../components/ui.jsx';
import { AppShell, SideNav } from '../components/shell.jsx';
import { Inbox } from '../components/chat.jsx';
import { directions, skills, levels, workFormats, directionsOf, levelName, formatNames } from '../data/mock.js';
import { proposalsCount, matchSkills, priceOf, isOpen } from '../store/store.jsx';
import { money, plural, pluralN, W, daysLabel, editsLabel, dateLabel, ratingLabel, initials } from '../lib/format.js';

const SPEC_NAV = [
  { to: '/spec', label: 'Обзор', icon: 'grid' },
  { to: '/spec/projects', label: 'Найти проекты', icon: 'search' },
  { head: 'Работа' },
  { to: '/spec/proposals', label: 'Мои отклики', icon: 'send' },
  { to: '/spec/messages', label: 'Сообщения', icon: 'chat' },
  { to: '/spec/payout', label: 'Выплаты', icon: 'wallet' },
  { sep: true },
  { to: '/spec/history', label: 'История проектов', icon: 'list' },
  { to: '/spec/reviews', label: 'Отзывы', icon: 'star' },
  { to: '/spec/profile', label: 'Мой профиль', icon: 'user' },
  { to: '/settings', label: 'Настройки', icon: 'settings' },
];

function SpecShell({ title, sub, crumbs, actions, children }) {
  const app = useApp();
  return (
    <AppShell wide title={title} sub={sub} crumbs={crumbs} actions={actions}
      aside={app.role === 'specialist' ? <SideNav items={SPEC_NAV} label="Разделы кабинета специалиста" /> : undefined}>
      {children}
    </AppShell>
  );
}

function useSpecData() {
  const app = useApp();
  const me = app.me;
  const e = app.entities;
  const empty = app.emptyMode;
  const myProposals = empty ? [] : e.proposals.filter((x) => x.specialistId === me.id);
  const myProjects = empty ? [] : e.projects.filter((p) => p.specialistId === me.id);
  return { me, myProposals, myProjects, active: myProjects.filter((p) => p.status !== 'done'), done: myProjects.filter((p) => p.status === 'done') };
}

const myProposalFor = (e, meId, projectId) => e.proposals.find((x) => x.projectId === projectId && x.specialistId === meId && x.status !== 'withdrawn');

const PROPOSAL_STATUS = {
  sent: ['На рассмотрении', undefined], viewed: ['Просмотрен заказчиком', 'info'],
  invited: ['Вас выбрали', 'accent'], accepted: ['Условия подтверждены', 'ok'],
  declined: ['Выбран другой исполнитель', 'stop'], withdrawn: ['Отозван', undefined],
};
function ProposalStatus({ status }) {
  const [label, tone] = PROPOSAL_STATUS[status] || PROPOSAL_STATUS.sent;
  return <Badge tone={tone}>{label}</Badge>;
}

function SpecDashboard() {
  const app = useApp();
  const { me, myProposals, active, done } = useSpecData();
  const matched = app.emptyMode ? [] : app.entities.projects.filter((p) => isOpen(p) && matchSkills(me, p).length >= 2 && !myProposalFor(app.entities, me.id, p.id)).slice(0, 4);
  const pending = myProposals.filter((x) => x.status === 'sent' || x.status === 'viewed' || x.status === 'invited');
  const checklist = [['Загрузить работу в портфолио', me.portfolio.length > 0], ['Указать 5+ навыков', me.skills.length >= 5], ['Подтвердить образование', me.verifiedVia.includes('Образование подтверждено')], ['Пройти тестовое задание', me.verifiedVia.includes('Тестовое задание')]];
  const completeness = Math.round((checklist.filter(([, ok]) => ok).length / checklist.length) * 100);

  return (
    <SpecShell title={'Здравствуйте, ' + me.name.split(' ')[0]} sub="Проекты, подобранные по вашим навыкам, и статусы ваших откликов."
      actions={<><Btn variant="ghost" icon="user" onClick={() => app.navigate('/spec/profile')}>Мой профиль</Btn>
        <Btn variant="primary" icon="search" onClick={() => app.navigate('/spec/projects')}>Найти проекты</Btn></>}>

      <div className="card card--pad-lg stack g4">
        <div className="row between wrap g4">
          <div className="row g4" style={{ minWidth: 0 }}>
            <Avatar person={me} size="lg" />
            <div className="stack g2" style={{ minWidth: 0 }}>
              <div className="row g2 wrap"><strong>{me.name}</strong><Badge tone="info" dot>{me.levelName}</Badge></div>
              <span className="t-cap muted">{me.headline} · подборка проектов строится по вашим навыкам</span>
            </div>
          </div>
          <div className="row g3 wrap">
            <Btn size="sm" onClick={() => app.navigate('/spec/profile/edit')}>Улучшить профиль</Btn>
            <Btn size="sm" variant="quiet" onClick={() => app.navigate('/biz/specialists/' + me.id)}>Как меня видят заказчики</Btn>
          </div>
        </div>
        <div className="stack g3">
          <div className="row between g3"><span className="t-cap muted">Полнота профиля</span><span className="t-cap num">{completeness}%</span></div>
          <div className="meter"><i style={{ width: completeness + '%' }} /></div>
          <div className="row g2 wrap">
            {checklist.map(([t, ok]) => <Tag key={t} tone={ok ? 'line' : 'match'}>{ok ? '✓ ' : '+ '}{t}</Tag>)}
          </div>
        </div>
      </div>

      <div className="grid-3">
        <div className="metric card"><Metric value={active.length} label={plural(active.length, ['активный проект', 'активных проекта', 'активных проектов'])} /></div>
        <div className="metric card"><Metric value={pending.length} label={plural(pending.length, ['отклик на рассмотрении', 'отклика на рассмотрении', 'откликов на рассмотрении'])} /></div>
        <div className="metric card"><Metric value={me.completed + done.length} label="завершено на Taskly" /></div>
      </div>

      <div className="stack g4">
        <div className="row between g3">
          <h2 className="t-h4">Мои проекты</h2>
          <Link to="/spec/history" className="t-cap muted">История проектов</Link>
        </div>
        {active.length === 0 ? (
          <div className="card">
            <Empty icon="briefcase" title="У вас пока нет активных проектов"
              text="Найдите задачу под свои навыки — можно начать с проектов с пометкой «Можно junior», где есть материалы и примеры."
              action={<Btn variant="primary" icon="search" onClick={() => app.navigate('/spec/projects')}>Найти проекты</Btn>}
              secondary={<Btn variant="ghost" onClick={() => app.navigate('/how')}>Как получить первый проект</Btn>} />
          </div>
        ) : (
          <div className="grid-2">
            {active.map((p) => (
              <div className="card card--pad-lg stack g4" key={p.id}>
                <div className="row between wrap g3"><StatusPill id={p.status} />{p.paid ? <Badge tone="ok" dot>Оплата зарезервирована</Badge> : <Badge tone="warn" dot>Ждёт оплаты</Badge>}</div>
                <div className="stack g2">
                  <h3 className="t-h4">{p.title}</h3>
                  <span className="t-cap muted">{p.client} · {money(priceOf(p))}{p.dueDate ? ' · дедлайн ' + dateLabel(p.dueDate) : ''}</span>
                </div>
                <Rail stage={p.status === 'awaiting_payment' ? -1 : p.stage} total={p.stages.length} />
                <div className="row between wrap g3">
                  <span className="t-cap muted">{p.status === 'awaiting_payment' ? 'Ждём резерв оплаты' : 'Этап ' + (Math.min(p.stage, p.stages.length - 1) + 1) + ' из ' + p.stages.length + ': ' + p.stages[Math.min(p.stage, p.stages.length - 1)]}</span>
                  <Btn size="sm" variant="primary" onClick={() => app.navigate('/spec/workspace/' + p.id)}>Рабочее пространство</Btn>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="stack g4">
        <div className="row between g3"><h2 className="t-h4">Статусы откликов</h2><Link to="/spec/proposals" className="t-cap muted">Все отклики</Link></div>
        {myProposals.length === 0 ? (
          <div className="card"><Empty inline icon="send" title="Откликов пока нет" text="Отправленные отклики и ответы заказчиков появятся здесь." action={<Btn variant="primary" onClick={() => app.navigate('/spec/projects')}>Найти проекты</Btn>} /></div>
        ) : (
          <div className="card card--flush">
            <div className="rows">
              {myProposals.slice(0, 5).map((mp) => {
                const p = app.entities.projects.find((x) => x.id === mp.projectId);
                return (
                  <button type="button" className="row-item" key={mp.id} onClick={() => app.navigate('/spec/proposals')}>
                    <span className="avatar"><Icon name="send" size={16} /></span>
                    <span className="stack g1 grow" style={{ minWidth: 0 }}>
                      <span className="t-sm trunc" style={{ fontWeight: 550 }}>{p?.title}</span>
                      <span className="t-cap muted">{money(mp.price)} · {daysLabel(mp.days)} · отклик {mp.created}</span>
                    </span>
                    <ProposalStatus status={mp.status} />
                    <Icon name="chevR" size={17} className="chev" />
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="stack g4">
        <div className="row between wrap g3">
          <div className="stack g1">
            <h2 className="t-h4">Подходит вашим навыкам</h2>
            <span className="t-cap muted">Совпадают минимум 2 навыка из ваших: {me.skills.join(', ')}</span>
          </div>
          <Link to="/spec/projects" className="t-cap muted">Все проекты</Link>
        </div>
        {matched.length === 0 ? (
          <div className="card"><Empty inline icon="search" title="Подходящих проектов пока нет"
            text="Мы покажем здесь проекты, как только появятся задачи с вашими навыками и направлением." action={<Btn onClick={() => app.navigate('/spec/projects')}>Смотреть все проекты</Btn>} /></div>
        ) : (
          <div className="grid-2">{matched.map((p) => <ProjectCardSpec key={p.id} p={p} />)}</div>
        )}
      </div>
    </SpecShell>
  );
}

function ProjectCardSpec({ p }) {
  const app = useApp();
  const isSpec = app.role === 'specialist';
  const mine = isSpec ? matchSkills(app.me, p) : [];
  const saved = app.savedProjects.includes(p.id);
  const applied = isSpec && myProposalFor(app.entities, app.me.id, p.id);
  const n = proposalsCount(app.entities, p);
  return (
    <div className="card card--pad-lg stack g4">
      <div className="row between g4 wrap">
        <div className="row g2 wrap">
          {p.level === 'junior' && <Tag tone="match">Можно junior</Tag>}
          {mine.length >= 2 && <Tag>Совпадают {pluralN(mine.length, W.skill)}</Tag>}
          {applied && <Badge tone="info" dot>Вы откликнулись</Badge>}
        </div>
        <button type="button" className="btn btn--icon btn--sm" aria-label={saved ? 'Убрать из сохранённых' : 'Сохранить проект'} aria-pressed={saved}
          onClick={() => { app.toggleSaved(p.id); app.toast(saved ? 'Убрано из сохранённых' : 'Сохранено в «Сохранённые»'); }}>
          <svg width="16" height="16" viewBox="0 0 20 20" aria-hidden="true"><path d="M5.5 16V4.5h9V16l-4.5-2.6z" fill={saved ? 'var(--accent)' : 'none'} stroke={saved ? 'var(--accent)' : 'var(--ink-3)'} strokeWidth="1.4" /></svg>
        </button>
      </div>
      <div className="stack g2">
        <Link to={'/spec/projects/' + p.id} className="t-h4" style={{ display: 'block' }}>{p.title}</Link>
        <p className="t-sm muted clamp2">{p.brief}</p>
      </div>
      <div className="tag-row">{p.skills.slice(0, 4).map((s) => <Tag key={s} tone={mine.includes(s) ? 'match' : undefined}>{s}</Tag>)}</div>
      <div className="kv-rows">
        <div className="kv-row"><dt>Бюджет</dt><dd><Money value={p.price} strong /></dd></div>
        <div className="kv-row"><dt>Срок</dt><dd>{daysLabel(p.days)}</dd></div>
        <div className="kv-row"><dt>Уровень</dt><dd>{levelName(p.level)}</dd></div>
      </div>
      <div className="row between g3 wrap">
        <span className="row g3 t-cap muted">
          <span className="row g2"><Icon name="clock" size={13} />{p.posted}</span>
          <span className="row g2"><Icon name="chat" size={13} />{pluralN(n, W.proposal)}</span>
        </span>
        <div className="row g2">
          <Link to={'/spec/projects/' + p.id} className="btn btn--secondary btn--sm">Подробнее</Link>
          {!applied && app.role !== 'client' && <Btn size="sm" variant="primary" onClick={() => app.navigate('/spec/projects/' + p.id + '/apply')}>Откликнуться</Btn>}
        </div>
      </div>
    </div>
  );
}

const PAGE = 6;
const TIME_FILTERS = { fast: (d) => d <= 7, mid: (d) => d > 7 && d <= 14, long: (d) => d > 14 };

function SpecProjects() {
  const app = useApp();
  const isSpec = app.role === 'specialist';
  const [tab, setTab] = useState('all');
  const [q, setQ] = useState('');
  const [dir, setDir] = useState('all');
  const [sk, setSk] = useState([]);
  const [budget, setBudget] = useState('all');
  const [time, setTime] = useState('all');
  const [lvl, setLvl] = useState('any');
  const [format, setFormat] = useState('all');
  const [filters, setFilters] = useState(false);
  const [sort, setSort] = useState('new');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const toggleIn = (v) => { setSk((a) => (a.includes(v) ? a.filter((x) => x !== v) : [...a, v])); setPage(1); };
  const reset = () => { setQ(''); setDir('all'); setSk([]); setBudget('all'); setTime('all'); setLvl('any'); setFormat('all'); setPage(1); };

  const catalog = app.emptyMode ? [] : app.entities.projects.filter(isOpen);
  const fits = (p) => matchSkills(app.me, p).length >= 2;
  let list = catalog.filter((p) => {
    const okQ = !q.trim() || (p.title + ' ' + p.brief + ' ' + p.skills.join(' ')).toLowerCase().includes(q.trim().toLowerCase());
    const okD = dir === 'all' || p.directions.includes(dir);
    const okS = sk.length === 0 || sk.some((x) => p.skills.includes(x));
    const okB = budget === 'all' || (budget === 's' && p.price < 70000) || (budget === 'm' && p.price >= 70000 && p.price <= 150000) || (budget === 'l' && p.price > 150000);
    const okT = time === 'all' || TIME_FILTERS[time](p.days);
    const okL = lvl === 'any' || p.level === lvl;
    const okF = format === 'all' || p.format.includes(format);
    return okQ && okD && okS && okB && okT && okL && okF;
  });
  if (tab === 'match') list = list.filter(fits);
  if (tab === 'saved') list = list.filter((p) => app.savedProjects.includes(p.id));
  if (sort === 'budget') list = [...list].sort((a, b) => b.price - a.price);
  if (sort === 'fast') list = [...list].sort((a, b) => a.days - b.days);
  const shown = list.slice(0, page * PAGE);
  const activeFilters = [dir !== 'all', sk.length > 0, budget !== 'all', time !== 'all', lvl !== 'any', format !== 'all'].filter(Boolean).length;
  const sortLabel = { new: 'Сначала новые', budget: 'Больше бюджет', fast: 'Короче срок' }[sort];
  const savedCount = catalog.filter((p) => app.savedProjects.includes(p.id)).length;

  const loadMore = () => { setLoading(true); setTimeout(() => { setPage(page + 1); setLoading(false); }, 400); };

  return (
    <SpecShell title="Найти проекты" sub="Двухуровневый поиск: направление для навигации, навыки — для точного подбора."
      actions={<Btn variant="ghost" icon="bookmark" onClick={() => setTab('saved')}>Сохранённые ({savedCount})</Btn>}>
      <div className="stack g5">
        {!isSpec && (
          <div className="note"><Icon name="info" size={16} /><span className="grow">Смотреть проекты можно без регистрации. Чтобы откликнуться, {app.role === 'guest' ? 'создайте профиль специалиста' : 'переключитесь на роль специалиста'}.</span></div>
        )}
        <div className="card card--pad-lg stack g5">
          <div className="row g3 wrap">
            <input className="input input--search grow" style={{ minWidth: 0, flexBasis: 240 }} placeholder="Что нужно сделать? Например: лендинг, телеграм-бот, свести таблицу" aria-label="Поиск проектов"
              value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} />
            <Btn icon="filter" variant={filters ? 'quiet' : 'secondary'} aria-expanded={filters} onClick={() => setFilters((v) => !v)}>
              Фильтры{activeFilters ? ` · ${activeFilters}` : ''}
            </Btn>
            <Dropdown label={sortLabel} icon="chevD">
              <button type="button" className="menu-item" onClick={() => setSort('new')}><Icon name="sparkle" size={15} />Сначала новые</button>
              <button type="button" className="menu-item" onClick={() => setSort('budget')}><Icon name="wallet" size={15} />Больше бюджет</button>
              <button type="button" className="menu-item" onClick={() => setSort('fast')}><Icon name="clock" size={15} />Короче срок</button>
            </Dropdown>
          </div>

          <div className="chips chips--scroll">
            <button type="button" className={'chip' + (dir === 'all' ? ' is-on' : '')} aria-pressed={dir === 'all'} onClick={() => { setDir('all'); setPage(1); }}>Все направления</button>
            {directions.map((d) => (
              <button type="button" key={d.id} aria-pressed={dir === d.id} className={'chip' + (dir === d.id ? ' is-on' : '')} onClick={() => { setDir(d.id); setPage(1); }}>{d.name}</button>
            ))}
          </div>

          {filters && (
            <div className="grid-3" style={{ gap: 'var(--s5)' }}>
              <Field label="Бюджет" id="fp-budget">
                <select id="fp-budget" className="select" value={budget} onChange={(e) => { setBudget(e.target.value); setPage(1); }}>
                  <option value="all">Любой</option>
                  <option value="s">До 70 000 ₸</option>
                  <option value="m">70 000 – 150 000 ₸</option>
                  <option value="l">Больше 150 000 ₸</option>
                </select>
              </Field>
              <Field label="Срок" id="fp-time">
                <select id="fp-time" className="select" value={time} onChange={(e) => { setTime(e.target.value); setPage(1); }}>
                  <option value="all">Любой</option>
                  <option value="fast">До недели</option>
                  <option value="mid">1–2 недели</option>
                  <option value="long">Больше 2 недель</option>
                </select>
              </Field>
              <Field label="Уровень сложности" hint="«Можно junior» — задачи с примерами и понятными требованиями" id="fp-lvl">
                <select id="fp-lvl" className="select" value={lvl} onChange={(e) => { setLvl(e.target.value); setPage(1); }}>
                  {levels.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
              </Field>
              <Field label="Формат работы" id="fp-format">
                <select id="fp-format" className="select" value={format} onChange={(e) => { setFormat(e.target.value); setPage(1); }}>
                  <option value="all">Любой</option>
                  {workFormats.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
                </select>
              </Field>
              <div className="stack g3" style={{ gridColumn: '1 / -1' }}>
                <span className="t-micro muted">Навыки</span>
                <div className="chips">
                  {skills.slice(0, 24).map((s) => (
                    <button type="button" key={s} aria-pressed={sk.includes(s)} className={'chip' + (sk.includes(s) ? ' is-on' : '')} onClick={() => toggleIn(s)}>{s}</button>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="row between wrap g3">
            <span className="t-cap muted">Показано {shown.length} из {list.length}</span>
            {(activeFilters > 0 || q) && <Btn variant="ghost" size="sm" onClick={reset}>Сбросить фильтры</Btn>}
          </div>
        </div>

        <div className="stack g4">
          <Tabs value={tab} onChange={(v) => { setTab(v); setPage(1); }} items={[
            { id: 'all', label: 'Все проекты', count: catalog.length },
            ...(isSpec ? [{ id: 'match', label: 'Подходит мне', count: catalog.filter(fits).length }] : []),
            { id: 'saved', label: 'Сохранённые', count: savedCount },
          ]} />

          {shown.length === 0 ? (
            <div className="card">
              <Empty icon={tab === 'saved' ? 'bookmark' : 'search'}
                title={tab === 'saved' && !activeFilters && !q ? 'Сохранённых проектов нет' : 'Ничего не найдено'}
                text={tab === 'saved' && !activeFilters && !q
                  ? 'Нажимайте на закладку в карточке проекта — он появится здесь, чтобы вернуться к нему позже.'
                  : 'Попробуйте изменить фильтры: возможно, по выбранным навыкам сейчас нет открытых задач. Новые проекты появляются каждый день.'}
                action={tab === 'saved' && !activeFilters && !q
                  ? <Btn variant="primary" onClick={() => setTab('all')}>Смотреть все проекты</Btn>
                  : <Btn onClick={reset}>Сбросить фильтры</Btn>}
                secondary={tab !== 'all' && <Btn variant="ghost" onClick={() => setTab('all')}>Все проекты</Btn>} />
            </div>
          ) : (
            <>
              <div className="grid-2">{shown.map((p) => <ProjectCardSpec key={p.id} p={p} />)}</div>
              {shown.length < list.length && (
                <div className="row center">
                  <Btn variant="secondary" onClick={loadMore} disabled={loading}>
                    {loading ? <><span className="spin spin--ink" /> Загружаем…</> : 'Показать ещё проекты'}
                  </Btn>
                </div>
              )}
              {shown.length >= list.length && list.length > PAGE && (
                <p className="t-cap muted" style={{ textAlign: 'center' }}>Это все проекты по вашим фильтрам.</p>
              )}
            </>
          )}
        </div>
      </div>
    </SpecShell>
  );
}

function SpecProjectDetail({ id }) {
  const app = useApp();
  const p = app.entities.projects.find((x) => x.id === id);
  const [reportOpen, setReportOpen] = useState(false);
  if (!p || (!isOpen(p) && p.specialistId !== app.me.id)) {
    return (
      <SpecShell crumbs={[{ label: 'Найти проекты', to: '/spec/projects' }, { label: 'Проект недоступен' }]} title="Проект недоступен">
        <div className="card" style={{ maxWidth: 640 }}>
          <Empty icon="search" title={p ? 'Исполнитель уже выбран' : 'Проект не найден'}
            text={p ? 'Этот проект больше не принимает отклики. Посмотрите похожие открытые задачи.' : 'Возможно, проект снят с публикации или ссылка устарела.'}
            action={<Btn variant="primary" onClick={() => app.navigate('/spec/projects')}>Открытые проекты</Btn>} />
        </div>
      </SpecShell>
    );
  }
  if (!isOpen(p)) {
    return (
      <SpecShell crumbs={[{ label: 'Найти проекты', to: '/spec/projects' }, { label: p.title }]} title={p.title}>
        <div className="card" style={{ maxWidth: 640 }}>
          <Empty icon="briefcase" title="Вы исполнитель этого проекта" text="Все материалы, этапы и переписка — в рабочем пространстве."
            action={<Btn variant="primary" onClick={() => app.navigate('/spec/workspace/' + p.id)}>Рабочее пространство</Btn>} />
        </div>
      </SpecShell>
    );
  }

  const isSpec = app.role === 'specialist';
  const matched = isSpec ? matchSkills(app.me, p) : [];
  const saved = app.savedProjects.includes(p.id);
  const applied = isSpec && myProposalFor(app.entities, app.me.id, p.id);
  const ownProject = app.role === 'client' && p.mine;
  const n = proposalsCount(app.entities, p);
  const apply = () => app.navigate('/spec/projects/' + p.id + '/apply');
  const toggleSave = () => { app.toggleSaved(p.id); app.toast(saved ? 'Убрано из сохранённых' : 'Проект сохранён'); };

  return (
    <SpecShell crumbs={[{ label: 'Найти проекты', to: '/spec/projects' }, { label: p.title }]}
      title={p.title} sub={'Опубликован ' + p.posted + ' · ' + pluralN(n, W.proposal) + ' · ' + p.client}
      actions={<>
        <Btn icon="bookmark" variant={saved ? 'quiet' : 'secondary'} aria-pressed={saved} onClick={toggleSave}>{saved ? 'Сохранён' : 'Сохранить'}</Btn>
        {ownProject ? <Btn variant="primary" onClick={() => app.navigate('/biz/projects/' + p.id)}>Это ваш проект</Btn>
          : applied ? <Btn variant="primary" onClick={() => app.navigate('/spec/proposals')}>Вы откликнулись</Btn>
            : <Btn variant="primary" size="lg" onClick={apply}>Откликнуться</Btn>}
      </>}>
      <div className="shell-ws">
        <div className="stack g5">
          <div className="card card--pad-lg stack g5">
            <div className="row g2 wrap">
              {p.level === 'junior' && <Tag tone="match">Можно junior</Tag>}
              {matched.length >= 2 && <Tag>Совпадают {pluralN(matched.length, W.skill)}</Tag>}
              <Tag tone="line">{directionsOf(p.directions).join(' · ')}</Tag>
            </div>
            <p className="t-sm ink2">{p.brief}</p>
            <hr className="hr" />
            <div className="stack g3"><span className="t-micro muted">Ожидаемый результат</span><p className="t-sm ink2">{p.result}</p></div>
            <div className="grid-2" style={{ gap: 'var(--s6)' }}>
              <div className="stack g3"><span className="t-micro muted">Входит в работу</span>
                <ul className="stack g2">{p.includes.map((t) => <li className="row g3 t-sm" key={t}><Icon name="check" size={15} style={{ color: 'var(--ok)' }} />{t}</li>)}</ul>
              </div>
              <div className="stack g3"><span className="t-micro muted">Не входит в работу</span>
                <ul className="stack g2">{p.excludes.map((t) => <li className="row g3 t-sm" key={t}><Icon name="x" size={15} style={{ color: 'var(--ink-3)' }} />{t}</li>)}</ul>
              </div>
            </div>
            <hr className="hr" />
            <div className="grid-2" style={{ gap: 'var(--s6)' }}>
              <div className="stack g3"><span className="t-micro muted">Материалы от заказчика</span>
                <div className="tag-row">{p.materials.map((m) => <Tag key={m}>{m}</Tag>)}</div>
              </div>
              <div className="stack g3"><span className="t-micro muted">Требования</span><p className="t-sm ink2">{p.requirements || 'Без дополнительных требований'}</p></div>
            </div>
          </div>

          <div className="card card--pad-lg stack g5">
            <h3 className="t-h4">Этапы работы</h3>
            <div className="grid-4" style={{ gap: 'var(--s4)' }}>
              {p.stages.map((s, i) => (
                <div className="stack g2" key={s}>
                  <span className="step-dot">{i + 1}</span>
                  <span className="t-sm" style={{ fontWeight: 550 }}>{s}</span>
                </div>
              ))}
            </div>
            <p className="t-cap muted">Этапы нужны, чтобы видеть прогресс. Задача описана одним ТЗ, а не списком из сотни пунктов.</p>
          </div>

          <div className="card card--pad-lg stack g5">
            <div className="row g3"><Icon name="wallet" size={18} /><h3 className="t-h4">Сколько вы получите</h3></div>
            <div className="grid-2" style={{ alignItems: 'start' }}>
              <FeeCalc price={p.price} />
              <div className="stack g4">
                <p className="t-sm ink2">Комиссия удерживается один раз — после того, как заказчик примет работу. Никаких платежей при отклике или старте проекта нет.</p>
                <div className="note note--ok"><Icon name="shield" size={16} />
                  <span className="grow">Оплату заказчик резервирует до начала работы, а вам она передаётся после приёмки результата.</span></div>
              </div>
            </div>
          </div>

          <div className="card card--pad-lg stack g5">
            <div className="row between wrap g3">
              <h3 className="t-h4">Заказчик</h3>
              {p.verified ? <Badge tone="info" dot>Проверенный заказчик</Badge> : <Badge dot>Верификация не пройдена</Badge>}
            </div>
            <div className="row g4">
              <span className="avatar avatar--lg avatar--b">{initials(p.client)}</span>
              <div className="stack g2 grow" style={{ minWidth: 0 }}>
                <strong>{p.client}</strong>
                <span className="t-cap muted">Бизнес на Taskly с {p.clientSince || 2025} года</span>
              </div>
            </div>
            <div className="kv-rows">
              <div className="kv-row"><dt>Оплата</dt><dd>Резервируется до старта</dd></div>
              <div className="kv-row"><dt>Отвечает</dt><dd>Обычно в течение дня</dd></div>
            </div>
          </div>
        </div>

        <div className="stack g5 panel--sticky">
          <div className="card card--pad-lg stack g5">
            <div className="kv-rows">
              <div className="kv-row"><dt>Бюджет</dt><dd><Money value={p.price} strong /></dd></div>
              <div className="kv-row"><dt>Вы получите</dt><dd><Money value={commission(p.price).payout} strong /></dd></div>
              <div className="kv-row"><dt>Срок</dt><dd>{daysLabel(p.days)}</dd></div>
              <div className="kv-row"><dt>Правки</dt><dd>{editsLabel(p.edits)} по ТЗ</dd></div>
              <div className="kv-row"><dt>Уровень</dt><dd>{levelName(p.level)}</dd></div>
              <div className="kv-row"><dt>Формат</dt><dd>{formatNames(p.format).join(', ')}</dd></div>
            </div>
            <div className="tag-row">{p.skills.map((s) => <Tag key={s} tone={matched.includes(s) ? 'match' : undefined}>{s}</Tag>)}</div>
          </div>

          <div className="stack g3">
            {!ownProject && !applied && <Btn variant="primary" size="lg" full onClick={apply}>Откликнуться на проект</Btn>}
            {applied && <div className="note note--ok"><Icon name="check" size={16} /><span className="grow">Вы уже откликнулись: {money(applied.price)}, {daysLabel(applied.days)}. Статус — в разделе «Мои отклики».</span></div>}
            <Btn full icon="bookmark" onClick={toggleSave}>{saved ? 'Убрать из сохранённых' : 'Сохранить проект'}</Btn>
            {!ownProject && <button type="button" className="btn btn--ghost btn--full" onClick={() => setReportOpen(true)}>Пожаловаться на проект</button>}
          </div>

          <div className="note"><Icon name="info" size={16} />
            <span className="grow">Сомневаетесь, подходит ли задача? Отклик ни к чему не обязывает: можно предложить свою стоимость и срок.</span></div>
        </div>
      </div>

      {reportOpen && (
        <Modal title="Жалоба на проект" sub="Мы проверим проект и свяжемся с заказчиком, если потребуется."
          onClose={() => setReportOpen(false)}
          footer={<><Btn onClick={() => setReportOpen(false)}>Отмена</Btn>
            <Btn variant="primary" onClick={() => { setReportOpen(false); app.toast('Жалоба отправлена. Спасибо, что помогаете поддерживать качество.'); }}>Отправить жалобу</Btn></>}>
          <div className="stack g4">
            <Field label="Причина" required id="rp-reason">
              <select id="rp-reason" className="select">
                <option>ТЗ не соответствует описанию</option>
                <option>Проект выглядит как тестовое задание без оплаты</option>
                <option>Просят работу вне платформы</option>
                <option>Дублирующийся или спам-проект</option>
                <option>Другое</option>
              </select>
            </Field>
            <Field label="Комментарий" hint="Необязательно" id="rp-text">
              <textarea id="rp-text" className="textarea" style={{ minHeight: 90 }} />
            </Field>
          </div>
        </Modal>
      )}
    </SpecShell>
  );
}

const DAY_OPTIONS = [3, 5, 7, 10, 14, 21, 30];

function SpecApply({ id }) {
  const app = useApp();
  const me = app.me;
  const p = app.entities.projects.find((x) => x.id === id && isOpen(x));
  const existing = p && myProposalFor(app.entities, me.id, p.id);
  const [price, setPrice] = useState(p ? p.price : 0);
  const [days, setDays] = useState(p ? p.days : 7);
  const [msg, setMsg] = useState('');
  const [work, setWork] = useState(me.portfolio[0]?.t || '');
  const [terms, setTerms] = useState(false);
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState({});

  if (!p) {
    return (
      <SpecShell crumbs={[{ label: 'Найти проекты', to: '/spec/projects' }, { label: 'Отклик' }]} title="Отклик недоступен">
        <div className="card" style={{ maxWidth: 640 }}>
          <Empty icon="search" title="Проект не принимает отклики" text="Возможно, исполнитель уже выбран или проект снят с публикации."
            action={<Btn variant="primary" onClick={() => app.navigate('/spec/projects')}>Открытые проекты</Btn>} />
        </div>
      </SpecShell>
    );
  }
  if (existing && !sent) {
    return (
      <SpecShell crumbs={[{ label: 'Найти проекты', to: '/spec/projects' }, { label: p.title, to: '/spec/projects/' + p.id }, { label: 'Отклик' }]} title="Вы уже откликнулись">
        <div className="card" style={{ maxWidth: 640 }}>
          <Empty icon="send" title="Отклик уже отправлен" text={'Ваше предложение: ' + money(existing.price) + ', ' + daysLabel(existing.days) + '. Следите за статусом в разделе «Мои отклики».'}
            action={<Btn variant="primary" onClick={() => app.navigate('/spec/proposals')}>Мои отклики</Btn>}
            secondary={<Btn variant="ghost" onClick={() => app.navigate('/spec/projects')}>Другие проекты</Btn>} />
        </div>
      </SpecShell>
    );
  }

  const c = commission(price);
  const tooLong = days > Math.ceil(p.days * 1.5);
  const dayOptions = [...new Set([...DAY_OPTIONS, p.days])].sort((a, b) => a - b);

  if (sent) {
    return (
      <SpecShell crumbs={[{ label: 'Найти проекты', to: '/spec/projects' }, { label: p.title, to: '/spec/projects/' + p.id }, { label: 'Отклик отправлен' }]}
        title="Отклик отправлен" sub="Заказчик увидит вашу цену, срок, сообщение и работу из портфолио.">
        <div className="stack g5" style={{ maxWidth: 760 }}>
          <div className="note note--ok"><Icon name="check" size={16} />
            <span className="grow"><strong>Отправлено.</strong> Ответ придёт в уведомления и появится в разделе «Мои отклики».</span></div>
          <div className="card card--pad-lg stack g4">
            <div className="kv-rows">
              <div className="kv-row"><dt>Проект</dt><dd>{p.title}</dd></div>
              <div className="kv-row"><dt>Срок</dt><dd>{daysLabel(days)}</dd></div>
            </div>
            <PayoutRows price={price} priceLabel="Предложенная стоимость" />
          </div>
          <div className="card card--pad-lg stack g4">
            <h3 className="t-h4">Что дальше</h3>
            {[['Заказчик читает отклик', 'Обычно в течение 1–2 дней.'],
              ['Вас выбирают исполнителем', 'Придёт уведомление: нужно подтвердить условия.'],
              ['Оплата резервируется', 'Заказчик резервирует стоимость проекта — можно начинать работу.'],
              ['Вы сдаёте результат', 'После приёмки получаете выплату за вычетом комиссии 5%.']].map(([t, s], i) => (
              <div className="row g4" key={t} style={{ alignItems: 'flex-start' }}>
                <span className="step-dot">{i + 1}</span>
                <div className="stack g1"><span className="t-sm" style={{ fontWeight: 550 }}>{t}</span><span className="t-cap muted">{s}</span></div>
              </div>
            ))}
          </div>
          <div className="row g3 wrap">
            <Btn variant="primary" onClick={() => app.navigate('/spec/proposals')}>Мои отклики</Btn>
            <Btn onClick={() => app.navigate('/spec/projects')}>Искать другие проекты</Btn>
          </div>
        </div>
      </SpecShell>
    );
  }

  const submit = () => {
    const e = {};
    if (price < 1000) e.price = 'Укажите стоимость.';
    if (msg.trim().length < 20) e.msg = 'Напишите 2–3 предложения: как вы поняли задачу и почему справитесь.';
    if (!terms) e.terms = 'Подтвердите, что условия ТЗ понятны.';
    setErr(e);
    if (Object.keys(e).length) return;
    setBusy(true);
    setTimeout(() => {
      app.applyToProject(p.id, { price, days, message: msg.trim(), portfolio: work });
      setBusy(false); setSent(true); app.toast('Отклик отправлен');
    }, 600);
  };

  return (
    <SpecShell crumbs={[{ label: 'Найти проекты', to: '/spec/projects' }, { label: p.title, to: '/spec/projects/' + p.id }, { label: 'Отклик' }]}
      title="Отклик на проект" sub={p.title}
      actions={<Btn variant="ghost" onClick={() => app.navigate('/spec/projects/' + p.id)}>Вернуться к проекту</Btn>}>
      <div className="shell-ws">
        <div className="stack g5">
          <div className="card card--pad-lg stack g6">
            <div className="stack g2">
              <h3 className="t-h4">Коротко о вашем предложении</h3>
              <p className="t-sm muted">Заказчик сравнивает несколько откликов. Важнее всего — понятная цена, реальный срок и то, как вы поняли задачу.</p>
            </div>

            <Field label="Предлагаемая стоимость" required error={err.price} hint={'Бюджет заказчика: ' + money(p.price)} id="ap-price">
              <div className="affix" style={{ maxWidth: 320 }}>
                <input id="ap-price" className="input input--num" type="number" inputMode="numeric" min="0" step="1000" value={price} onChange={(e) => setPrice(Math.max(0, Math.round(Number(e.target.value) || 0)))} />
                <span className="suffix">₸</span>
              </div>
            </Field>

            <Field label="Срок" required hint={'Заказчик ожидает: ' + daysLabel(p.days)}>
              <div className="chips">
                {dayOptions.map((d) => (
                  <button type="button" key={d} aria-pressed={days === d} className={'chip' + (days === d ? ' is-on' : '')} onClick={() => setDays(d)}>{daysLabel(d)}</button>
                ))}
              </div>
            </Field>
            {tooLong && (
              <div className="note note--warn"><Icon name="alert" size={16} />
                <span className="grow">Вы предлагаете срок заметно больше ожидаемого. Это нормально — просто объясните в сообщении, почему так.</span></div>
            )}

            <Field label="Сообщение заказчику" required error={err.msg} id="ap-msg"
              hint="Как вы поняли задачу, что сделаете первым шагом, что нужно уточнить">
              <textarea id="ap-msg" className="textarea" style={{ minHeight: 130 }} value={msg} onChange={(e) => setMsg(e.target.value)} data-invalid={!!err.msg}
                placeholder="Например: задача понятна. Начну со структуры и первых двух секций в Figma, чтобы согласовать стиль до вёрстки. Уточните, есть ли пожелания по цветам?" />
            </Field>

            <Field label="Работа из портфолио" hint="Похожая задача помогает заказчику принять решение быстрее">
              <div className="stack g3">
                {me.portfolio.length === 0 && <span className="t-sm muted">В портфолио пока нет работ — <Link to="/spec/profile/edit" style={{ color: 'var(--accent)' }}>добавьте первую</Link>.</span>}
                {me.portfolio.map((w) => (
                  <label key={w.t} className={'card card--pad-sm row g4' + (work === w.t ? ' card--active' : '')} style={{ cursor: 'pointer', padding: 'var(--s3) var(--s4)' }}>
                    <input type="radio" name="work" checked={work === w.t} onChange={() => setWork(w.t)} style={{ accentColor: 'var(--accent)' }} />
                    <Ph label={w.ph} variant="shot" style={{ width: 88, height: 56, flex: 'none' }} />
                    <span className="stack g1 grow" style={{ minWidth: 0 }}>
                      <span className="t-sm" style={{ fontWeight: 550 }}>{w.t}</span>
                      <span className="t-cap muted">{w.s}</span>
                    </span>
                  </label>
                ))}
              </div>
            </Field>

            <label className="check">
              <input type="checkbox" checked={terms} onChange={(e) => setTerms(e.target.checked)} />
              <span><strong>Условия ТЗ понятны, я готов(а) их выполнить</strong>Ожидаемый результат, состав работы и границы задачи совпадают с тем, что я предлагаю.</span>
            </label>
            {err.terms && <span className="err" role="alert">{err.terms}</span>}

            <div className="row g3 wrap" style={{ borderTop: '1px solid var(--line)', paddingTop: 'var(--s5)' }}>
              <Btn variant="primary" size="lg" onClick={submit} disabled={busy}>
                {busy ? <><span className="spin" /> Отправляем…</> : 'Отправить отклик'}
              </Btn>
              <Btn size="lg" variant="ghost" onClick={() => app.navigate('/spec/projects/' + p.id)}>Отмена</Btn>
            </div>
            <p className="t-cap muted">Отклик ни к чему не обязывает: его можно отозвать, пока заказчик не выбрал исполнителя.</p>
          </div>
        </div>

        <div className="stack g5 panel--sticky">
          <div className="stack g2">
            <h3 className="t-h4">Расчёт с комиссией</h3>
            <p className="t-cap muted">Комиссия Taskly 5% удерживается один раз — после успешного завершения проекта.</p>
          </div>
          <FeeCalc price={price} note={false} />
          <div className="card card--pad-lg stack g4">
            <span className="t-micro muted">Условия проекта</span>
            <div className="kv-rows">
              <div className="kv-row"><dt>Бюджет заказчика</dt><dd><Money value={p.price} /></dd></div>
              <div className="kv-row"><dt>Ожидаемый срок</dt><dd>{daysLabel(p.days)}</dd></div>
              <div className="kv-row"><dt>Правки</dt><dd>{editsLabel(p.edits)} по ТЗ</dd></div>
              <div className="kv-row"><dt>Откликов</dt><dd>{proposalsCount(app.entities, p)}</dd></div>
            </div>
          </div>
          <SafeNote compact paid={false} />
        </div>
      </div>
    </SpecShell>
  );
}

function SpecProposals() {
  const app = useApp();
  const [tab, setTab] = useState('all');
  const [confirmFor, setConfirmFor] = useState(null);
  const { myProposals } = useSpecData();
  const all = myProposals.map((mp) => ({ ...mp, p: app.entities.projects.find((x) => x.id === mp.projectId) })).filter((x) => x.p);
  const inTab = (x, t) => (t === 'all' ? true : t === 'active' ? x.status === 'sent' || x.status === 'viewed' : t === 'closed' ? ['declined', 'withdrawn'].includes(x.status) : t === 'invited' ? ['invited', 'accepted'].includes(x.status) : x.status === t);
  const list = all.filter((x) => inTab(x, tab));
  const count = (t) => all.filter((x) => inTab(x, t)).length;

  return (
    <SpecShell title="Мои отклики" sub="Что происходило с вашими предложениями и где нужен ваш ответ."
      actions={<Btn variant="primary" icon="search" onClick={() => app.navigate('/spec/projects')}>Найти проекты</Btn>}>
      <div className="stack g5">
        <Tabs value={tab} onChange={setTab} items={[
          { id: 'all', label: 'Все', count: count('all') },
          { id: 'invited', label: 'Выбрали вас', count: count('invited') },
          { id: 'active', label: 'На рассмотрении', count: count('active') },
          { id: 'closed', label: 'Закрытые', count: count('closed') },
        ]} />

        {list.length === 0 ? (
          <div className="card">
            <Empty icon="send" title={tab === 'invited' ? 'Вас пока не выбирали исполнителем' : 'Здесь пока пусто'}
              text={tab === 'invited'
                ? 'Когда заказчик выберет вас, сюда придёт приглашение с условиями. Подтвердить их нужно будет до начала работы.'
                : 'Отправляйте отклики на проекты, подходящие по навыкам — так статистика появится быстрее.'}
              action={<Btn variant="primary" icon="search" onClick={() => app.navigate('/spec/projects')}>Найти проекты</Btn>}
              secondary={tab !== 'all' && <Btn variant="ghost" onClick={() => setTab('all')}>Все отклики</Btn>} />
          </div>
        ) : (
          <div className="stack g4">
            {list.map((mp) => {
              const c = commission(mp.price);
              return (
                <div className={'card card--pad-lg stack g4' + (mp.status === 'invited' ? ' card--active' : '')} key={mp.id}>
                  <div className="row between wrap g4">
                    <div className="stack g2" style={{ minWidth: 0 }}>
                      {isOpen(mp.p) ? <Link to={'/spec/projects/' + mp.p.id} className="t-h4">{mp.p.title}</Link> : <span className="t-h4">{mp.p.title}</span>}
                      <span className="t-cap muted">{mp.p.client} · отклик {mp.created}</span>
                    </div>
                    <ProposalStatus status={mp.status} />
                  </div>
                  <div className="grid-4" style={{ gap: 'var(--s5)' }}>
                    <div className="kv"><dt>Ваша цена</dt><dd><Money value={c.price} /></dd></div>
                    <div className="kv"><dt>Комиссия 5%</dt><dd>− <Money value={c.fee} /></dd></div>
                    <div className="kv"><dt>Вы получите</dt><dd><Money value={c.payout} /></dd></div>
                    <div className="kv"><dt>Срок</dt><dd>{daysLabel(mp.days)}</dd></div>
                  </div>
                  <div className="row g3 wrap">
                    {mp.status === 'invited' && (
                      <>
                        <Btn variant="primary" onClick={() => setConfirmFor(mp)}>Подтвердить условия</Btn>
                        <Btn variant="ghost" onClick={() => { app.declineInvite(mp.id); app.toast('Вы отказались от приглашения'); }}>Отказаться</Btn>
                      </>
                    )}
                    {mp.status === 'accepted' && <Btn variant="primary" onClick={() => app.navigate('/spec/workspace/' + mp.p.id)}>Рабочее пространство</Btn>}
                    {(mp.status === 'sent' || mp.status === 'viewed') && (
                      <>
                        <Btn size="sm" onClick={() => app.navigate('/spec/projects/' + mp.p.id)}>Открыть проект</Btn>
                        <Btn size="sm" variant="ghost" onClick={() => { app.withdrawProposal(mp.id); app.toast('Отклик отозван'); }}>Отозвать отклик</Btn>
                      </>
                    )}
                  </div>
                  {mp.status === 'invited' && (
                    <div className="note note--ok"><Icon name="check" size={16} />
                      <span className="grow">Заказчик выбрал вас. Подтвердите условия — после этого он зарезервирует оплату, и можно будет начать работу.</span></div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {confirmFor && (
        <Modal wide title="Подтвердить условия" sub={confirmFor.p.title} onClose={() => setConfirmFor(null)}
          footer={<><Btn onClick={() => setConfirmFor(null)}>Отмена</Btn>
            <Btn variant="primary" onClick={() => { app.confirmInvite(confirmFor.id); app.toast('Условия подтверждены. Ждём резерв оплаты от заказчика.'); app.navigate('/spec/workspace/' + confirmFor.p.id); }}>Подтверждаю условия</Btn></>}>
          <div className="stack g4">
            <p className="t-sm ink2">{confirmFor.p.result}</p>
            <div className="kv-rows">
              <div className="kv-row"><dt>Срок</dt><dd>{daysLabel(confirmFor.days)}</dd></div>
              <div className="kv-row"><dt>Правки</dt><dd>{editsLabel(confirmFor.p.edits)} по ТЗ</dd></div>
            </div>
            <PayoutRows price={confirmFor.price} priceLabel="Стоимость" />
            <div className="note"><Icon name="lock" size={16} /><span className="grow">После подтверждения условия фиксируются. Изменить объём, стоимость или срок можно только через «Предложить изменение задачи».</span></div>
          </div>
        </Modal>
      )}
    </SpecShell>
  );
}

function SpecMessages() {
  const { myProjects } = useSpecData();
  return (
    <SpecShell title="Сообщения" sub="Переписка по проектам. Условия обсуждаем здесь, изменения объёма — через «Предложить изменение задачи».">
      <Inbox projects={myProjects} workspaceBase="/spec/workspace/" />
    </SpecShell>
  );
}

function usePayoutRows() {
  const app = useApp();
  const { me, myProjects } = useSpecData();
  if (app.emptyMode) return [];
  const fromStore = myProjects.filter((p) => p.paid).map((p) => ({
    id: p.id, title: p.title, from: p.client, gross: priceOf(p),
    when: p.status === 'done' ? p.completedAt || 'недавно' : '—',
    status: p.status === 'done' ? 'paid' : 'pending',
  }));
  const archive = me.archive.map((a, i) => ({ id: 'a' + i, title: a.title, from: a.client, gross: a.gross, when: a.when, status: 'paid' }));
  return [...fromStore, ...archive];
}

function SpecPayout() {
  const app = useApp();
  const rows = usePayoutRows();
  const totalPaid = rows.filter((r) => r.status === 'paid').reduce((a, r) => a + commission(r.gross).payout, 0);
  const pending = rows.filter((r) => r.status === 'pending').reduce((a, r) => a + commission(r.gross).payout, 0);

  return (
    <SpecShell title="Выплаты" sub="Итоговый расчёт по каждому проекту: сколько было за работу и сколько удержано комиссии."
      actions={<Btn icon="card" onClick={() => app.navigate('/settings?tab=payment')}>Способ получения</Btn>}>
      <div className="stack g5">
        <div className="grid-3">
          <div className="card stack g2"><Metric value={money(totalPaid)} label="получено за всё время" /></div>
          <div className="card stack g2"><Metric value={money(pending)} label="ожидает приёмки работы" /></div>
          <div className="card stack g2"><Metric value="5%" label="комиссия Taskly" /></div>
        </div>

        <div className="card card--flush stack">
          <div className="row between g4" style={{ padding: 'var(--s4) var(--s5)', borderBottom: '1px solid var(--line)' }}>
            <h3 className="t-h4">История выплат</h3>
            <span className="t-cap muted">{pluralN(rows.length, W.record)}</span>
          </div>
          {rows.length === 0 ? (
            <Empty icon="wallet" title="Выплат пока нет"
              text="Первая выплата появится после того, как заказчик примет вашу работу по завершённому проекту."
              action={<Btn variant="primary" icon="search" onClick={() => app.navigate('/spec/projects')}>Найти проекты</Btn>} />
          ) : (
            <div className="rows">
              {rows.map((r) => {
                const c = commission(r.gross);
                return (
                  <div className="row-item payout-row" key={r.id} style={{ cursor: 'default' }}>
                    <span className="avatar"><Icon name="wallet" size={16} /></span>
                    <span className="stack g1 grow" style={{ minWidth: 0 }}>
                      <span className="t-sm trunc" style={{ fontWeight: 550 }}>{r.title}</span>
                      <span className="t-cap muted">{r.from} · {r.status === 'paid' ? r.when + ' · карта •••• 9121' : 'после приёмки работы'}</span>
                    </span>
                    <span className="stack g1 payout-sum">
                      <span className="num t-sm" style={{ fontWeight: 600 }}>{money(c.payout)}</span>
                      <span className="t-cap muted num">из {money(c.price)} · комиссия {money(c.fee)}</span>
                    </span>
                    <Badge tone={r.status === 'paid' ? 'ok' : 'warn'} dot>{r.status === 'paid' ? 'Выплачено' : 'Ожидает'}</Badge>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="card card--pad-lg stack g4">
          <div className="row g3"><Icon name="wallet" size={18} /><h3 className="t-h4">Как считается выплата</h3></div>
          <div className="grid-2" style={{ alignItems: 'start' }}>
            <div className="stack g3">
              <PayoutRows price={100000} label="Итого к получению" />
              <div className="kv-rows">
                <div className="kv-row"><dt>Срок зачисления</dt><dd>1–2 рабочих дня после приёмки</dd></div>
              </div>
            </div>
            <div className="stack g4">
              <p className="t-sm ink2">Комиссия удерживается один раз и только с успешно завершённых проектов. Если проект не принят, выплата не производится, а зарезервированные средства возвращаются заказчику.</p>
              <div className="note"><Icon name="info" size={16} />
                <span className="grow">Ваш расчёт всегда виден до отклика: в форме отклика, в проекте и здесь. Никаких неожиданных вычетов после сдачи.</span></div>
            </div>
          </div>
        </div>
      </div>
    </SpecShell>
  );
}

function SpecReviews() {
  const app = useApp();
  const me = app.me;
  const fresh = app.entities.reviews.filter((r) => r.to === me.id && r.from === 'client').map((r) => {
    const p = app.entities.projects.find((x) => x.id === r.projectId);
    return { who: p?.client, when: r.when, stars: r.stars, text: r.text || 'Без комментария', tags: r.tags, project: p?.title };
  });
  const list = app.emptyMode ? [] : [...fresh, ...me.reviewList];
  const avg = list.length ? list.reduce((a, r) => a + r.stars, 0) / list.length : null;
  return (
    <SpecShell title="Отзывы" sub="Отзывы появляются только после завершённых проектов на Taskly."
      actions={<Btn icon="user" onClick={() => app.navigate('/spec/profile')}>Мой профиль</Btn>}>
      <div className="shell-ws">
        <div className="stack g5">
          {list.length === 0 ? (
            <div className="card">
              <Empty icon="star" title="Отзывов пока нет"
                text="Первый отзыв появится после того, как заказчик примет вашу работу. Отсутствие отзывов не мешает откликаться на проекты."
                action={<Btn variant="primary" icon="search" onClick={() => app.navigate('/spec/projects')}>Найти проекты</Btn>}
                secondary={<Btn variant="ghost" onClick={() => app.navigate('/how')}>Как получить первый проект</Btn>} />
            </div>
          ) : (
            <div className="stack g4">
              {list.map((r, i) => (
                <div className="card card--pad-lg stack g4" key={i}>
                  <div className="row between wrap g3">
                    <div className="row g3">
                      <span className="avatar avatar--sm avatar--b">{initials(r.who)}</span>
                      <div className="stack g1">
                        <strong className="t-sm">{r.who}</strong>
                        <span className="t-cap muted">{r.when}</span>
                      </div>
                    </div>
                    <Stars value={r.stars} />
                  </div>
                  <p className="t-sm ink2">{r.text}</p>
                  <div className="tag-row">
                    {(r.tags || []).map((t) => <Tag key={t}>{t}</Tag>)}
                    {r.project && <Tag tone="line">Проект: {r.project}</Tag>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="stack g5 panel--sticky">
          <div className="card card--pad-lg stack g5">
            <h3 className="t-h4">Ваша репутация</h3>
            <div className="grid-2" style={{ gap: 'var(--s5)' }}>
              <Metric value={avg != null ? ratingLabel(avg) : '—'} label="средняя оценка" />
              <Metric value={list.length} label={plural(list.length, W.review)} />
              <Metric value={me.completed} label="завершено проектов" />
              <Metric value={me.onTime != null ? me.onTime + '%' : '—'} label="выполнено в срок" />
            </div>
            <p className="t-cap muted">Отзывы нельзя удалить — но можно ответить на них. Если отзыв несправедлив, напишите в поддержку с деталями проекта.</p>
          </div>
        </div>
      </div>
    </SpecShell>
  );
}

function SpecHistory() {
  const app = useApp();
  const { me, done } = useSpecData();
  const items = app.emptyMode ? [] : [
    ...done.map((p) => ({ key: p.id, title: p.title, client: p.client, gross: priceOf(p), when: p.completedAt || 'недавно', stars: null, to: '/spec/workspace/' + p.id })),
    ...me.archive.map((a, i) => ({ key: 'a' + i, title: a.title, client: a.client, gross: a.gross, when: a.when, stars: a.stars })),
  ];
  return (
    <SpecShell title="История проектов" sub="Завершённые проекты, выплаты по ним и отзывы.">
      {items.length === 0 ? (
        <div className="card">
          <Empty icon="list" title="Завершённых проектов пока нет"
            text="Каждый завершённый проект остаётся в истории — это ваш подтверждённый опыт, который видят заказчики."
            action={<Btn variant="primary" icon="search" onClick={() => app.navigate('/spec/projects')}>Найти проекты</Btn>} />
        </div>
      ) : (
        <div className="stack g4">
          {items.map((h) => {
            const c = commission(h.gross);
            return (
              <div className="card card--pad-lg stack g4" key={h.key}>
                <div className="row between wrap g4">
                  <div className="stack g2">
                    <h3 className="t-h4">{h.title}</h3>
                    <span className="t-cap muted">{h.client} · завершён {h.when}</span>
                  </div>
                  <Badge tone="ok" dot>Завершён</Badge>
                </div>
                <div className="grid-4" style={{ gap: 'var(--s5)' }}>
                  <div className="kv"><dt>Стоимость</dt><dd><Money value={c.price} /></dd></div>
                  <div className="kv"><dt>Комиссия 5%</dt><dd>− <Money value={c.fee} /></dd></div>
                  <div className="kv"><dt>Получено</dt><dd><Money value={c.payout} /></dd></div>
                  <div className="kv"><dt>Отзыв заказчика</dt><dd>{h.stars ? <Stars value={h.stars} size={12} /> : 'Ожидается'}</dd></div>
                </div>
                <div className="row g3 wrap">
                  {h.to && <Btn size="sm" onClick={() => app.navigate(h.to)}>Открыть проект</Btn>}
                  <Btn size="sm" variant="quiet" icon="download" onClick={() => app.toast('Акты и расчёты появятся после подключения сервера')}>Скачать акт и расчёт</Btn>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </SpecShell>
  );
}

function SpecProfile() {
  const app = useApp();
  const soon = useSoon();
  const me = app.me;
  const isDemo = app.emptyMode;
  const verif = [['Портфолио проверено', 'Подтверждено 20 сентября', 'Можно пройти: проверим за 1 рабочий день'],
    ['Образование подтверждено', 'Колледж, специальность «Графический дизайн»', 'Загрузите диплом или сертификат'],
    ['Тестовое задание', 'Пройдено', 'Можно пройти: около 40 минут'],
    ['Практический кейс', 'Пройден', 'Разбор задачи с куратором']];
  return (
    <SpecShell title="Мой профиль" sub="Так вас видят заказчики, когда рассматривают ваш отклик."
      actions={<><Btn icon="eye" onClick={() => app.navigate('/biz/specialists/' + me.id)}>Глазами заказчика</Btn>
        <Btn variant="primary" icon="edit" onClick={() => app.navigate('/spec/profile/edit')}>Редактировать</Btn></>}>
      <div className="shell-ws">
        <div className="stack g5">
          <div className="card card--pad-lg stack g5">
            <div className="row g5 wrap" style={{ alignItems: 'flex-start' }}>
              <Avatar person={me} size="xl" />
              <div className="stack g3 grow" style={{ minWidth: 200 }}>
                <div className="row g2 wrap"><h2 className="t-h3">{me.name}</h2><Badge tone="info" dot>{me.levelName}</Badge></div>
                <span className="t-cap muted">{me.handle} · {me.city}</span>
                <div className="row g2 wrap"><Badge tone="ok" dot>{me.availability}</Badge><Badge>Отвечает {me.responseTime}</Badge></div>
              </div>
            </div>
            <p className="t-sm ink2">{me.about}</p>
            <div className="stack g3"><span className="t-micro muted">Направления</span>
              <div className="tag-row">{directionsOf(me.directions).map((d) => <Tag key={d} tone="line">{d}</Tag>)}</div>
            </div>
            <div className="stack g3"><span className="t-micro muted">Навыки</span>
              <div className="tag-row">{me.skills.map((k) => <Tag key={k}>{k}</Tag>)}<button type="button" className="chip" style={{ height: 25 }} onClick={() => app.navigate('/spec/profile/edit')}>+ Добавить навык</button></div>
            </div>
          </div>

          <div className="card card--pad-lg stack g5">
            <div className="row between wrap g3"><h3 className="t-h4">Портфолио</h3>
              <Btn size="sm" variant="quiet" icon="plus" onClick={() => app.navigate('/spec/profile/edit')}>Добавить работу</Btn></div>
            {isDemo || me.portfolio.length === 0 ? (
              <Empty inline icon="folder" title="Добавьте первую работу"
                text="Подойдут учебные проекты, личные кейсы и курсовые — они помогают заказчику понять ваш уровень, даже если коммерческих проектов ещё нет."
                action={<Btn variant="primary" icon="plus" onClick={() => app.navigate('/spec/profile/edit')}>Добавить работу</Btn>} />
            ) : (
              <div className="grid-3">
                {me.portfolio.map((w, i) => (
                  <div className="stack g3" key={i}>
                    <Ph label={w.ph || 'изображение работы'} variant="tall" />
                    <div className="stack g1">
                      <span className="t-sm" style={{ fontWeight: 550 }}>{w.t || 'Без названия'}</span>
                      <span className="t-cap muted">{w.s}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card card--pad-lg stack g5">
            <div className="row between wrap g3"><h3 className="t-h4">Верификация</h3>
              <Badge tone={me.level === 'new' ? undefined : 'info'} dot>{me.levelName}</Badge></div>
            <div className="grid-2" style={{ gap: 'var(--s4)' }}>
              {verif.map(([t, okText, todo]) => {
                const done = me.verifiedVia.includes(t);
                return (
                  <div className="card card--soft card--pad-sm stack g2" key={t}>
                    <div className="row g2">
                      <Icon name={done ? 'check' : 'plus'} size={16} style={{ color: done ? 'var(--ok)' : 'var(--ink-3)' }} />
                      <span className="t-sm" style={{ fontWeight: 550 }}>{t}</span>
                    </div>
                    <span className="t-cap muted">{done ? okText : todo}</span>
                    {!done && <Btn size="sm" variant="quiet" style={{ alignSelf: 'flex-start' }} onClick={() => soon('Верификация')}>Начать</Btn>}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="stack g5 panel--sticky">
          <div className="card card--pad-lg stack g5">
            <h3 className="t-h4">Показатели</h3>
            <div className="grid-2" style={{ gap: 'var(--s5)' }}>
              <Metric value={me.completed} label={plural(me.completed, ['завершённый проект', 'завершённых проекта', 'завершённых проектов'])} />
              <Metric value={me.onTime != null ? me.onTime + '%' : '—'} label="выполнено в срок" />
              <Metric value={me.successRate != null ? me.successRate + '%' : '—'} label="успешность выполнения" />
              <Metric value={me.reviews} label={plural(me.reviews, W.review)} />
            </div>
            <p className="t-cap muted">Мы не показываем проценты, если данных мало: прочерк честнее, чем выдуманная цифра.</p>
          </div>
        </div>
      </div>
    </SpecShell>
  );
}

const AVAILABILITY = ['Свободна', 'Свободен', 'Свободна с 30 сентября', 'Свободен с 1 октября', 'Беру 2 проекта в месяц'];

function SpecProfileEdit() {
  const app = useApp();
  const soon = useSoon();
  const me = app.me;
  const [f, setF] = useState({ name: me.name, headline: me.headline, city: me.city, about: me.about, availability: me.availability, link: me.link || '' });
  const [dirs, setDirs] = useState(me.directions);
  const [sk, setSk] = useState(me.skills);
  const [custom, setCustom] = useState('');
  const [items, setItems] = useState(me.portfolio);
  const [err, setErr] = useState({});
  const set = (k, v) => setF((x) => ({ ...x, [k]: v }));
  const toggleIn = (arr, setArr, v) => setArr(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
  const addSkill = () => { const v = custom.trim(); if (v && !sk.includes(v) && sk.length < 12) setSk([...sk, v]); setCustom(''); };
  const save = () => {
    const e = {};
    if (f.name.trim().length < 2) e.name = 'Укажите имя и фамилию.';
    if (f.headline.trim().length < 3) e.headline = 'Добавьте строку о себе.';
    if (!sk.length) e.skills = 'Выберите хотя бы один навык.';
    setErr(e);
    if (Object.keys(e).length) { app.toast('Проверьте поля профиля', 'err'); return; }
    app.updateSpecProfile({ ...f, name: f.name.trim(), initials: initials(f.name), directions: dirs, skills: sk, portfolio: items.filter((w) => w.t.trim()) });
    app.toast('Профиль сохранён');
    app.navigate('/spec/profile');
  };
  const allSkills = [...new Set([...skills, ...sk])];

  return (
    <SpecShell title="Редактирование профиля" sub="Понятный профиль увеличивает шанс, что заказчик выберет именно вас."
      actions={<><Btn variant="ghost" onClick={() => app.navigate('/spec/profile')}>Отменить</Btn>
        <Btn variant="primary" onClick={save}>Сохранить изменения</Btn></>}>
      <div className="stack g5" style={{ maxWidth: 880 }}>
        <div className="card card--pad-lg stack g6">
          <h3 className="t-h4">Основное</h3>
          <div className="grid-2" style={{ gap: 'var(--s5)' }}>
            <Field label="Имя и фамилия" required error={err.name} id="pe-name"><input id="pe-name" className="input" value={f.name} onChange={(e) => set('name', e.target.value)} /></Field>
            <Field label="Строка о себе" required error={err.headline} hint="Появится в карточке. Например: «UI/UX и лендинги в Figma»" id="pe-head">
              <input id="pe-head" className="input" value={f.headline} onChange={(e) => set('headline', e.target.value)} /></Field>
            <Field label="Город и формат" hint="Город · удалённо" id="pe-city"><input id="pe-city" className="input" value={f.city} onChange={(e) => set('city', e.target.value)} /></Field>
            <Field label="Ссылка на портфолио" hint="Необязательно" id="pe-link"><input id="pe-link" className="input" placeholder="behance.net/…" value={f.link} onChange={(e) => set('link', e.target.value)} /></Field>
          </div>
          <Field label="О себе" hint="3–4 предложения: что умеете, что интересно делать, чем подтверждён уровень" id="pe-about">
            <textarea id="pe-about" className="textarea" value={f.about} onChange={(e) => set('about', e.target.value)} />
          </Field>
          <Field label="Когда вы свободны" hint="Помогает заказчику понять сроки" id="pe-av">
            <select id="pe-av" className="select" value={f.availability} onChange={(e) => set('availability', e.target.value)} style={{ maxWidth: 320 }}>
              {[...new Set([f.availability, ...AVAILABILITY])].map((o) => <option key={o}>{o}</option>)}
            </select>
          </Field>
        </div>

        <div className="card card--pad-lg stack g6">
          <div className="stack g2">
            <h3 className="t-h4">Направления и навыки</h3>
            <p className="t-sm muted">Навыки определяют, какие проекты вам показывать и где появится метка совпадения.</p>
          </div>
          <Field label="Направления">
            <div className="chips">{directions.map((d) => (
              <button type="button" key={d.id} aria-pressed={dirs.includes(d.id)} className={'chip' + (dirs.includes(d.id) ? ' is-on' : '')} onClick={() => toggleIn(dirs, setDirs, d.id)}>{d.name}</button>))}
            </div>
          </Field>
          <Field label="Навыки" error={err.skills} hint={'Выбрано ' + sk.length + ' из 12 — важнее точность, чем количество'}>
            <div className="chips">{allSkills.map((s) => (
              <button type="button" key={s} aria-pressed={sk.includes(s)} disabled={!sk.includes(s) && sk.length >= 12} className={'chip' + (sk.includes(s) ? ' is-on' : '')} onClick={() => toggleIn(sk, setSk, s)}>{s}</button>))}
            </div>
          </Field>
          <form className="row g3" onSubmit={(e) => { e.preventDefault(); addSkill(); }}>
            <input className="input" placeholder="Добавить свой навык" aria-label="Свой навык" value={custom} onChange={(e) => setCustom(e.target.value)} style={{ maxWidth: 320 }} />
            <Btn icon="plus" type="submit" disabled={!custom.trim() || sk.length >= 12}>Добавить</Btn>
          </form>
        </div>

        <div className="card card--pad-lg stack g6">
          <div className="row between wrap g3">
            <div className="stack g2">
              <h3 className="t-h4">Портфолио</h3>
              <p className="t-sm muted">Работы видны в откликах. Даже одна аккуратная работа повышает доверие.</p>
            </div>
            <Btn variant="quiet" icon="plus" onClick={() => setItems([...items, { t: '', s: '', ph: 'новая работа' }])}>Добавить работу</Btn>
          </div>
          <div className="stack g4">
            {items.length === 0 && <p className="t-sm muted">Работ пока нет.</p>}
            {items.map((it, i) => (
              <div className="card card--pad-sm stack g3" key={i}>
                <div className="row between g3">
                  <strong className="t-cap">Работа {i + 1}</strong>
                  <button type="button" className="btn btn--icon btn--sm" aria-label={'Удалить работу ' + (i + 1)} onClick={() => setItems(items.filter((_, j) => j !== i))}><Icon name="trash" size={15} /></button>
                </div>
                <div className="row g4 wrap" style={{ alignItems: 'flex-start' }}>
                  <Ph label={it.ph || 'изображение'} variant="shot" style={{ width: 150, flex: 'none' }} />
                  <div className="stack g3 grow" style={{ minWidth: 200 }}>
                    <Field label="Название" id={'pw-t' + i}><input id={'pw-t' + i} className="input" value={it.t} onChange={(e) => setItems(items.map((w, j) => (j === i ? { ...w, t: e.target.value } : w)))} /></Field>
                    <Field label="Что сделано" id={'pw-s' + i}><input id={'pw-s' + i} className="input" value={it.s} onChange={(e) => setItems(items.map((w, j) => (j === i ? { ...w, s: e.target.value } : w)))} /></Field>
                    <Btn variant="secondary" size="sm" icon="upload" style={{ alignSelf: 'flex-start' }} onClick={() => soon('Загрузка изображений')}>Заменить изображение</Btn>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="row g3 wrap">
          <Btn variant="primary" size="lg" onClick={save}>Сохранить изменения</Btn>
          <Btn size="lg" variant="ghost" onClick={() => app.navigate('/spec/profile')}>Отмена</Btn>
        </div>
      </div>
    </SpecShell>
  );
}

export { SpecDashboard, SpecProjects, SpecProjectDetail, SpecApply, SpecProposals, SpecMessages, SpecPayout, SpecReviews, SpecHistory, SpecProfile, SpecProfileEdit, ProjectCardSpec, ProposalStatus, SpecShell, SPEC_NAV };
