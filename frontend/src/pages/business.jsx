/* Taskly — кабинет бизнеса: дашборд, проекты, мастер создания, предпросмотр ТЗ, опубликованный проект. */
import React, { useState, useEffect } from 'react';
import { Icon, useApp, Btn, Link, Field, Tag, Badge, StatusPill, Avatar, Modal, Empty, Money, PayoutRows, SafeNote, Rail, Metric, Tabs, useSoon } from '../components/ui.jsx';
import { AppShell, SideNav } from '../components/shell.jsx';
import { directions, skills, levels, workFormats, directionsOf, levelName, formatNames } from '../data/mock.js';
import { specialistById, proposalsOf, priceOf, daysOf, isOpen } from '../store/store.jsx';
import { money, plural, pluralN, W, daysLabel, editsLabel, dateLabel, today } from '../lib/format.js';

const BIZ_NAV = [
  { to: '/biz', label: 'Обзор', icon: 'grid' },
  { to: '/biz/projects', label: 'Мои проекты', icon: 'briefcase' },
  { to: '/biz/messages', label: 'Сообщения', icon: 'chat' },
  { to: '/biz/specialists', label: 'Найти специалиста', icon: 'search' },
  { sep: true },
  { to: '/biz/history', label: 'История проектов', icon: 'list' },
  { to: '/biz/profile', label: 'Профиль компании', icon: 'user' },
  { to: '/settings', label: 'Настройки', icon: 'settings' },
];

function BizShell({ title, sub, crumbs, actions, children }) {
  return (
    <AppShell wide title={title} sub={sub} crumbs={crumbs} actions={actions}
      aside={<SideNav items={BIZ_NAV} label="Разделы кабинета бизнеса" />}>
      {children}
    </AppShell>
  );
}

/* Проекты демо-бизнеса с учётом режима «пустой аккаунт» */
export function useMyProjects() {
  const app = useApp();
  return app.emptyMode ? [] : app.entities.projects.filter((p) => p.mine);
}

/* Куда ведёт карточка проекта: открытый — на страницу проекта, остальные — в рабочее пространство */
export const bizProjectUrl = (p) => (isOpen(p) ? '/biz/projects/' + p.id : '/biz/workspace/' + p.id);

/* Что требует действия заказчика — вычисляется из состояния проектов */
function useClientTodo(mine) {
  const app = useApp();
  const items = [];
  mine.forEach((p) => {
    const s = specialistById(p.specialistId);
    if (p.status === 'on_review') items.push({ id: p.id + '-r', to: '/biz/workspace/' + p.id, icon: 'upload', av: 'avatar--b', title: 'Исполнитель отправил результат на проверку', sub: p.title + (s ? ' · ' + s.name : ''), badge: <Badge tone="warn">На проверке</Badge> });
    if (p.status === 'awaiting_payment') items.push({ id: p.id + '-p', to: '/biz/workspace/' + p.id, icon: 'wallet', av: 'avatar--c', title: 'Зарезервируйте оплату, чтобы исполнитель начал работу', sub: p.title + ' · ' + money(priceOf(p)), badge: <Badge tone="warn">Ожидает оплаты</Badge> });
    if (isOpen(p)) {
      const fresh = proposalsOf(app.entities, p.id).filter((x) => !x.read && x.status !== 'withdrawn');
      if (fresh.length) {
        const prices = fresh.map((x) => x.price);
        items.push({ id: p.id + '-n', to: '/biz/projects/' + p.id + '/proposals', icon: 'chat', av: '', title: pluralN(fresh.length, ['новый отклик', 'новых отклика', 'новых откликов']) + ' на «' + p.title + '»', sub: 'Цены от ' + money(Math.min(...prices)) + ' · с меткой совпадения навыков', badge: <Badge tone="accent">Новые</Badge> });
      }
    }
  });
  app.entities.changeRequests.forEach((c) => {
    const p = mine.find((x) => x.id === c.projectId);
    if (p && c.status === 'pending' && c.proposedBy === 'specialist') items.push({ id: c.id, to: '/biz/workspace/' + p.id + '?s=changes', icon: 'swap', av: 'avatar--d', title: 'Исполнитель предлагает изменить задачу', sub: c.title + ' · ' + p.title, badge: <Badge tone="warn">Нужно решение</Badge> });
  });
  return items;
}

