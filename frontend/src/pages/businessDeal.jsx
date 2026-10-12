/* Taskly — бизнес: отклики, профиль специалиста, выбор исполнителя, резерв оплаты, история, профиль компании, сообщения. */
import React, { useState, useEffect } from 'react';
import { Icon, useApp, Btn, Link, Field, Tag, Badge, Avatar, Modal, Empty, Ph, Money, SafeNote, Metric, Tabs, Stars, Dropdown, commission } from '../components/ui.jsx';
import { AppShell } from '../components/shell.jsx';
import { Inbox } from '../components/chat.jsx';
import { BizShell, ProjectMissing, emptyDraft } from './business.jsx';
import { directions, directionsOf, spheres } from '../data/mock.js';
import { specialistById, proposalsOf, matchSkills, priceOf, daysOf, isOpen } from '../store/store.jsx';
import { parseRoute } from '../lib/router.js';
import { money, plural, pluralN, W, daysLabel, editsLabel, ratingLabel, initials } from '../lib/format.js';

const levelTone = (s) => (s.level === 'new' ? undefined : s.level === 'verified' ? 'info' : 'ok');

/* ============================ Отклики ============================ */
function BizProposals({ id }) {
  const app = useApp();
  const p = app.entities.projects.find((x) => x.id === id && x.mine);
  const [tab, setTab] = useState('all');
  const [sort, setSort] = useState('match');
  const [chosen, setChosen] = useState(null);
  /* «Новые» запоминаем при открытии, а в данных сразу отмечаем прочитанными */
  const [unreadIds] = useState(() => (p ? proposalsOf(app.entities, p.id).filter((x) => !x.read).map((x) => x.id) : []));
  useEffect(() => { if (p) app.markProposalsRead(p.id); }, [id]);

  if (!p) return <ProjectMissing />;
  if (!isOpen(p)) {
    return (
      <AppShell wide crumbs={[{ label: 'Мои проекты', to: '/biz/projects' }, { label: p.title }]} title={'Отклики на «' + p.title + '»'}>
        <div className="card" style={{ maxWidth: 640 }}>
          <Empty icon="check" title="Исполнитель уже выбран" text={'По проекту работает ' + (specialistById(p.specialistId)?.name || 'исполнитель') + '. Остальные отклики закрыты.'}
            action={<Btn variant="primary" onClick={() => app.navigate('/biz/workspace/' + p.id)}>Рабочее пространство</Btn>} />
        </div>
      </AppShell>
    );
  }

  const base = app.emptyMode ? [] : proposalsOf(app.entities, p.id).filter((x) => x.status !== 'withdrawn')
    .map((pr) => { const s = specialistById(pr.specialistId); return { ...pr, s, match: matchSkills(s, p) }; });
  let list = base;
  if (tab === 'new') list = list.filter((x) => unreadIds.includes(x.id));
  if (tab === 'short') list = list.filter((x) => x.match.length >= 3);
  const sorters = { price: (a, b) => a.price - b.price, days: (a, b) => a.days - b.days, match: (a, b) => b.match.length - a.match.length };
  list = [...list].sort(sorters[sort]);
  const sortLabel = { match: 'Сначала совпадение навыков', price: 'Сначала дешевле', days: 'Сначала быстрее' }[sort];

  return (
    <AppShell wide crumbs={[{ label: 'Мои проекты', to: '/biz/projects' }, { label: p.title, to: '/biz/projects/' + p.id }, { label: 'Отклики' }]}
      title={'Отклики на «' + p.title + '»'} sub="Сравните цену, срок, навыки и релевантные работы. Выбор исполнителя ни к чему не обязывает до подтверждения условий."
      actions={<><Btn icon="eye" onClick={() => app.navigate('/biz/projects/' + p.id)}>Проект</Btn>
        <Dropdown label={sortLabel} icon="filter" variant="secondary">
          <button type="button" className="menu-item" onClick={() => setSort('match')}><Icon name="sparkle" size={15} />Сначала совпадение навыков</button>
          <button type="button" className="menu-item" onClick={() => setSort('price')}><Icon name="wallet" size={15} />Сначала дешевле</button>
          <button type="button" className="menu-item" onClick={() => setSort('days')}><Icon name="clock" size={15} />Сначала быстрее</button>
        </Dropdown></>}>
      <div className="stack g5">
        <div className="card card--pad-sm row between wrap g4" style={{ padding: 'var(--s4) var(--s5)' }}>
          <div className="row g5 wrap">
            <div className="kv"><dt>Бюджет проекта</dt><dd><Money value={p.price} strong /></dd></div>
            <div className="kv"><dt>Срок</dt><dd>{daysLabel(p.days)}</dd></div>
            <div className="kv"><dt>Правки</dt><dd>{editsLabel(p.edits)} по ТЗ</dd></div>
          </div>
          <SafeNote compact paid={false} />
        </div>

        <Tabs value={tab} onChange={setTab} items={[
          { id: 'all', label: 'Все отклики', count: base.length },
          { id: 'new', label: 'Новые', count: base.filter((x) => unreadIds.includes(x.id)).length },
          { id: 'short', label: 'Совпадение 3+ навыков', count: base.filter((x) => x.match.length >= 3).length },
        ]} />

        {list.length === 0 ? (
          <div className="card">
            <Empty icon="chat" title={tab === 'all' ? 'Пока нет откликов' : 'В этой вкладке пусто'}
              text={tab === 'all' ? 'Обычно первые отклики приходят в течение нескольких часов после публикации. Можно посмотреть похожие профили специалистов и пригласить их напрямую.' : 'Переключитесь на вкладку «Все отклики».'}
              action={<Btn variant="primary" icon="search" onClick={() => app.navigate('/biz/specialists')}>Найти специалистов</Btn>}
              secondary={tab !== 'all' ? <Btn variant="ghost" onClick={() => setTab('all')}>Все отклики</Btn> : <Btn variant="ghost" onClick={() => app.navigate('/biz/projects/' + p.id)}>Посмотреть проект</Btn>} />
          </div>
        ) : (
          <div className="stack g4">
            {list.map((pr) => <ProposalCard key={pr.id} pr={pr} isNew={unreadIds.includes(pr.id)} onSelect={() => setChosen(pr)} />)}
          </div>
        )}
      </div>

      {chosen && (
        <Modal wide title="Выбрать исполнителя" sub="Следующий шаг — подтверждение условий и резервирование оплаты."
          onClose={() => setChosen(null)}
          footer={<><Btn onClick={() => setChosen(null)}>Отмена</Btn>
            <Btn variant="primary" onClick={() => app.navigate('/biz/projects/' + p.id + '/select?proposal=' + chosen.id)}>Перейти к условиям</Btn></>}>
          <div className="stack g5">
            <div className="row g4">
              <Avatar person={chosen.s} size="lg" />
              <div className="stack g2 grow" style={{ minWidth: 0 }}>
                <div className="row g2 wrap"><strong>{chosen.s.name}</strong><Badge tone={levelTone(chosen.s)} dot>{chosen.s.levelName}</Badge></div>
                <span className="t-cap muted">{chosen.s.headline} · {pluralN(chosen.s.completed, ['завершённый проект', 'завершённых проекта', 'завершённых проектов'])} · {chosen.s.onTime ? chosen.s.onTime + '% в срок' : 'нет истории сроков'}</span>
              </div>
            </div>
            <div className="card card--soft stack g3">
              <div className="kv-rows">
                <div className="kv-row"><dt>Предложенная стоимость</dt><dd><Money value={chosen.price} strong /></dd></div>
                <div className="kv-row"><dt>Предложенный срок</dt><dd>{daysLabel(chosen.days)}</dd></div>
                <div className="kv-row"><dt>Правки по ТЗ</dt><dd>{editsLabel(p.edits)}</dd></div>
              </div>
            </div>
            <div className="note note--warn"><Icon name="alert" size={16} />
              <span className="grow">Исполнитель закрепляется только после подтверждения условий на следующем шаге. До этого проект остаётся открытым.</span>
            </div>
          </div>
        </Modal>
      )}
    </AppShell>
  );
}

function ProposalCard({ pr, isNew, onSelect }) {
  const app = useApp();
  const s = pr.s;
  return (
    <div className="card card--pad-lg stack g5">
      <div className="row between wrap g4" style={{ alignItems: 'flex-start' }}>
        <div className="row g4" style={{ minWidth: 0 }}>
          <Avatar person={s} size="lg" />
          <div className="stack g2" style={{ minWidth: 0 }}>
            <div className="row g2 wrap">
              <Link to={'/biz/specialists/' + s.id} style={{ fontWeight: 600 }}>{s.name}</Link>
              <Badge tone={levelTone(s)} dot>{s.levelName}</Badge>
              {isNew && <Badge tone="accent">Новый</Badge>}
            </div>
            <span className="t-cap muted">{s.headline} · {s.city}</span>
          </div>
        </div>
        <div className="stack g2 proposal-price">
          <span className="num" style={{ fontSize: 21, fontWeight: 600, letterSpacing: '-0.02em' }}>{money(pr.price)}</span>
          <span className="t-cap muted">{daysLabel(pr.days)} · отклик {pr.created}</span>
        </div>
      </div>

      <div className="tag-row">
        {pr.match.length >= 2 && <Tag tone="match">Совпадают {pluralN(pr.match.length, W.skill)}</Tag>}
        {pr.match.map((k) => <Tag key={k}>{k}</Tag>)}
      </div>

      <p className="t-sm ink2">{pr.message}</p>

      <div className="card card--soft card--pad-sm stack g3">
        <span className="t-micro muted">Релевантная работа из портфолио</span>
        <div className="row g3">
          <Ph label="превью работы" variant="shot" style={{ width: 120, height: 76, flex: 'none' }} />
          <div className="stack g1 grow" style={{ justifyContent: 'center', minWidth: 0 }}>
            <span className="t-sm" style={{ fontWeight: 550 }}>{pr.portfolio}</span>
            <Link to={'/biz/specialists/' + s.id} className="t-cap muted">Всё портфолио в профиле →</Link>
          </div>
        </div>
      </div>

      <div className="row between wrap g4">
        <div className="row g5 wrap t-cap muted">
          <span className="row g2"><Icon name="briefcase" size={14} />{pluralN(s.completed, ['проект завершён', 'проекта завершено', 'проектов завершено'])}</span>
          <span className="row g2"><Icon name="clock" size={14} />{s.onTime ? s.onTime + '% выполнено в срок' : 'без истории сроков'}</span>
          <span className="row g2"><Icon name="chat" size={14} />Отвечает {s.responseTime}</span>
        </div>
        <div className="row g3 wrap">
          <Btn size="sm" onClick={() => app.navigate('/biz/specialists/' + s.id)}>Профиль</Btn>
          <Btn size="sm" variant="primary" onClick={onSelect}>Выбрать исполнителем</Btn>
        </div>
      </div>
    </div>
  );
}