/* ============================ Обзор ============================ */
function BizDashboard() {
  const app = useApp();
  const mine = useMyProjects();
  const active = mine.filter((p) => p.status !== 'done');
  const onReview = mine.filter((p) => p.status === 'on_review' || p.status === 'needs_fix');
  const done = mine.filter((p) => p.status === 'done');
  const todo = useClientTodo(mine);
  const freshCount = mine.filter(isOpen).reduce((a, p) => a + proposalsOf(app.entities, p.id).filter((x) => !x.read).length, 0);

  return (
    <BizShell title={'Здравствуйте, ' + app.bizName} sub="Здесь только то, что требует вашего действия."
      actions={<><Btn variant="ghost" icon="search" onClick={() => app.navigate('/biz/specialists')}>Найти специалиста</Btn>
        <Btn variant="primary" icon="plus" onClick={() => app.navigate('/biz/projects/new')}>Создать проект</Btn></>}>

      {todo.length > 0 && (
        <div className="card card--pad-lg stack g5">
          <div className="row between wrap g3">
            <div className="stack g1">
              <h2 className="t-h4">Требует вашего действия</h2>
              <span className="t-cap muted">Сначала — сдача работы и оплата, потом отклики</span>
            </div>
            <Badge tone="accent">{pluralN(todo.length, W.task)}</Badge>
          </div>
          <div className="rows bleed">
            {todo.map((t) => (
              <button type="button" key={t.id} className="row-item" onClick={() => app.navigate(t.to)}>
                <span className={'avatar ' + t.av}><Icon name={t.icon} size={17} /></span>
                <span className="stack g1 grow">
                  <span className="t-sm" style={{ fontWeight: 550 }}>{t.title}</span>
                  <span className="t-cap muted">{t.sub}</span>
                </span>
                {t.badge}
                <Icon name="chevR" size={17} className="chev" />
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid-3">
        <div className="metric card"><Metric value={active.length} label={plural(active.length, ['активный проект', 'активных проекта', 'активных проектов'])} /></div>
        <div className="metric card"><Metric value={onReview.length} label="на проверке" /></div>
        <div className="metric card"><Metric value={freshCount} label={plural(freshCount, ['новый отклик', 'новых отклика', 'новых откликов'])} /></div>
      </div>

      <div className="stack g4">
        <div className="row between g3">
          <h2 className="t-h4">Мои активные проекты</h2>
          <Link to="/biz/projects" className="t-cap muted row g1">Все проекты<Icon name="arrowR" size={14} /></Link>
        </div>

        {active.length === 0 ? (
          <div className="card">
            <Empty icon="briefcase" inline title={mine.length === 0 ? 'У вас пока нет проектов' : 'Активных проектов нет'}
              text={mine.length === 0
                ? 'Опишите задачу своими словами — Taskly соберёт структурированное ТЗ и покажет подходящих специалистов.'
                : 'Все проекты завершены. Создайте новый, если появилась задача.'}
              action={<Btn variant="primary" onClick={() => app.navigate('/biz/projects/new')}>{mine.length === 0 ? 'Создать первый проект' : 'Создать проект'}</Btn>}
              secondary={<Btn variant="ghost" onClick={() => app.navigate('/how')}>Как это работает</Btn>} />
          </div>
        ) : (
          <div className="grid-2">
            {active.map((p) => <ProjectCard key={p.id} p={p} />)}
          </div>
        )}
      </div>

      {done.length > 0 && (
        <div className="stack g4">
          <div className="row between g3"><h2 className="t-h4">Недавно завершённые</h2><Link to="/biz/history" className="t-cap muted">История проектов</Link></div>
          {done.map((p) => <ProjectRow key={p.id} p={p} />)}
        </div>
      )}

      <div className="card card--pad-lg stack g4">
        <div className="row g3"><Icon name="shield" size={18} /><h3 className="t-h4">Как защищена ваша оплата</h3></div>
        <div className="grid-3" style={{ gap: 'var(--s5)' }}>
          {[['Резервирование до старта', 'Средства списываются с карты и резервируются платёжной системой, а не уходят исполнителю.'],
            ['Выплата после приёмки', 'Специалист получает деньги за вычетом комиссии 5% только после того, как вы примете результат.'],
            ['Поддержка при спорах', 'Если исполнитель пропал или результат не соответствует ТЗ, откройте обращение из проекта.']].map(([t, s]) => (
            <div className="stack g2" key={t}>
              <span className="t-sm" style={{ fontWeight: 600 }}>{t}</span>
              <span className="t-cap muted">{s}</span>
            </div>
          ))}
        </div>
        <Link to="/security" className="btn btn--ghost" style={{ alignSelf: 'flex-start', paddingLeft: 0 }}>Подробнее о безопасной сделке<Icon name="arrowR" size={15} /></Link>
      </div>
    </BizShell>
  );
}

/* ---------------------- Карточки проекта ---------------------- */
const nextStep = (p, e) => {
  switch (p.status) {
    case 'searching': case 'published': return pluralN(proposalsOf(e, p.id).length, W.proposal) + ' · выберите исполнителя';
    case 'awaiting_payment': return 'Ожидает резервирования оплаты';
    case 'in_work': return 'Этап: ' + (p.stages[p.stage] || p.stages[p.stages.length - 1]);
    case 'on_review': return 'Результат ждёт вашей проверки';
    case 'needs_fix': return 'Исполнитель вносит правки';
    case 'done': return 'Проект завершён';
    default: return '';
  }
};

function ProjectCard({ p }) {
  const app = useApp();
  const s = specialistById(p.specialistId);
  const to = bizProjectUrl(p);
  const open = () => app.navigate(to);
  return (
    <div className="card card--pad-lg card--link stack g5" onClick={open} role="link" tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } }} aria-label={'Открыть проект ' + p.title}>
      <div className="row between g4">
        <StatusPill id={p.status} />
        <span className="t-cap muted num">{money(priceOf(p))}</span>
      </div>
      <div className="stack g2">
        <h3 className="t-h4">{p.title}</h3>
        <p className="t-sm muted clamp2">{p.brief}</p>
      </div>
      {s ? (
        <div className="row g3">
          <Avatar person={s} size="sm" />
          <span className="t-cap trunc" style={{ minWidth: 0 }}>{s.name}</span>
          <span className="grow" />
          {p.paid ? <Badge tone="ok" dot>Оплата зарезервирована</Badge> : <Badge tone="warn" dot>Ждёт оплаты</Badge>}
        </div>
      ) : (
        <div className="row between wrap g3">
          <span className="t-cap muted">{pluralN(proposalsOf(app.entities, p.id).length, W.proposal)}</span>
          <span className="t-cap" style={{ color: 'var(--accent)', fontWeight: 550 }}>Смотреть отклики →</span>
        </div>
      )}
      <Rail stage={isOpen(p) ? -1 : p.stage} total={p.stages.length} />
      <div className="row between g3 wrap t-cap muted">
        <span>{p.dueDate ? 'Дедлайн ' + dateLabel(p.dueDate) : 'Срок: ' + daysLabel(daysOf(p))}</span>
        <span>{nextStep(p, app.entities)}</span>
      </div>
    </div>
  );
}

function ProjectRow({ p }) {
  const app = useApp();
  const s = specialistById(p.specialistId);
  return (
    <button type="button" className="card card--pad-sm row g4" style={{ textAlign: 'left' }} onClick={() => app.navigate('/biz/workspace/' + p.id)}>
      <span className="grow stack g1" style={{ minWidth: 0 }}>
        <span className="t-sm" style={{ fontWeight: 550 }}>{p.title}</span>
        <span className="t-cap muted">{s ? s.name : 'Исполнитель не выбран'} · {money(priceOf(p))} · завершён{p.completedAt ? ' ' + p.completedAt : ''}</span>
      </span>
      {p.reviewByClient ? <Badge tone="ok" dot>Отзыв оставлен</Badge> : <Badge tone="accent">Оставить отзыв</Badge>}
      <Icon name="chevR" size={17} className="chev" />
    </button>
  );
}

/* ============================ Мои проекты ============================ */
function BizProjects() {
  const app = useApp();
  const [tab, setTab] = useState('active');
  const [q, setQ] = useState('');
  const [dir, setDir] = useState('all');
  const all = useMyProjects();

  const inTab = (p, t) => (t === 'active' ? p.status !== 'done' : t === 'review' ? p.status === 'on_review' || p.status === 'needs_fix' : p.status === 'done');
  const list = all.filter((p) => inTab(p, tab))
    .filter((p) => dir === 'all' || p.directions.includes(dir))
    .filter((p) => !q.trim() || (p.title + ' ' + p.brief).toLowerCase().includes(q.trim().toLowerCase()));
  const filtered = q.trim() || dir !== 'all';

  return (
    <BizShell title="Мои проекты" sub="Все проекты в одном списке: от поиска исполнителя до завершения."
      crumbs={[{ label: 'Кабинет', to: '/biz' }, { label: 'Мои проекты' }]}
      actions={<Btn variant="primary" icon="plus" onClick={() => app.navigate('/biz/projects/new')}>Создать проект</Btn>}>

      <div className="stack g5">
        <Tabs value={tab} onChange={setTab} items={[
          { id: 'active', label: 'Активные', count: all.filter((p) => inTab(p, 'active')).length },
          { id: 'review', label: 'На проверке', count: all.filter((p) => inTab(p, 'review')).length },
          { id: 'done', label: 'Завершённые', count: all.filter((p) => inTab(p, 'done')).length },
        ]} />
        <div className="filter-bar">
          <input className="input input--search grow" style={{ maxWidth: 340 }} placeholder="Поиск по названию проекта" aria-label="Поиск по названию проекта" value={q} onChange={(e) => setQ(e.target.value)} />
          <select className="select" style={{ width: 'auto', minWidth: 190 }} value={dir} onChange={(e) => setDir(e.target.value)} aria-label="Направление">
            <option value="all">Все направления</option>
            {directions.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
          <span className="grow" />
          <span className="t-cap muted">Найдено: {list.length}</span>
        </div>

        {list.length === 0 ? (
          <div className="card">
            <Empty icon="briefcase" title={filtered ? 'По вашему запросу ничего не найдено' : tab === 'done' ? 'Завершённых проектов пока нет' : tab === 'review' ? 'На проверке ничего нет' : 'У вас пока нет проектов'}
              text={filtered ? 'Попробуйте изменить запрос или сбросить фильтр направления.'
                : 'Опишите задачу своими словами — Taskly соберёт структурированное ТЗ и покажет подходящих специалистов.'}
              action={filtered ? <Btn onClick={() => { setQ(''); setDir('all'); }}>Сбросить фильтры</Btn> : <Btn variant="primary" icon="plus" onClick={() => app.navigate('/biz/projects/new')}>Создать проект</Btn>}
              secondary={!filtered && <Btn variant="ghost" onClick={() => app.navigate('/biz/specialists')}>Найти специалиста</Btn>} />
          </div>
        ) : (
          <div className="grid-2">{list.map((p) => <ProjectCard key={p.id} p={p} />)}</div>
        )}
      </div>
    </BizShell>
  );
}

/* ============================ Мастер создания проекта ============================ */
const WIZ_STEPS = [
  { t: 'Что нужно сделать', s: 'Задача своими словами' },
  { t: 'Какой результат', s: 'Что должно быть на выходе' },
  { t: 'Материалы', s: 'Что у вас уже есть' },
  { t: 'Когда нужно', s: 'Срок' },
  { t: 'Бюджет', s: 'Стоимость проекта' },
  { t: 'Дополнительно', s: 'Условия и правки' },
];
const DEADLINES = [3, 5, 7, 14, 21, 30];
const MIN_PRICE = 5000;

export const emptyDraft = () => ({
  step: 0, title: '', brief: '', result: '', includes: [], excludes: '', materials: [],
  days: 14, dueDate: '', price: 100000, edits: 2, skills: [],
  directions: [], level: 'junior', format: ['remote'], stages: true, note: '',
});

/* Проверка черновика — одна функция и для кнопки «Продолжить», и для предпросмотра */
export function validateDraft(f, upTo = 5) {
  const e = {};
  if (upTo >= 0) {
    if (f.title.trim().length < 4) e.title = 'Назовите проект — хотя бы коротко, например «Лендинг для студии»';
    if (f.brief.trim().length < 20) e.brief = 'Опишите задачу подробнее, минимум 2–3 предложения. Это основа ТЗ.';
  }
  if (upTo >= 1 && f.result.trim().length < 10) e.result = 'Опишите, что должно получиться на выходе.';
  if (upTo >= 3 && f.dueDate && f.dueDate < today()) e.dueDate = 'Дата дедлайна уже прошла.';
  if (upTo >= 4 && f.price < MIN_PRICE) e.price = 'Минимальная стоимость проекта — ' + money(MIN_PRICE) + '.';
  if (upTo >= 5) {
    if (!f.directions.length) e.directions = 'Выберите хотя бы одно направление.';
    if (!f.skills.length) e.skills = 'Выберите хотя бы один навык — по ним проект найдут специалисты.';
  }
  return e;
}
const stepOfError = (e) => (e.title || e.brief ? 0 : e.result ? 1 : e.dueDate ? 3 : e.price ? 4 : 5);

function BizNewProject() {
  const app = useApp();
  const soon = useSoon();
  const [f, setF] = useState(() => ({ ...emptyDraft(), ...(app.draft || {}) }));
  const step = f.step;
  const set = (k, v) => setF((x) => ({ ...x, [k]: v }));
  const setStep = (n) => set('step', n);
  const toggleIn = (k, v) => setF((x) => ({ ...x, [k]: x[k].includes(v) ? x[k].filter((y) => y !== v) : [...x[k], v] }));
  const [includeInput, setIncludeInput] = useState('');
  const [err, setErr] = useState({});

  /* Черновик сохраняется по ходу заполнения — ничего не теряется при уходе со страницы */
  useEffect(() => { const t = setTimeout(() => app.saveDraft(f), 300); return () => clearTimeout(t); }, [f]);

  const addInclude = () => { if (includeInput.trim()) { set('includes', [...f.includes, includeInput.trim()]); setIncludeInput(''); } };

  const goPreview = () => {
    const e = validateDraft(f, 5);
    setErr(e);
    if (Object.keys(e).length) { setStep(stepOfError(e)); return; }
    app.saveDraft(f);
    app.navigate('/biz/projects/new/preview');
  };

  const next = () => {
    const e = validateDraft(f, step);
    setErr(e);
    if (Object.keys(e).length) { setStep(Math.min(step, stepOfError(e))); return; }
    if (step < 5) { setStep(step + 1); window.scrollTo({ top: 0 }); return; }
    goPreview();
    app.toast('ТЗ собрано. Проверьте и опубликуйте проект.');
  };

  const examples = [
    'Нужен лендинг для студии маникюра: услуги, прайс, фото работ и кнопка записи в WhatsApp.',
    'Есть 4 выгрузки из касс за квартал — нужно свести в одну таблицу и найти расхождения.',
    'Хочу, чтобы клиенты записывались в Telegram-боте, а записи попадали в Google Таблицу.',
  ];

  return (
    <AppShell wide crumbs={[{ label: 'Кабинет', to: '/biz' }, { label: 'Мои проекты', to: '/biz/projects' }, { label: 'Создание проекта' }]}
      title="Создание проекта" sub="Шесть простых вопросов — на выходе структурированное ТЗ, которое подтверждает специалист."
      actions={<><span className="t-cap muted nowrap">Шаг {step + 1} из 6</span><Btn variant="ghost" onClick={() => { app.saveDraft(f); app.toast('Черновик сохранён'); app.navigate('/biz/projects'); }}>Сохранить и выйти</Btn></>}>
      <div className="wiz">
        <div className="stack g5 panel--sticky">
          <div className="steps">
            {WIZ_STEPS.map((s, i) => {
              const st = i < step ? 'is-done' : i === step ? 'is-now' : 'is-todo';
              return (
                <button type="button" className={'step-item step-item--btn ' + st} key={s.t} onClick={() => i < step && setStep(i)} disabled={i > step} aria-current={i === step ? 'step' : undefined}>
                  <span className="step-mark"><span className="step-dot">{i < step ? <Icon name="check" size={13} /> : i + 1}</span><span className="step-line" /></span>
                  <span className="step-body stack g1" style={{ paddingBottom: 'var(--s4)' }}>
                    <span className="step-title">{s.t}</span><span className="step-sub">{s.s}</span>
                  </span>
                </button>
              );
            })}
          </div>
          <div className="note"><Icon name="shield" size={16} />
            <span className="grow">Оплата резервируется только после того, как вы выберете исполнителя и подтвердите условия.</span>
          </div>
        </div>

        <div className="stack g5">
          <div className="card card--pad-lg stack g6">
            {step === 0 && (
              <>
                <div className="stack g2">
                  <h2 className="t-h3">Что вам нужно сделать?</h2>
                  <p className="t-sm muted">Опишите задачу своими словами. Не нужно знать терминов и подбирать категории — мы поймём и поможем оформить.</p>
                </div>
                <Field label="Название проекта" required error={err.title} hint="Появится в списке проектов и в откликах" id="wz-title">
                  <input id="wz-title" className="input" maxLength={90} placeholder="Например: Лендинг для студии маникюра" value={f.title} onChange={(e) => set('title', e.target.value)} data-invalid={!!err.title} />
                </Field>
                <Field label="Опишите задачу" required error={err.brief} hint="Что происходит сейчас, что нужно получить, для кого это делается" id="wz-brief">
                  <textarea id="wz-brief" className="textarea" style={{ minHeight: 150 }} placeholder="Например: у студии есть только Instagram, клиенты звонят и часто не дозваниваются…"
                    value={f.brief} onChange={(e) => set('brief', e.target.value)} data-invalid={!!err.brief} />
                </Field>
                <div className="stack g3">
                  <span className="t-cap muted">Можно начать с примера — потом отредактируете</span>
                  <div className="stack g2">
                    {examples.map((ex) => (
                      <button type="button" key={ex} className="card card--pad-sm row g3" style={{ textAlign: 'left', padding: 'var(--s3) var(--s4)' }}
                        onClick={() => set('brief', ex)}>
                        <Icon name="sparkle" size={15} style={{ color: 'var(--accent)' }} />
                        <span className="t-cap ink2 grow">{ex}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {step === 1 && (
              <>
                <div className="stack g2">
                  <h2 className="t-h3">Какой результат вы хотите получить?</h2>
                  <p className="t-sm muted">Опишите результат так, как будто принимаете работу. Это главный пункт ТЗ, по которому специалист отчитывается.</p>
                </div>
                <Field label="Ожидаемый результат" required error={err.result} hint="Например: «готовая страница, адаптивная под телефон, ссылка на опубликованную версию и исходники в Figma»" id="wz-result">
                  <textarea id="wz-result" className="textarea" style={{ minHeight: 110 }} value={f.result} onChange={(e) => set('result', e.target.value)} data-invalid={!!err.result} />
                </Field>
                <Field label="Что входит в работу" hint="Добавляйте пункты по одному — так ТЗ читается понятнее" id="wz-inc">
                  <div className="row g3">
                    <input id="wz-inc" className="input" placeholder="Например: дизайн в Figma и вёрстка страницы" value={includeInput}
                      onChange={(e) => setIncludeInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addInclude(); } }} />
                    <Btn icon="plus" onClick={addInclude}>Добавить</Btn>
                  </div>
                </Field>
                {f.includes.length > 0 && (
                  <div className="stack g2">
                    {f.includes.map((it, i) => (
                      <div className="row g3 card card--pad-sm" key={i} style={{ padding: 'var(--s3) var(--s4)' }}>
                        <Icon name="check" size={15} style={{ color: 'var(--ok)' }} />
                        <span className="t-sm grow">{it}</span>
                        <button type="button" className="btn btn--icon btn--sm" onClick={() => set('includes', f.includes.filter((_, j) => j !== i))} aria-label={'Удалить пункт ' + it}><Icon name="trash" size={14} /></button>
                      </div>
                    ))}
                  </div>
                )}
                <Field label="Что не входит в работу" hint="По одному пункту на строку. Важный пункт: он защищает обе стороны от разных ожиданий" id="wz-exc">
                  <textarea id="wz-exc" className="textarea" style={{ minHeight: 88 }} placeholder={'Домен и хостинг\nФотографии\nТексты'} value={f.excludes} onChange={(e) => set('excludes', e.target.value)} />
                </Field>
              </>
            )}

            {step === 2 && (
              <>
                <div className="stack g2">
                  <h2 className="t-h3">Есть ли материалы, примеры или требования?</h2>
                  <p className="t-sm muted">Если материалов нет — так и отметьте. Тогда специалист учтёт это в отклике и предложит решение.</p>
                </div>
                <div className="chips">
                  {['Логотип в векторе', 'Тексты и описания', 'Фотографии', 'Прайс или таблица', 'Примеры, которые нравятся',
                    'Ссылка на текущий сайт', 'Материалов нет'].map((m) => (
                    <button type="button" key={m} aria-pressed={f.materials.includes(m)} className={'chip' + (f.materials.includes(m) ? ' is-on' : '')} onClick={() => toggleIn('materials', m)}>{m}</button>
                  ))}
                </div>
                <div className="drop stack g3 center">
                  <Icon name="upload" size={20} />
                  <div className="stack g1">
                    <strong className="t-sm" style={{ color: 'var(--ink)' }}>Перетащите файлы сюда</strong>
                    <span>PDF, PNG, JPG, DOCX или таблица · до 25 МБ</span>
                  </div>
                  <Btn variant="secondary" size="sm" onClick={() => soon('Загрузка файлов')}>Выбрать файлы</Btn>
                </div>
                <Field label="Требования и пожелания" hint="Необязательно. Например: «спокойная типографика, без ярких блоков»" id="wz-note">
                  <textarea id="wz-note" className="textarea" style={{ minHeight: 88 }} value={f.note} onChange={(e) => set('note', e.target.value)} />
                </Field>
              </>
            )}

            {step === 3 && (
              <>
                <div className="stack g2">
                  <h2 className="t-h3">Когда нужен результат?</h2>
                  <p className="t-sm muted">Срок попадёт в ТЗ вместе с этапами. Специалист может предложить свой срок в отклике — вы увидите разницу.</p>
                </div>
                <Field label="Желаемый срок" required>
                  <div className="chips">
                    {DEADLINES.map((d) => (
                      <button type="button" key={d} aria-pressed={f.days === d} className={'chip' + (f.days === d ? ' is-on' : '')} onClick={() => set('days', d)}>{daysLabel(d)}</button>
                    ))}
                  </div>
                </Field>
                <Field label="Нужен конкретный дедлайн?" hint="Необязательно. Можно указать дату, если есть привязка к событию" error={err.dueDate} id="wz-due">
                  <input id="wz-due" className="input" type="date" min={today()} value={f.dueDate} onChange={(e) => set('dueDate', e.target.value)} style={{ maxWidth: 240 }} />
                </Field>
                <Field label="Разбить работу на этапы?" hint="Удобно для крупных задач: видно, на каком шаге проект">
                  <div className="stack g3">
                    <label className="card card--pad-sm" style={{ cursor: 'pointer', padding: 'var(--s4)' }}>
                      <span className="radio"><input type="radio" name="st" checked={f.stages} onChange={() => set('stages', true)} />
                        <span><strong>Да, четыре простых этапа</strong>Подготовка → основная работа → проверка → результат</span></span>
                    </label>
                    <label className="card card--pad-sm" style={{ cursor: 'pointer', padding: 'var(--s4)' }}>
                      <span className="radio"><input type="radio" name="st" checked={!f.stages} onChange={() => set('stages', false)} />
                        <span><strong>Нет, просто результат</strong>Один этап: специалист сдаёт готовую работу</span></span>
                    </label>
                  </div>
                </Field>
              </>
            )}

            {step === 4 && (
              <>
                <div className="stack g2">
                  <h2 className="t-h3">Какой бюджет?</h2>
                  <p className="t-sm muted">Вы платите согласованную стоимость без дополнительной комиссии. Комиссия Taskly 5% удерживается со специалиста.</p>
                </div>
                <Field label="Стоимость проекта" required hint="Специалисты могут предложить свою цену — вы сравните и выберете" error={err.price} id="wz-price">
                  <div className="affix" style={{ maxWidth: 320 }}>
                    <input id="wz-price" className="input input--num" type="number" inputMode="numeric" step="5000" min={MIN_PRICE} value={f.price}
                      onChange={(e) => set('price', Math.max(0, Math.round(Number(e.target.value) || 0)))} data-invalid={!!err.price} />
                    <span className="suffix">₸</span>
                  </div>
                </Field>
                <div className="row g2 wrap">
                  {[45000, 60000, 100000, 180000, 260000].map((v) => (
                    <button type="button" key={v} aria-pressed={f.price === v} className={'chip' + (f.price === v ? ' is-on' : '')} onClick={() => set('price', v)}>{money(v)}</button>
                  ))}
                </div>
                <div className="grid-2" style={{ alignItems: 'start' }}>
                  <div className="card card--soft stack g3">
                    <span className="t-micro muted">Что получит специалист</span>
                    <PayoutRows price={f.price} label="Специалист получит" />
                  </div>
                  <div className="note"><Icon name="info" size={16} />
                    <span className="grow">Вы оплачиваете <strong>{money(f.price)}</strong>. Комиссия не добавляется к вашей сумме — она удерживается из выплаты специалисту.</span>
                  </div>
                </div>
              </>
            )}

            {step === 5 && (
              <>
                <div className="stack g2">
                  <h2 className="t-h3">Дополнительные условия</h2>
                  <p className="t-sm muted">Эти пункты снижают риск недопонимания: сколько правок, какой уровень специалиста подойдёт, как работать.</p>
                </div>
                <Field label="Количество кругов правок" hint="Правки — это исправления по ТЗ. Новая работа оформляется отдельно">
                  <div className="chips">
                    {[1, 2, 3].map((n) => <button type="button" key={n} aria-pressed={f.edits === n} className={'chip' + (f.edits === n ? ' is-on' : '')} onClick={() => set('edits', n)}>{pluralN(n, W.round)}</button>)}
                    <button type="button" aria-pressed={f.edits === 0} className={'chip' + (f.edits === 0 ? ' is-on' : '')} onClick={() => set('edits', 0)}>Без правок</button>
                  </div>
                </Field>
                <Field label="Направления" required error={err.directions} hint="Можно выбрать несколько — Taskly использует это для показа проекта подходящим специалистам">
                  <div className="chips">
                    {directions.map((d) => <button type="button" key={d.id} aria-pressed={f.directions.includes(d.id)} className={'chip' + (f.directions.includes(d.id) ? ' is-on' : '')} onClick={() => toggleIn('directions', d.id)}>{d.name}</button>)}
                  </div>
                </Field>
                <Field label="Навыки" required error={err.skills} hint="По ним специалисты находят проект, а в их откликах появляется метка совпадения">
                  <div className="chips">
                    {skills.map((s) => <button type="button" key={s} aria-pressed={f.skills.includes(s)} className={'chip' + (f.skills.includes(s) ? ' is-on' : '')} onClick={() => toggleIn('skills', s)}>{s}</button>)}
                  </div>
                </Field>
                <Field label="Формат работы">
                  <div className="chips">
                    {workFormats.map((w) => <button type="button" key={w.id} aria-pressed={f.format.includes(w.id)} className={'chip' + (f.format.includes(w.id) ? ' is-on' : '')} onClick={() => toggleIn('format', w.id)}>{w.name}</button>)}
                  </div>
                </Field>
                <Field label="Уровень сложности" hint="Пометка «Можно junior» помогает новым специалистам решиться откликнуться">
                  <div className="stack g3">
                    {levels.map((l) => (
                      <label key={l.id} className="card card--pad-sm" style={{ cursor: 'pointer', padding: 'var(--s4)' }}>
                        <span className="radio"><input type="radio" name="lvl" checked={f.level === l.id} onChange={() => set('level', l.id)} />
                          <span><strong>{l.name}</strong>{l.hint}</span></span>
                      </label>
                    ))}
                  </div>
                </Field>
              </>
            )}
          </div>

          <div className="row between g3 wrap">
            <button type="button" className="btn btn--ghost" style={{ paddingLeft: 0 }} onClick={() => (step > 0 ? setStep(step - 1) : app.navigate('/biz/projects'))}>
              ← {step > 0 ? 'Назад' : 'К проектам'}
            </button>
            <div className="row g3 wrap">
              {step === 5 && <Btn onClick={goPreview}>Предпросмотр ТЗ</Btn>}
              <Btn variant="primary" size="lg" onClick={next}>{step === 5 ? 'Проверить и опубликовать' : 'Продолжить'}<Icon name="arrowR" size={17} /></Btn>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

/* ============================ Предпросмотр ТЗ ============================ */
function TzBody({ p }) {
  return (
    <>
      <div className="stack g3">
        <span className="t-micro muted">Ожидаемый результат</span>
        <p className="t-sm ink2">{p.result}</p>
      </div>
      <div className="grid-2" style={{ gap: 'var(--s5)' }}>
        <div className="stack g3">
          <span className="t-micro muted">Входит в работу</span>
          {p.includes.length ? (
            <ul className="stack g2">
              {p.includes.map((t) => <li className="row g3 t-sm" key={t}><Icon name="check" size={15} style={{ color: 'var(--ok)' }} />{t}</li>)}
            </ul>
          ) : <span className="t-sm muted">Не указано — уточните в переписке со специалистом</span>}
        </div>
        <div className="stack g3">
          <span className="t-micro muted">Не входит в работу</span>
          {p.excludes.length ? (
            <ul className="stack g2">
              {p.excludes.map((t) => <li className="row g3 t-sm" key={t}><Icon name="x" size={15} style={{ color: 'var(--ink-3)' }} />{t}</li>)}
            </ul>
          ) : <span className="t-sm muted">Не указано</span>}
        </div>
      </div>
      <hr className="hr" />
      <div className="grid-2" style={{ gap: 'var(--s5)' }}>
        <div className="stack g3">
          <span className="t-micro muted">Материалы от заказчика</span>
          {p.materials.length ? <div className="tag-row">{p.materials.map((m) => <Tag key={m}>{m}</Tag>)}</div> : <span className="t-sm muted">Не указаны</span>}
        </div>
        <div className="stack g3">
          <span className="t-micro muted">Требования</span>
          <p className="t-sm ink2">{p.requirements || 'Без дополнительных требований'}</p>
        </div>
      </div>
    </>
  );
}

/* Черновик → проект для отображения */
const draftToProject = (d) => ({
  ...d,
  excludes: d.excludes.split(/\n|,/).map((x) => x.trim()).filter(Boolean),
  requirements: d.note.trim(),
  stages: d.stages ? ['Подготовка', 'Основная работа', 'Проверка', 'Финальный результат'] : ['Результат'],
});

function BizTzPreview() {
  const app = useApp();
  const [confirm, setConfirm] = useState(false);
  const [published, setPublished] = useState(null);
  const d = app.draft;
  const errors = d ? validateDraft(d, 5) : {};

  if (!published && (!d || Object.keys(errors).length)) {
    return (
      <AppShell wide crumbs={[{ label: 'Мои проекты', to: '/biz/projects' }, { label: 'Предпросмотр ТЗ' }]} title="Предпросмотр ТЗ">
        <div className="card" style={{ maxWidth: 640 }}>
          <Empty icon="book" title={d ? 'ТЗ заполнено не до конца' : 'Черновика пока нет'}
            text={d ? 'Вернитесь в мастер: ' + Object.values(errors)[0] : 'Опишите задачу в мастере создания проекта — здесь появится собранное ТЗ.'}
            action={<Btn variant="primary" onClick={() => app.navigate('/biz/projects/new')}>{d ? 'Продолжить заполнение' : 'Создать проект'}</Btn>} />
        </div>
      </AppShell>
    );
  }

  const p = published || draftToProject(d);
  const [publishing, setPublishing] = useState(false);
  const publish = async () => {
    const snapshot = draftToProject(d);
    setPublishing(true);
    const id = await app.publishProject();
    setPublishing(false);
    if (id) setPublished({ ...snapshot, id });
  };

  return (
    <AppShell wide crumbs={[{ label: 'Мои проекты', to: '/biz/projects' }, { label: 'Создание проекта', to: '/biz/projects/new' }, { label: 'Предпросмотр ТЗ' }]}
      title="Так будет выглядеть ТЗ" sub="Специалист видит этот документ до отправки отклика и подтверждает его перед началом работы."
      actions={!published && <Btn variant="ghost" onClick={() => app.navigate('/biz/projects/new')} icon="edit">Изменить</Btn>}>
      <div className="shell-ws">
        <div className="stack g5">
          <div className="card card--pad-lg stack g5">
            <div className="row between wrap g3">
              <Tag>Черновик ТЗ</Tag>
              <span className="t-cap muted">Собрано из 6 ответов</span>
            </div>
            <div className="stack g2">
              <h2 className="t-h3">{p.title}</h2>
              <p className="t-sm ink2">{p.brief}</p>
            </div>
            <hr className="hr" />
            <TzBody p={p} />
            <div className="stack g3">
              <span className="t-micro muted">Этапы</span>
              <div className="steps">
                {p.stages.map((s, i) => (
                  <div className="step-item is-todo" key={s}>
                    <div className="step-mark"><div className="step-dot">{i + 1}</div><div className="step-line" /></div>
                    <div className="step-body stack g1" style={{ paddingBottom: 'var(--s4)' }}><span className="step-title">{s}</span></div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="card card--pad-lg stack g4">
            <div className="row g3"><Icon name="swap" size={17} /><h3 className="t-h4">Если объём работы изменится</h3></div>
            <p className="t-sm ink2">После старта проекта вы не сможете просто дописать новые требования. Работает «Предложить изменение задачи»: специалист предложит новую стоимость и срок, изменение вступит в силу только после подтверждения обеими сторонами.</p>
            <div className="note"><Icon name="lock" size={16} /><span className="grow">Это защищает исполнителя от бесконечного расширения задачи, а вас — от непредсказуемой цены.</span></div>
          </div>
        </div>

        <div className="stack g5 panel--sticky">
          <div className="card card--pad-lg stack g5">
            <h3 className="t-h4">Параметры проекта</h3>
            <div className="kv-rows">
              <div className="kv-row"><dt>Направления</dt><dd>{directionsOf(p.directions).join(', ')}</dd></div>
              <div className="kv-row"><dt>Навыки</dt><dd>{p.skills.join(', ')}</dd></div>
              <div className="kv-row"><dt>Срок</dt><dd>{daysLabel(p.days)}{p.dueDate ? ' · до ' + dateLabel(p.dueDate) : ''}</dd></div>
              <div className="kv-row"><dt>Правки</dt><dd>{editsLabel(p.edits)}</dd></div>
              <div className="kv-row"><dt>Уровень сложности</dt><dd>{levelName(p.level)}</dd></div>
              <div className="kv-row"><dt>Формат работы</dt><dd>{formatNames(p.format).join(', ') || 'Удалённо'}</dd></div>
              <div className="kv-row kv-row--total"><dt>Стоимость</dt><dd><Money value={p.price} strong /></dd></div>
            </div>
            <div className="note note--accent"><Icon name="info" size={16} />
              <span className="grow">Стоимость — это то, что вы платите. Комиссия Taskly 5% удерживается со специалиста, для вас доплат нет.</span>
            </div>
          </div>

          <label className="card card--pad-sm check" style={{ padding: 'var(--s4)', cursor: 'pointer' }}>
            <input type="checkbox" checked={confirm} onChange={(e) => setConfirm(e.target.checked)} />
            <span><strong>Условия понятны и соответствуют задаче</strong>Специалист подтвердит эти же условия перед стартом работы.</span>
          </label>

          <Btn variant="primary" size="lg" full disabled={!confirm || !!published || publishing} onClick={publish}>{publishing ? <><span className="spin" /> Публикуем…</> : 'Опубликовать проект'}</Btn>
          {!confirm && <p className="t-cap muted" style={{ textAlign: 'center' }}>Отметьте, что условия понятны, чтобы опубликовать.</p>}
          {confirm && <p className="t-cap muted" style={{ textAlign: 'center' }}>После публикации проект появится в поиске и в подборках специалистов по вашим навыкам.</p>}
        </div>
      </div>

      {published && (
        <Modal title="Проект опубликован" sub="Специалисты увидят его в поиске и в подборке по навыкам."
          onClose={() => app.navigate('/biz/projects/' + published.id)}
          footer={<>
            <Btn onClick={() => app.navigate('/biz/projects')}>К моим проектам</Btn>
            <Btn variant="primary" onClick={() => app.navigate('/biz/projects/' + published.id)}>Открыть проект</Btn>
          </>}>
          <div className="stack g4">
            <div className="note note--ok"><Icon name="check" size={16} /><span className="grow"><strong>Опубликован.</strong> Обычно первые отклики приходят в течение нескольких часов.</span></div>
            <div className="kv-rows">
              <div className="kv-row"><dt>Название</dt><dd>{published.title}</dd></div>
              <div className="kv-row"><dt>Направления</dt><dd>{directionsOf(published.directions).join(', ')}</dd></div>
              <div className="kv-row"><dt>Стоимость</dt><dd><Money value={published.price} /></dd></div>
              <div className="kv-row"><dt>Статус</dt><dd>Идёт поиск исполнителя</dd></div>
            </div>
            <div className="note"><Icon name="info" size={16} /><span className="grow">Оплата пока не списывается. Резервирование произойдёт после того, как вы выберете исполнителя и подтвердите условия.</span></div>
          </div>
        </Modal>
      )}
    </AppShell>
  );
}

/* ============================ Опубликованный проект (взгляд заказчика) ============================ */
function BizProjectPublic({ id }) {
  const app = useApp();
  const soon = useSoon();
  const p = app.entities.projects.find((x) => x.id === id && x.mine);
  if (!p) return <ProjectMissing />;
  if (!isOpen(p)) {
    /* Исполнитель уже выбран — вся работа в рабочем пространстве */
    return (
      <AppShell wide crumbs={[{ label: 'Мои проекты', to: '/biz/projects' }, { label: p.title }]} title={p.title}>
        <div className="card" style={{ maxWidth: 640 }}>
          <Empty icon="layers" title="Проект уже в работе" text="Исполнитель выбран — статус, ТЗ, файлы и переписка находятся в рабочем пространстве."
            action={<Btn variant="primary" onClick={() => app.navigate('/biz/workspace/' + p.id)}>Открыть рабочее пространство</Btn>} />
        </div>
      </AppShell>
    );
  }
  const props = proposalsOf(app.entities, p.id).filter((x) => x.status !== 'withdrawn');
  return (
    <AppShell wide crumbs={[{ label: 'Мои проекты', to: '/biz/projects' }, { label: p.title }]}
      title={p.title} sub={'Опубликован ' + p.posted + ' · проект виден в поиске специалистов'}
      actions={<><Btn icon="edit" onClick={() => soon('Редактирование опубликованного проекта')}>Редактировать</Btn>
        <Btn variant="primary" onClick={() => app.navigate('/biz/projects/' + p.id + '/proposals')}>Отклики ({props.length})</Btn></>}>
      <div className="shell-ws">
        <div className="stack g5">
          <SafeNote compact paid={false} />
          <div className="card card--pad-lg stack g5">
            <div className="row between wrap g3"><StatusPill id={p.status} /><span className="t-cap muted">Опубликован {p.posted}</span></div>
            <p className="t-sm ink2">{p.brief}</p>
            <hr className="hr" />
            <TzBody p={p} />
          </div>
          <div className="card card--pad-lg stack g4">
            <h3 className="t-h4">Этапы работы</h3>
            <Rail stage={-1} total={p.stages.length} />
            <div className="grid-4" style={{ gap: 'var(--s4)' }}>
              {p.stages.map((s, i) => <div className="stack g2" key={s}><span className="t-cap muted">Этап {i + 1}</span><span className="t-sm">{s}</span></div>)}
            </div>
          </div>
        </div>

        <div className="stack g5 panel--sticky">
          <div className="card card--pad-lg stack g4">
            <div className="kv-rows">
              <div className="kv-row"><dt>Стоимость</dt><dd><Money value={p.price} strong /></dd></div>
              <div className="kv-row"><dt>Срок</dt><dd>{daysLabel(p.days)}</dd></div>
              <div className="kv-row"><dt>Правки</dt><dd>{editsLabel(p.edits)} по ТЗ</dd></div>
              <div className="kv-row"><dt>Уровень</dt><dd>{levelName(p.level)}</dd></div>
              <div className="kv-row"><dt>Направления</dt><dd>{directionsOf(p.directions).join(', ')}</dd></div>
            </div>
            <div className="tag-row">{p.skills.map((s) => <Tag key={s}>{s}</Tag>)}</div>
          </div>
          <div className="card card--pad-lg stack g4">
            <h3 className="t-h4">Отклики</h3>
            <Metric value={props.length} label={plural(props.length, ['специалист откликнулся', 'специалиста откликнулись', 'специалистов откликнулись'])} />
            <div className="stack g3">
              {props.slice(0, 3).map((pr) => {
                const s = specialistById(pr.specialistId);
                return (
                  <div className="row g3" key={pr.id}>
                    <Avatar person={s} size="sm" />
                    <span className="stack g1 grow" style={{ minWidth: 0 }}>
                      <span className="t-cap trunc" style={{ fontWeight: 550 }}>{s.name}</span>
                      <span className="t-cap muted">{daysLabel(pr.days)} · {money(pr.price)}</span>
                    </span>
                  </div>
                );
              })}
              {props.length === 0 && <span className="t-sm muted">Пока нет откликов. Обычно первые приходят в течение нескольких часов.</span>}
            </div>
            <Btn variant="primary" full onClick={() => app.navigate('/biz/projects/' + p.id + '/proposals')}>Смотреть отклики</Btn>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function ProjectMissing() {
  const app = useApp();
  return (
    <AppShell wide crumbs={[{ label: 'Мои проекты', to: '/biz/projects' }, { label: 'Проект не найден' }]} title="Проект не найден">
      <div className="card" style={{ maxWidth: 640 }}>
        <Empty icon="search" title="Такого проекта нет среди ваших" text="Возможно, ссылка устарела или проект принадлежит другому аккаунту."
          action={<Btn variant="primary" onClick={() => app.navigate('/biz/projects')}>Мои проекты</Btn>} />
      </div>
    </AppShell>
  );
}

export { BizDashboard, BizProjects, BizNewProject, BizTzPreview, BizProjectPublic, ProjectCard, ProjectRow, BizShell, BIZ_NAV, TzBody, ProjectMissing };