/* ============================ Профиль специалиста (взгляд бизнеса) ============================ */
function BizSpecialistProfile({ id }) {
  const app = useApp();
  const s = specialistById(id);
  const [invite, setInvite] = useState(() => parseRoute(app.route).params.get('invite') === '1');
  /* Отзывы с платформы + история до Taskly */
  const allReviews = s ? [
    ...app.entities.reviews.filter((r) => r.to === s.id && r.from === 'client').map((r) => {
      const p = app.entities.projects.find((x) => x.id === r.projectId);
      return { who: p?.client || 'Заказчик', when: r.when, stars: r.stars, text: r.text || 'Без комментария' };
    }),
    ...s.reviewList,
  ] : [];
  if (!s) {
    return (
      <AppShell wide crumbs={[{ label: 'Найти специалиста', to: '/biz/specialists' }, { label: 'Не найден' }]} title="Специалист не найден">
        <div className="card" style={{ maxWidth: 640 }}>
          <Empty icon="user" title="Такого профиля нет" text="Возможно, специалист скрыл профиль или ссылка устарела."
            action={<Btn variant="primary" onClick={() => app.navigate('/biz/specialists')}>Все специалисты</Btn>} />
        </div>
      </AppShell>
    );
  }
  const openInvite = () => {
    if (app.role === 'guest') { app.toast('Войдите как бизнес, чтобы пригласить специалиста'); app.navigate('/signup?role=client'); return; }
    if (app.role !== 'client') { app.toast('Приглашать в проекты может только аккаунт бизнеса'); return; }
    setInvite(true);
  };
  return (
    <AppShell wide crumbs={[{ label: 'Найти специалиста', to: '/biz/specialists' }, { label: s.name }]}
      title={s.name} sub={s.headline}
      actions={<Btn variant="primary" onClick={openInvite}>Предложить проект</Btn>}>
      <div className="shell-ws">
        <div className="stack g5">
          <div className="card card--pad-lg stack g5">
            <div className="row g5 wrap" style={{ alignItems: 'flex-start' }}>
              <Avatar person={s} size="xl" />
              <div className="stack g3 grow" style={{ minWidth: 200 }}>
                <div className="row g2 wrap">
                  <h2 className="t-h3">{s.name}</h2>
                  <Badge tone={levelTone(s)} dot>{s.levelName}</Badge>
                </div>
                <span className="t-cap muted">{s.handle} · {s.city}</span>
                <div className="row g2 wrap">
                  <Badge tone="ok" dot>{s.availability}</Badge>
                  <Badge>Отвечает {s.responseTime}</Badge>
                </div>
              </div>
            </div>
            <p className="t-sm ink2">{s.about}</p>
            <div className="stack g3">
              <span className="t-micro muted">Направления и навыки</span>
              <div className="tag-row">
                {directionsOf(s.directions).map((d) => <Tag key={d} tone="line">{d}</Tag>)}
                {s.skills.map((k) => <Tag key={k}>{k}</Tag>)}
              </div>
            </div>
            <div className="stack g3">
              <span className="t-micro muted">Чем подтверждён уровень</span>
              <div className="row g2 wrap">{s.verifiedVia.map((v) => <Badge key={v} tone="info" dot>{v}</Badge>)}</div>
            </div>
          </div>

          <div className="card card--pad-lg stack g5">
            <div className="row between wrap g3">
              <h3 className="t-h4">Портфолио</h3>
              <span className="t-cap muted">{pluralN(s.portfolio.length, W.work)}</span>
            </div>
            {s.portfolio.length === 0 ? (
              <Empty inline icon="folder" title="Портфолио пока пустое" text="Специалист не добавил работы. Можно уточнить опыт в переписке." />
            ) : (
              <div className="grid-3">
                {s.portfolio.map((w) => (
                  <div className="stack g3" key={w.t}>
                    <Ph label={w.ph} variant="tall" />
                    <div className="stack g1">
                      <span className="t-sm" style={{ fontWeight: 550 }}>{w.t}</span>
                      <span className="t-cap muted">{w.s}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card card--pad-lg stack g5">
            <div className="row between wrap g4">
              <h3 className="t-h4">Отзывы заказчиков</h3>
              {s.reviews > 0 && <span className="row g3"><Stars value={s.rating} /><span className="t-cap muted">{ratingLabel(s.rating)} · {pluralN(s.reviews, W.review)}</span></span>}
            </div>
            {allReviews.length === 0 ? (
              <Empty inline icon="star" title="Отзывов пока нет"
                text="Первый проект на платформе ещё не завершён. Отзыв появится после приёмки работы — мы не показываем отзывы из других источников." />
            ) : (
              <div className="stack g4">
                {allReviews.map((r, i) => (
                  <div className="stack g3 review-item" key={i}>
                    <div className="row between wrap g3">
                      <span className="row g3"><Stars value={r.stars} /><strong className="t-sm">{r.who}</strong></span>
                      <span className="t-cap muted">{r.when}</span>
                    </div>
                    <p className="t-sm ink2">{r.text}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="stack g5 panel--sticky">
          <div className="card card--pad-lg stack g5">
            <h3 className="t-h4">Показатели надёжности</h3>
            <div className="grid-2" style={{ gap: 'var(--s5)' }}>
              <Metric value={s.completed} label={plural(s.completed, ['завершённый проект', 'завершённых проекта', 'завершённых проектов'])} />
              <Metric value={s.onTime != null ? s.onTime + '%' : '—'} label="выполнено в срок" />
              <Metric value={s.successRate != null ? s.successRate + '%' : '—'} label="успешность выполнения" />
              <Metric value={s.reviews} label={plural(s.reviews, ['отзыв на платформе', 'отзыва на платформе', 'отзывов на платформе'])} />
            </div>
            <p className="t-cap muted">Проценты считаются только по проектам на Taskly. Если данных мало, мы показываем прочерк, а не выдуманное число.</p>
          </div>
          <div className="note note--ok"><Icon name="shield" size={16} />
            <span className="grow">Выплата специалисту происходит только после того, как вы примете результат. Оплата резервируется до старта.</span>
          </div>
          <Btn variant="primary" full size="lg" onClick={openInvite}>Предложить проект</Btn>
        </div>
      </div>

      {invite && app.role === 'client' && <InviteModal s={s} onClose={() => setInvite(false)} />}
    </AppShell>
  );
}

function InviteModal({ s, onClose }) {
  const app = useApp();
  const open = app.entities.projects.filter((p) => p.mine && isOpen(p));
  const [pid, setPid] = useState(open[0]?.id || 'new');
  const proj = open.find((p) => p.id === pid);
  const [text, setText] = useState('');
  const msg = text || (proj ? 'Здравствуйте! У нас задача «' + proj.title + '». Видим, что у вас похожие работы в портфолио — будем рады отклику.' : '');
  const [busy, setBusy] = useState(false);
  const send = async () => {
    setBusy(true);
    const ok = await app.inviteSpecialist(pid, s.id, msg);
    setBusy(false);
    if (ok) { onClose(); app.toast('Приглашение отправлено. Ответ придёт в уведомления.'); }
  };
  return (
    <Modal title="Предложить проект" sub={'Специалисту ' + s.name + ' придёт приглашение с вашим проектом.'}
      onClose={onClose}
      footer={<><Btn onClick={onClose}>Отмена</Btn>
        {pid === 'new'
          ? <Btn variant="primary" onClick={() => app.navigate('/biz/projects/new')}>Создать проект</Btn>
          : <Btn variant="primary" disabled={busy} onClick={send}>Отправить приглашение</Btn>}</>}>
      <div className="stack g4">
        <Field label="Проект" hint="Выберите один из опубликованных проектов или создайте новый" id="inv-project">
          <select id="inv-project" className="select" value={pid} onChange={(e) => { setPid(e.target.value); setText(''); }}>
            {open.map((p) => <option key={p.id} value={p.id}>{p.title} · {money(p.price)}</option>)}
            <option value="new">+ Создать новый проект</option>
          </select>
        </Field>
        {pid !== 'new' && (
          <Field label="Сообщение" hint="Коротко: почему выбрали именно этого специалиста" id="inv-msg">
            <textarea id="inv-msg" className="textarea" value={msg} onChange={(e) => setText(e.target.value)} />
          </Field>
        )}
        <div className="note"><Icon name="info" size={16} />
          <span className="grow">Приглашение не закрепляет специалиста. Условия вы подтвердите отдельно, оплата резервируется только после этого.</span>
        </div>
      </div>
    </Modal>
  );
}

/* ============================ Поиск специалистов ============================ */
const responseHours = (s) => { const m = s.responseTime.match(/за\s*(\d+)?\s*час/); return m ? Number(m[1] || 1) : 24; };
const isFreeNow = (s) => /^свобод/i.test(s.availability) && !/\sс\s/.test(s.availability);

function BizSpecialists() {
  const app = useApp();
  const [q, setQ] = useState('');
  const [dir, setDir] = useState('all');
  const [sk, setSk] = useState([]);
  const [exp, setExp] = useState('any');
  const [resp, setResp] = useState('any');
  const [free, setFree] = useState('any');
  const [filters, setFilters] = useState(false);

  const list = app.emptyMode ? [] : app.specialists.filter((s) => s.id !== app.user?.id).filter((s) => {
    const okQ = !q.trim() || (s.name + ' ' + s.headline + ' ' + s.skills.join(' ')).toLowerCase().includes(q.trim().toLowerCase());
    const okD = dir === 'all' || s.directions.includes(dir);
    const okS = sk.length === 0 || sk.some((x) => s.skills.includes(x));
    const okE = exp === 'any' || (exp === 'new' && s.level === 'new') || (exp === 'proven' && s.level !== 'new') || (exp === 'exp' && s.level === 'experienced');
    const okR = resp === 'any' || responseHours(s) <= Number(resp);
    const okF = free === 'any' || isFreeNow(s);
    return okQ && okD && okS && okE && okR && okF;
  });
  const toggleIn = (v) => setSk((a) => (a.includes(v) ? a.filter((x) => x !== v) : [...a, v]));
  const nFilters = [sk.length > 0, exp !== 'any', resp !== 'any', free !== 'any'].filter(Boolean).length;
  const reset = () => { setQ(''); setDir('all'); setSk([]); setExp('any'); setResp('any'); setFree('any'); };

  return (
    <AppShell wide title="Найти специалиста" sub="Поиск по навыкам, направлению и опыту. Специалиста можно пригласить в свой проект."
      actions={app.role !== 'specialist' && <Btn variant="primary" icon="plus" onClick={() => app.navigate('/biz/projects/new')}>Создать проект</Btn>}>
      <div className="stack g5">
        <div className="card card--pad-lg stack g5">
          <div className="row g3 wrap">
            <input className="input input--search grow" style={{ minWidth: 0, flexBasis: 240 }} placeholder="Навык, направление или имя специалиста" aria-label="Поиск специалистов"
              value={q} onChange={(e) => setQ(e.target.value)} />
            <Btn icon="filter" aria-expanded={filters} onClick={() => setFilters((v) => !v)} variant={filters ? 'quiet' : 'secondary'}>Фильтры{nFilters ? ` · ${nFilters}` : ''}</Btn>
          </div>
          <div className="chips chips--scroll">
            <button type="button" className={'chip' + (dir === 'all' ? ' is-on' : '')} aria-pressed={dir === 'all'} onClick={() => setDir('all')}>Все направления</button>
            {directions.map((d) => <button type="button" key={d.id} aria-pressed={dir === d.id} className={'chip' + (dir === d.id ? ' is-on' : '')} onClick={() => setDir(d.id)}>{d.name}</button>)}
          </div>
          {filters && (
            <div className="grid-3" style={{ gap: 'var(--s5)' }}>
              <Field label="Опыт" id="f-exp">
                <select id="f-exp" className="select" value={exp} onChange={(e) => setExp(e.target.value)}>
                  <option value="any">Любой</option>
                  <option value="new">Новые специалисты</option>
                  <option value="proven">С подтверждённым уровнем</option>
                  <option value="exp">Опытные на Taskly</option>
                </select>
              </Field>
              <Field label="Отвечает в течение" id="f-resp">
                <select id="f-resp" className="select" value={resp} onChange={(e) => setResp(e.target.value)}>
                  <option value="any">Не важно</option><option value="2">2 часов</option><option value="4">4 часов</option>
                </select>
              </Field>
              <Field label="Свободен сейчас" id="f-free">
                <select id="f-free" className="select" value={free} onChange={(e) => setFree(e.target.value)}><option value="any">Не важно</option><option value="yes">Да</option></select>
              </Field>
              <div className="stack g3" style={{ gridColumn: '1 / -1' }}>
                <span className="t-micro muted">Навыки</span>
                <div className="chips">
                  {['Figma', 'UI/UX', 'HTML/CSS', 'Python', 'Telegram-бот', 'Excel', 'Data Analysis', 'Research', 'Copywriting', 'SMM', 'Презентации', 'Регламенты', 'No-code'].map((s) => (
                    <button type="button" key={s} aria-pressed={sk.includes(s)} className={'chip' + (sk.includes(s) ? ' is-on' : '')} onClick={() => toggleIn(s)}>{s}</button>
                  ))}
                </div>
              </div>
            </div>
          )}
          <div className="row between wrap g3">
            <span className="t-cap muted">Найдено: {list.length}</span>
            {(q || dir !== 'all' || nFilters > 0) && <Btn variant="ghost" size="sm" onClick={reset}>Сбросить фильтры</Btn>}
          </div>
        </div>

        {list.length === 0 ? (
          <div className="card">
            <Empty icon="search" title="Ничего не найдено"
              text="Попробуйте убрать часть фильтров: возможно, по выбранным навыкам специалисты пока не зарегистрированы. Опубликуйте проект — отклики придут сами."
              action={<Btn variant="primary" icon="plus" onClick={() => app.navigate('/biz/projects/new')}>Опубликовать проект</Btn>}
              secondary={<Btn variant="ghost" onClick={reset}>Сбросить фильтры</Btn>} />
          </div>
        ) : (
          <div className="grid-auto">
            {list.map((s) => <SpecialistCard key={s.id} s={s} />)}
          </div>
        )}
      </div>
    </AppShell>
  );
}

function SpecialistCard({ s }) {
  const app = useApp();
  return (
    <div className="card card--pad-lg stack g4">
      <div className="row g4" style={{ alignItems: 'flex-start' }}>
        <Avatar person={s} size="lg" />
        <div className="stack g2 grow" style={{ minWidth: 0 }}>
          <Link to={'/biz/specialists/' + s.id} style={{ fontWeight: 600 }} className="trunc">{s.name}</Link>
          <span className="t-cap muted trunc">{s.headline}</span>
        </div>
        {s.rating != null && <span className="row g2 nowrap"><Stars value={s.rating} size={12} /><span className="t-cap muted">{ratingLabel(s.rating)}</span></span>}
      </div>
      <div className="tag-row">
        {s.skills.slice(0, 4).map((k) => <Tag key={k}>{k}</Tag>)}
        {s.skills.length > 4 && <Tag tone="line">+{s.skills.length - 4}</Tag>}
      </div>
      <div className="row g5 wrap t-cap muted">
        <span className="row g2"><Icon name="briefcase" size={13} />{pluralN(s.completed, W.project)}</span>
        <span className="row g2"><Icon name="clock" size={13} />{s.onTime != null ? s.onTime + '% в срок' : 'нет истории'}</span>
        <span className="row g2"><Icon name="shield" size={13} />{s.levelName}</span>
      </div>
      <div className="row g3">
        <Btn size="sm" variant="primary" onClick={() => app.navigate('/biz/specialists/' + s.id)}>Профиль</Btn>
        {app.role === 'client' && <Btn size="sm" variant="quiet" onClick={() => app.navigate('/biz/specialists/' + s.id + '?invite=1')}>Пригласить в проект</Btn>}
      </div>
    </div>
  );
}

/* ============================ Выбор исполнителя: подтверждение условий ============================ */
function BizSelectStep({ id, proposalId }) {
  const app = useApp();
  const p = app.entities.projects.find((x) => x.id === id && x.mine);
  const prs = p ? proposalsOf(app.entities, p.id) : [];
  const pr = prs.find((x) => x.id === proposalId) || prs.find((x) => x.status === 'accepted');
  const [checks, setChecks] = useState({ tz: false, price: false, deadline: false, order: false });
  const [payOpen, setPayOpen] = useState(false);

  if (!p) return <ProjectMissing />;
  const s = pr && specialistById(pr.specialistId);
  const alreadyChosen = p.status === 'awaiting_payment';
  if (!pr || (!isOpen(p) && !alreadyChosen && !payOpen)) {
    return (
      <AppShell wide crumbs={[{ label: 'Мои проекты', to: '/biz/projects' }, { label: p.title }]} title="Подтверждение условий">
        <div className="card" style={{ maxWidth: 640 }}>
          <Empty icon="info" title={!pr ? 'Отклик не выбран' : 'Условия уже подтверждены'}
            text={!pr ? 'Выберите исполнителя на странице откликов — после этого здесь появятся условия.' : 'Проект в работе — всё дальнейшее в рабочем пространстве.'}
            action={!pr
              ? <Btn variant="primary" onClick={() => app.navigate('/biz/projects/' + p.id + '/proposals')}>К откликам</Btn>
              : <Btn variant="primary" onClick={() => app.navigate('/biz/workspace/' + p.id)}>Рабочее пространство</Btn>} />
        </div>
      </AppShell>
    );
  }

  const all = alreadyChosen || Object.values(checks).every(Boolean);
  const set = (k, v) => setChecks((c) => ({ ...c, [k]: v }));
  const items = [
    ['tz', 'ТЗ соответствует задаче', 'Ожидаемый результат, состав работы и границы описаны верно'],
    ['price', 'Стоимость — ' + money(pr.price), 'Соответствует отклику исполнителя. Изменение возможно только через «Предложить изменение задачи»'],
    ['deadline', 'Срок — ' + daysLabel(pr.days), editsLabel(p.edits) + ' по ТЗ, без новых требований'],
    ['order', 'Порядок работы понятен', 'Этапы: ' + p.stages.join(' → ').toLowerCase()],
  ];
  const confirm = () => { if (!alreadyChosen) app.selectProposal(pr.id); setPayOpen(true); };

  return (
    <AppShell wide crumbs={[{ label: 'Мои проекты', to: '/biz/projects' }, { label: 'Отклики', to: '/biz/projects/' + p.id + '/proposals' }, { label: 'Подтверждение условий' }]}
      title="Подтверждение условий" sub="Это последний шаг перед началом работы. После подтверждения запускается резервирование оплаты."
      actions={!alreadyChosen && <Btn variant="ghost" onClick={() => app.navigate('/biz/projects/' + p.id + '/proposals')}>Вернуться к откликам</Btn>}>
      <div className="shell-ws">
        <div className="stack g5">
          <div className="card card--pad-lg stack g5">
            <h3 className="t-h4">Условия проекта</h3>
            <div className="grid-2" style={{ gap: 'var(--s5)' }}>
              <div className="stack g4">
                <div className="kv"><dt>Проект</dt><dd>{p.title}</dd></div>
                <div className="kv"><dt>Исполнитель</dt><dd>{s.name} · {s.levelName}</dd></div>
                <div className="kv"><dt>Направления</dt><dd>{directionsOf(p.directions).join(', ')}</dd></div>
                <div className="kv"><dt>Навыки</dt><dd>{p.skills.join(', ')}</dd></div>
              </div>
              <div className="stack g4">
                <div className="kv"><dt>Стоимость</dt><dd><Money value={pr.price} strong /></dd></div>
                <div className="kv"><dt>Срок</dt><dd>{daysLabel(pr.days)}</dd></div>
                <div className="kv"><dt>Правки</dt><dd>{editsLabel(p.edits)} по ТЗ</dd></div>
                <div className="kv"><dt>Оплата</dt><dd>Резервируется сейчас, выплата после приёмки</dd></div>
              </div>
            </div>
          </div>

          <div className="card card--pad-lg stack g5">
            <div className="row between wrap g3">
              <h3 className="t-h4">ТЗ, которое подтверждает исполнитель</h3>
              <Link to={'/biz/projects/' + p.id} className="t-cap muted">Открыть полное ТЗ</Link>
            </div>
            <p className="t-sm ink2">{p.brief}</p>
            <div className="grid-2" style={{ gap: 'var(--s5)' }}>
              <div className="stack g3"><span className="t-micro muted">Входит в работу</span>
                <ul className="stack g2">{p.includes.map((t) => <li className="row g3 t-sm" key={t}><Icon name="check" size={15} style={{ color: 'var(--ok)' }} />{t}</li>)}</ul>
              </div>
              <div className="stack g3"><span className="t-micro muted">Не входит</span>
                <ul className="stack g2">{p.excludes.map((t) => <li className="row g3 t-sm" key={t}><Icon name="x" size={15} style={{ color: 'var(--ink-3)' }} />{t}</li>)}</ul>
              </div>
            </div>
          </div>

          <div className="card card--pad-lg stack g4">
            <div className="row g3"><Icon name="swap" size={17} /><h3 className="t-h4">Что будет, если объём изменится</h3></div>
            <div className="stack g3">
              {[['Предложить изменение задачи', 'Исполнитель или вы можете предложить изменить объём, срок или этапы.'],
                ['Вторая сторона оценивает', 'Если объём растёт, предлагается новая стоимость и срок — с обоснованием.'],
                ['Подтверждение обеих сторон', 'Изменение вступает в силу только после подтверждения и вами, и исполнителем.']].map(([t, s2], i) => (
                <div className="row g4" key={t} style={{ alignItems: 'flex-start' }}>
                  <span className="step-dot">{i + 1}</span>
                  <div className="stack g1"><span className="t-sm" style={{ fontWeight: 550 }}>{t}</span><span className="t-cap muted">{s2}</span></div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="stack g5 panel--sticky">
          <div className="card card--pad-lg stack g5">
            <h3 className="t-h4">{alreadyChosen ? 'Условия подтверждены' : 'Подтвердите условия'}</h3>
            {!alreadyChosen && (
              <div className="stack g4">
                {items.map(([k, t, s2]) => (
                  <label className="check" key={k}>
                    <input type="checkbox" checked={checks[k]} onChange={(e) => set(k, e.target.checked)} />
                    <span><strong>{t}</strong>{s2}</span>
                  </label>
                ))}
              </div>
            )}
            {alreadyChosen && <p className="t-sm ink2">Осталось зарезервировать оплату — после этого исполнитель начнёт работу.</p>}
            <Btn variant="primary" size="lg" full disabled={!all} onClick={confirm}>{alreadyChosen ? 'Зарезервировать оплату' : 'Подтвердить и перейти к оплате'}</Btn>
            {!all && <p className="t-cap muted">Отметьте все пункты, чтобы продолжить.</p>}
          </div>
          <SafeNote compact paid={false} />
        </div>
      </div>

      {payOpen && <PayModal p={{ ...p, specialistId: pr.specialistId, agreedPrice: pr.price, agreedDays: pr.days }} onClose={() => setPayOpen(false)} />}
    </AppShell>
  );
}

function PayModal({ p, onClose }) {
  const app = useApp();
  const [stage, setStage] = useState('form'); // form | processing | done
  const [method, setMethod] = useState('card');
  const [understood, setUnderstood] = useState(true);
  const price = priceOf(p);
  const s = specialistById(p.specialistId);
  const c = commission(price);
  const pay = () => {
    setStage('processing');
    setTimeout(() => { app.reservePayment(p.id); setStage('done'); }, 1200);
  };
  const close = stage === 'processing' ? undefined : onClose;
  return (
    <Modal title={stage === 'done' ? 'Оплата зарезервирована' : 'Резервирование оплаты'}
      sub={stage === 'done' ? undefined : 'Средства спишутся с вашей карты и будут зарезервированы платёжной системой до завершения проекта.'}
      onClose={stage === 'done' ? () => app.navigate('/biz/workspace/' + p.id) : close}
      footer={stage === 'done'
        ? <Btn variant="primary" onClick={() => app.navigate('/biz/workspace/' + p.id)}>Открыть рабочее пространство</Btn>
        : <><Btn onClick={onClose} disabled={stage === 'processing'}>Отмена</Btn>
          <Btn variant="primary" onClick={pay} disabled={stage === 'processing' || !understood}>
            {stage === 'processing' ? <><span className="spin" /> Обрабатываем…</> : 'Зарезервировать ' + money(price)}
          </Btn></>}>
      {stage === 'done' ? (
        <div className="stack g4">
          <div className="note note--ok"><Icon name="shield" size={16} />
            <span className="grow"><strong>Оплата зарезервирована до завершения проекта.</strong> Сумма не уходит исполнителю, пока вы не примете результат.</span>
          </div>
          <div className="kv-rows">
            <div className="kv-row"><dt>Сумма</dt><dd><Money value={price} strong /></dd></div>
            <div className="kv-row"><dt>Комиссия Taskly</dt><dd className="muted">5% · удерживается со специалиста</dd></div>
            <div className="kv-row"><dt>Исполнитель получит</dt><dd><Money value={c.payout} /></dd></div>
            <div className="kv-row"><dt>Статус</dt><dd>Проект в работе</dd></div>
          </div>
          <div className="note"><Icon name="info" size={16} />
            <span className="grow">Если исполнитель не выполнит работу, средства возвращаются на карту. Если возникнет спор, поддержка разберёт ситуацию по ТЗ и файлам проекта.</span>
          </div>
        </div>
      ) : (
        <div className="stack g4">
          <div className="card card--soft stack g3">
            <div className="kv-rows">
              <div className="kv-row"><dt>Проект</dt><dd>{p.title}</dd></div>
              <div className="kv-row"><dt>Исполнитель</dt><dd>{s?.name}</dd></div>
              <div className="kv-row"><dt>Срок</dt><dd>{daysLabel(daysOf(p))}</dd></div>
              <div className="kv-row kv-row--total"><dt>К оплате сейчас</dt><dd><Money value={price} strong /></dd></div>
            </div>
          </div>
          <Field label="Способ оплаты">
            <div className="stack g3">
              {[['card', 'Банковская карта', 'Visa •••• 8842'], ['invoice', 'Счёт на компанию', 'Для юридических лиц, оплата по реквизитам']].map(([mid, t, s2]) => (
                <label key={mid} className="card card--pad-sm" style={{ cursor: 'pointer', padding: 'var(--s4)' }}>
                  <span className="radio"><input type="radio" name="pay" checked={method === mid} onChange={() => setMethod(mid)} />
                    <span><strong>{t}</strong>{s2}</span></span>
                </label>
              ))}
            </div>
          </Field>
          <label className="check"><input type="checkbox" checked={understood} onChange={(e) => setUnderstood(e.target.checked)} />
            <span><strong>Понимаю, как работает резервирование</strong>Оплата резервируется до завершения проекта и передаётся исполнителю после приёмки результата.</span></label>
          <p className="t-cap muted">Демо: реального списания нет.</p>
        </div>
      )}
    </Modal>
  );
}

/* ============================ История проектов ============================ */
function BizHistory() {
  const app = useApp();
  const list = app.emptyMode ? [] : app.entities.projects.filter((p) => p.mine && p.status === 'done');
  const [tab, setTab] = useState('done');
  const repeat = (p) => {
    app.saveDraft({ ...emptyDraft(), title: p.title + ' (повтор)', brief: p.brief, result: p.result, includes: p.includes, excludes: p.excludes.join('\n'),
      materials: p.materials, days: p.days, price: priceOf(p), edits: p.edits, skills: p.skills, directions: p.directions, level: p.level, format: p.format, note: p.requirements || '' });
    app.navigate('/biz/projects/new');
  };
  const shown = tab === 'done' ? list : [];
  return (
    <BizShell title="История проектов" sub="Завершённые сделки, выплаты и отзывы."
      actions={<Btn variant="primary" icon="plus" onClick={() => app.navigate('/biz/projects/new')}>Создать проект</Btn>}>
      <div className="stack g5">
        <Tabs value={tab} onChange={setTab} items={[{ id: 'done', label: 'Завершённые', count: list.length }, { id: 'cancel', label: 'Отменённые', count: 0 }]} />
        {shown.length === 0 ? (
          <div className="card">
            <Empty icon="list" title={tab === 'done' ? 'Завершённых проектов пока нет' : 'Отменённых проектов нет'}
              text="Здесь появятся проекты с итоговым расчётом и отзывами обеих сторон."
              action={<Btn variant="primary" icon="plus" onClick={() => app.navigate('/biz/projects/new')}>Создать проект</Btn>} />
          </div>
        ) : (
          <div className="stack g4">
            {shown.map((p) => {
              const s = specialistById(p.specialistId);
              const c = commission(priceOf(p));
              return (
                <div className="card card--pad-lg stack g4" key={p.id}>
                  <div className="row between wrap g4">
                    <div className="stack g2">
                      <h3 className="t-h4">{p.title}</h3>
                      <span className="t-cap muted">Завершён {p.completedAt || ''} · исполнитель {s?.name}</span>
                    </div>
                    <Badge tone="ok" dot>Завершён</Badge>
                  </div>
                  <div className="grid-4" style={{ gap: 'var(--s5)' }}>
                    <div className="kv"><dt>Стоимость</dt><dd><Money value={c.price} /></dd></div>
                    <div className="kv"><dt>Выплачено исполнителю</dt><dd><Money value={c.payout} /></dd></div>
                    <div className="kv"><dt>Комиссия Taskly 5%</dt><dd><Money value={c.fee} /></dd></div>
                    <div className="kv"><dt>Вы заплатили</dt><dd><Money value={c.price} /></dd></div>
                  </div>
                  <div className="row g3 wrap">
                    <Btn size="sm" onClick={() => app.navigate('/biz/workspace/' + p.id)}>Открыть проект</Btn>
                    {p.reviewByClient
                      ? <Badge tone="ok" dot>Отзыв оставлен</Badge>
                      : <Btn size="sm" variant="primary" icon="star" onClick={() => app.navigate('/biz/workspace/' + p.id + '?s=overview&review=1')}>Оставить отзыв</Btn>}
                    <Btn size="sm" variant="ghost" onClick={() => repeat(p)}>Повторить проект</Btn>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </BizShell>
  );
}

/* ============================ Профиль компании ============================ */
function BizProfile() {
  const app = useApp();
  const [name, setName] = useState(app.bizName);
  const b = app.business || {};
  const [sphere, setSphere] = useState(b.sphere || spheres[0]);
  const [city, setCity] = useState(b.city || '');
  const [site, setSite] = useState(b.site || '');
  const [about, setAbout] = useState(b.about || '');
  const [saved, setSaved] = useState(false);
  const count = app.entities.projects.filter((p) => p.mine).length;
  const save = async () => {
    if (name.trim().length < 2) { app.toast('Название компании не может быть пустым', 'err'); return; }
    const ok = await app.updateBusiness({ company: name.trim(), sphere, city: city.trim(), site: site.trim(), about: about.trim() });
    if (!ok) return;
    setSaved(true); app.toast('Профиль компании сохранён'); setTimeout(() => setSaved(false), 2500);
  };
  return (
    <BizShell title="Профиль компании" sub="Профиль видят специалисты, которые рассматривают ваши проекты. Чем понятнее описание, тем больше подходящих откликов."
      actions={<><Btn variant="ghost" onClick={() => setName(app.bizName)} disabled={name === app.bizName}>Отменить изменения</Btn>
        <Btn variant="primary" onClick={save}>Сохранить</Btn></>}>
      <div className="shell-ws">
        <div className="stack g5">
          {saved && <div className="note note--ok"><Icon name="check" size={16} /><span className="grow">Изменения сохранены.</span></div>}
          <div className="card card--pad-lg stack g6">
            <h3 className="t-h4">Основное</h3>
            <div className="grid-2" style={{ gap: 'var(--s5)' }}>
              <Field label="Название компании" required id="bp-name"><input id="bp-name" className="input" value={name} onChange={(e) => setName(e.target.value)} /></Field>
              <Field label="Сфера деятельности" id="bp-sphere"><select id="bp-sphere" className="select" value={sphere} onChange={(e) => setSphere(e.target.value)}>
                {spheres.map((s) => <option key={s}>{s}</option>)}</select>
              </Field>
              <Field label="Контактное лицо" id="bp-contact"><input id="bp-contact" className="input" defaultValue={app.user?.name} /></Field>
              <Field label="Город" id="bp-city"><input id="bp-city" className="input" value={city} onChange={(e) => setCity(e.target.value)} /></Field>
              <Field label="Сайт или соцсети" hint="Помогает специалисту понять контекст задачи" id="bp-site"><input id="bp-site" className="input" value={site} onChange={(e) => setSite(e.target.value)} /></Field>
              <Field label="Язык общения" id="bp-lang"><select id="bp-lang" className="select" defaultValue="Русский"><option>Русский</option><option>Қазақша</option><option>Оба языка</option></select></Field>
            </div>
            <Field label="О компании" hint="2–3 предложения. Что вы делаете и как обычно работаете со специалистами" id="bp-about">
              <textarea id="bp-about" className="textarea" value={about} onChange={(e) => setAbout(e.target.value)} placeholder="Например: барбершоп на 4 кресла, задачи появляются регулярно — сайт, соцсети, таблицы." />
            </Field>
          </div>

          <div className="card card--pad-lg stack g5">
            <h3 className="t-h4">Публикация профиля</h3>
            <label className="switch"><input type="checkbox" defaultChecked />Показывать название компании в карточке проекта</label>
            <label className="switch"><input type="checkbox" defaultChecked />Показывать статус верификации</label>
            <label className="switch"><input type="checkbox" />Разрешить специалистам писать напрямую по профилю</label>
            <p className="t-cap muted">Профиль нельзя удалить, пока есть активные проекты. Это защита исполнителей от потери контакта по сделке.</p>
          </div>
        </div>

        <div className="stack g5 panel--sticky">
          <div className="card card--pad-lg stack g4">
            <h3 className="t-h4">Как вас видят специалисты</h3>
            <div className="row g4">
              <Avatar person={{ initials: initials(name), avatar: 'avatar--b' }} size="lg" />
              <div className="stack g1 grow" style={{ minWidth: 0 }}>
                <strong className="trunc">{name || 'Без названия'}</strong>
                <span className="t-cap muted">{[sphere, city].filter(Boolean).join(' · ')}</span>
              </div>
            </div>
            <div className="row g2 wrap"><Badge tone="info" dot>Проверенный заказчик</Badge><Badge>{pluralN(count, W.project)} на Taskly</Badge></div>
            <div className="kv-rows">
              <div className="kv-row"><dt>Оплата</dt><dd>Резервируется до старта</dd></div>
              <div className="kv-row"><dt>Отвечает</dt><dd>Обычно в течение дня</dd></div>
            </div>
          </div>
          <div className="note"><Icon name="shield" size={16} /><span className="grow">Материалы и файлы проектов хранятся отдельно от публичного профиля.</span></div>
        </div>
      </div>
    </BizShell>
  );
}

/* ============================ Сообщения (бизнес) ============================ */
function BizMessages() {
  const app = useApp();
  const projects = app.emptyMode ? [] : app.entities.projects.filter((p) => p.mine && p.specialistId);
  return (
    <BizShell title="Сообщения" sub="Переписка привязана к проектам — контекст задачи всегда рядом."
      actions={<Btn variant="ghost" icon="briefcase" onClick={() => app.navigate('/biz/projects')}>Мои проекты</Btn>}>
      <Inbox projects={projects} workspaceBase="/biz/workspace/" />
    </BizShell>
  );
}

export { BizProposals, BizSpecialistProfile, BizSpecialists, BizSelectStep, PayModal, BizHistory, BizProfile, BizMessages, SpecialistCard, ProposalCard };
