import React, { useState } from 'react';
import { Icon, useApp, Btn, Link, Field, Tag, Badge, StatusPill, Avatar, Modal, Empty, Money, PayoutRows, SafeNote, Rail, Metric, Tabs, Stars, Dropdown, useSoon, commission } from '../components/ui.jsx';
import { AppShell } from '../components/shell.jsx';
import { ChatThread, useParties } from '../components/chat.jsx';
import { PayModal } from './businessDeal.jsx';
import { TzBody } from './business.jsx';
import { projectById, changesOf, priceOf, daysOf, isOpen } from '../store/store.jsx';
import { parseRoute } from '../lib/router.js';
import { money, pluralN, W, daysLabel, editsLabel, dateLabel, daysLeftLabel } from '../lib/format.js';

const WS_SECTIONS = [
  { id: 'overview', label: 'Обзор' },
  { id: 'tz', label: 'ТЗ' },
  { id: 'stages', label: 'Этапы' },
  { id: 'files', label: 'Файлы' },
  { id: 'messages', label: 'Сообщения' },
  { id: 'changes', label: 'Изменения' },
  { id: 'support', label: 'Поддержка' },
];
const CHANGEABLE = ['in_work', 'on_review', 'needs_fix'];

function Workspace({ id, section = 'overview' }) {
  const app = useApp();
  const role = app.role === 'specialist' ? 'specialist' : 'client';
  const p = projectById(app.entities, id);
  const hasAccess = p && (role === 'client' ? p.mine : p.specialistId === app.me.id);
  const [modal, setModal] = useState(() => (parseRoute(app.route).params.get('review') === '1' ? 'review' : null));
  const base = role === 'client' ? '/biz/workspace/' : '/spec/workspace/';
  const listUrl = role === 'client' ? '/biz/projects' : '/spec';
  const { other, otherRole } = useParties(p);

  if (!hasAccess) {
    return (
      <AppShell wide crumbs={[{ label: 'Мои проекты', to: listUrl }, { label: 'Проект не найден' }]} title="Проект не найден">
        <div className="card" style={{ maxWidth: 640 }}>
          <Empty icon="lock" title="Нет доступа к этому проекту"
            text="Рабочее пространство видят только заказчик и выбранный исполнитель. Возможно, ссылка устарела."
            action={<Btn variant="primary" onClick={() => app.navigate(listUrl)}>Мои проекты</Btn>} />
        </div>
      </AppShell>
    );
  }
  if (isOpen(p)) {
    return (
      <AppShell wide crumbs={[{ label: 'Мои проекты', to: listUrl }, { label: p.title }]} title={p.title}>
        <div className="card" style={{ maxWidth: 640 }}>
          <Empty icon="user" title="Исполнитель ещё не выбран"
            text="Рабочее пространство откроется, когда вы выберете исполнителя и зарезервируете оплату."
            action={<Btn variant="primary" onClick={() => app.navigate('/biz/projects/' + p.id + '/proposals')}>Смотреть отклики</Btn>}
            secondary={<Btn variant="ghost" onClick={() => app.navigate('/biz/projects/' + p.id)}>Страница проекта</Btn>} />
        </div>
      </AppShell>
    );
  }

  const ctx = { p, role, base, open: setModal };
  const nChanges = changesOf(app.entities, p.id).length;
  const canDeliver = role === 'specialist' && (p.status === 'in_work' || p.status === 'needs_fix');
  const canAccept = role === 'client' && p.status === 'on_review';
  const canPay = role === 'client' && p.status === 'awaiting_payment';
  const canReview = p.status === 'done' && !(role === 'client' ? p.reviewByClient : p.reviewBySpecialist);
  const close = () => setModal(null);

  return (
    <>
      <div className="appbar">
        <div className="app" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s4)', paddingTop: 'var(--s4)', paddingBottom: 'var(--s4)' }}>
          <nav className="crumbs" aria-label="Хлебные крошки">
            <Link to={listUrl}>Мои проекты</Link>
            <span className="sep">/</span><span className="here">{p.title}</span>
          </nav>
          <div className="row between wrap g5" style={{ alignItems: 'flex-start' }}>
            <div className="stack g3" style={{ minWidth: 0 }}>
              <div className="row g3 wrap">
                <h1 className="t-h2">{p.title}</h1>
                <StatusPill id={p.status} />
              </div>
              <div className="row g5 wrap t-cap muted">
                <span className="row g2"><Icon name="calendar" size={14} />{p.dueDate ? 'Дедлайн ' + dateLabel(p.dueDate) : 'Срок ' + daysLabel(daysOf(p)) + ' после оплаты'}</span>
                <span className="row g2"><Icon name="wallet" size={14} />{money(priceOf(p))}</span>
                <span className="row g2"><Icon name="user" size={14} />{otherRole}: {other?.name}</span>
              </div>
            </div>
            <div className="row g3 wrap">
              {canPay && <Btn variant="primary" icon="shield" onClick={() => setModal('pay')}>Зарезервировать оплату</Btn>}
              {canAccept && <Btn variant="primary" onClick={() => setModal('accept')}>Принять работу</Btn>}
              {canAccept && <Btn variant="danger" onClick={() => setModal('fix')}>Запросить правку</Btn>}
              {canDeliver && <Btn variant="primary" onClick={() => setModal('deliver')}>Отправить результат</Btn>}
              {canReview && <Btn variant="primary" icon="star" onClick={() => setModal('review')}>Оставить отзыв</Btn>}
              <Btn icon="chat" onClick={() => app.navigate(base + p.id + '?s=messages')}>Сообщение</Btn>
              <Dropdown variant="ghost" icon="more" ariaLabel="Другие действия">
                {CHANGEABLE.includes(p.status) && <button type="button" className="menu-item" onClick={() => setModal('change')}><Icon name="swap" size={16} />Предложить изменение задачи</button>}
                <button type="button" className="menu-item" onClick={() => setModal('support')}><Icon name="help" size={16} />Обратиться в поддержку</button>
                <div className="menu-sep" />
                <button type="button" className="menu-item" onClick={() => app.toast('Скачивание PDF появится после подключения сервера')}><Icon name="download" size={16} />Скачать ТЗ в PDF</button>
              </Dropdown>
            </div>
          </div>
          <SafeNote amount={priceOf(p)} paid={p.paid} compact />
        </div>
      </div>

      <div className="app" style={{ paddingTop: 'var(--s6)', paddingBottom: 'var(--s20)' }}>
        <main className="stack g6">
          <Tabs value={section} onChange={(v) => app.navigate(base + p.id + (v === 'overview' ? '' : '?s=' + v))}
            items={WS_SECTIONS.map((s) => ({ id: s.id, label: s.label, count: s.id === 'changes' && nChanges ? nChanges : undefined }))} />

          {section === 'overview' && <WsOverview {...ctx} />}
          {section === 'tz' && <WsTz {...ctx} />}
          {section === 'stages' && <WsStages {...ctx} />}
          {section === 'files' && <WsFiles {...ctx} />}
          {section === 'messages' && <WsMessages {...ctx} />}
          {section === 'changes' && <WsChanges {...ctx} />}
          {section === 'support' && <WsSupport {...ctx} />}
          {!WS_SECTIONS.some((s) => s.id === section) && <WsOverview {...ctx} />}
        </main>
      </div>

      {modal === 'pay' && <PayModal p={p} onClose={close} />}
      {modal === 'deliver' && <DeliverModal p={p} onClose={close} />}
      {modal === 'accept' && <AcceptModal p={p} onClose={close} onReview={() => setModal('review')} />}
      {modal === 'fix' && <FixModal p={p} onClose={close} />}
      {modal === 'review' && <ReviewModal p={p} role={role} onClose={close} />}
      {modal === 'change' && <ChangeModal p={p} role={role} onClose={close} />}
      {modal === 'support' && <SupportModal p={p} onClose={close} />}
    </>
  );
}

function statusText(p, role) {
  const stageName = p.stages[Math.min(p.stage, p.stages.length - 1)];
  switch (p.status) {
    case 'awaiting_payment': return role === 'client'
      ? 'Условия подтверждены. Зарезервируйте оплату — после этого исполнитель начнёт работу.'
      : 'Вы подтвердили условия. Заказчик резервирует оплату — начинайте работу после уведомления о резерве.';
    case 'in_work': return role === 'specialist'
      ? 'Вы работаете над этапом «' + stageName + '». Когда этап будет готов, отметьте его выполненным в разделе «Этапы».'
      : 'Исполнитель работает над этапом «' + stageName + '». Если понадобится что-то уточнить, напишите в разделе «Сообщения».';
    case 'needs_fix': return role === 'specialist'
      ? 'Заказчик попросил внести правку. Правки должны соответствовать ТЗ — новая работа оформляется через «Предложить изменение задачи».'
      : 'Вы запросили правку. Исполнитель вносит изменения, срок не меняется, пока это правка по ТЗ.';
    case 'on_review': return role === 'client'
      ? 'Результат отправлен на проверку. Проверьте файлы и примите работу или запросите правку.'
      : 'Результат на проверке у заказчика. Обычно ответ приходит в течение дня; напоминание уйдёт автоматически.';
    case 'done': return 'Проект завершён. Выплата оформлена, обе стороны могут оставить отзыв.';
    default: return '';
  }
}

function WsOverview({ p, role, base, open }) {
  const app = useApp();
  const { other, otherRole } = useParties(p);
  const files = (app.entities.files[p.id] || []).slice(-3).reverse();
  const changes = changesOf(app.entities, p.id);
  const stageIdx = Math.min(p.stage, p.stages.length);
  return (
    <div className="shell-ws">
      <div className="stack g5">
        <div className="card card--pad-lg stack g5">
          <div className="row between wrap g3">
            <h2 className="t-h4">Что происходит сейчас</h2>
            <StatusPill id={p.status} />
          </div>
          <div className="note note--accent" style={{ alignItems: 'flex-start' }}>
            <Icon name="info" size={17} />
            <span className="grow">{statusText(p, role)}</span>
          </div>
          <div className="stack g3">
            <Rail stage={p.status === 'awaiting_payment' ? -1 : p.stage} total={p.stages.length} />
            <div className="row between g3 wrap t-cap muted">
              <span>{p.status === 'done' ? 'Все этапы завершены' : 'Этап ' + (stageIdx + 1) + ' из ' + p.stages.length + ': ' + p.stages[Math.min(stageIdx, p.stages.length - 1)]}</span>
              {p.dueDate && <span>Дедлайн {dateLabel(p.dueDate)} · {p.status === 'done' ? 'сдан' : daysLeftLabel(p.dueDate)}</span>}
            </div>
          </div>
          <div className="row g3 wrap">
            {role === 'client' && p.status === 'awaiting_payment' && <Btn variant="primary" icon="shield" onClick={() => open('pay')}>Зарезервировать оплату</Btn>}
            {role === 'specialist' && (p.status === 'in_work' || p.status === 'needs_fix') &&
              <Btn variant="primary" onClick={() => open('deliver')}>Отправить результат</Btn>}
            {role === 'client' && p.status === 'on_review' &&
              <><Btn variant="primary" onClick={() => open('accept')}>Принять работу</Btn>
                <Btn variant="danger" onClick={() => open('fix')}>Запросить правку</Btn></>}
            {p.status === 'done' && !(role === 'client' ? p.reviewByClient : p.reviewBySpecialist) && <Btn variant="primary" icon="star" onClick={() => open('review')}>Оставить отзыв</Btn>}
            <Btn icon="chat" onClick={() => app.navigate(base + p.id + '?s=messages')}>Написать сообщение</Btn>
            {CHANGEABLE.includes(p.status) && <Btn variant="ghost" onClick={() => open('change')}>Предложить изменение задачи</Btn>}
          </div>
        </div>

        <div className="grid-2" style={{ alignItems: 'start' }}>
          <div className="card card--pad-lg stack g4">
            <div className="row between g3"><h3 className="t-h4">Последние файлы</h3>
              <Link to={base + p.id + '?s=files'} className="t-cap muted">Все файлы</Link></div>
            <div className="stack g3">
              {files.length === 0 && <span className="t-sm muted">Файлов пока нет.</span>}
              {files.map((f) => <FileRow key={f.name} f={f} compact />)}
            </div>
          </div>
          <div className="card card--pad-lg stack g4">
            <h3 className="t-h4">Этапы</h3>
            <StageList p={p} />
          </div>
        </div>

        <div className="card card--pad-lg stack g4">
          <div className="row between g3"><h3 className="t-h4">Изменения условий</h3><Badge>{changes.length}</Badge></div>
          {changes.length === 0 ? (
            <p className="t-sm muted">Изменений не было. Объём работы зафиксирован в ТЗ.</p>
          ) : changes.slice(0, 2).map((c) => (
            <div className="card card--soft stack g3" key={c.id}>
              <div className="row between wrap g3">
                <span className="t-sm" style={{ fontWeight: 550 }}>{c.title}</span>
                <ChangeBadge c={c} />
              </div>
              <p className="t-cap muted">{c.what}</p>
            </div>
          ))}
          {changes.length > 0 && <Link to={base + p.id + '?s=changes'} className="t-cap muted">Все изменения →</Link>}
        </div>
      </div>

      <div className="stack g5 panel--sticky">
        <div className="card card--pad-lg stack g5">
          <h3 className="t-h4">Условия сделки</h3>
          <div className="kv-rows">
            <div className="kv-row"><dt>Стоимость</dt><dd><Money value={priceOf(p)} strong /></dd></div>
            <div className="kv-row"><dt>Срок</dt><dd>{daysLabel(daysOf(p))}</dd></div>
            <div className="kv-row"><dt>Правки</dt><dd>{p.edits ? 'Осталось ' + Math.max(p.edits - p.editsUsed, 0) + ' из ' + p.edits : 'Без правок'}</dd></div>
            <div className="kv-row"><dt>Статус оплаты</dt><dd>{p.paid ? <Badge tone="ok" dot>{p.status === 'done' ? 'Выплачена' : 'Зарезервирована'}</Badge> : <Badge tone="warn" dot>Не зарезервирована</Badge>}</dd></div>
          </div>
          {role === 'specialist' && (
            <>
              <hr className="hr" />
              <PayoutRows price={priceOf(p)} priceLabel="Проект" />
            </>
          )}
        </div>

        <div className="card card--pad-lg stack g4">
          <h3 className="t-h4">{otherRole}</h3>
          <div className="row g3">
            <Avatar person={other} />
            <div className="stack g1 grow" style={{ minWidth: 0 }}>
              <span className="t-sm trunc" style={{ fontWeight: 550 }}>{other?.name}</span>
              <span className="t-cap muted trunc">{role === 'client' ? other?.headline : 'Заказчик на Taskly с ' + (p.clientSince || 2025) + ' года'}</span>
            </div>
          </div>
          {role === 'client' ? (
            <div className="kv-rows">
              <div className="kv-row"><dt>Проектов завершено</dt><dd>{other.completed}</dd></div>
              <div className="kv-row"><dt>В срок</dt><dd>{other.onTime != null ? other.onTime + '%' : '—'}</dd></div>
              <div className="kv-row"><dt>Отвечает</dt><dd>{other.responseTime}</dd></div>
            </div>
          ) : (
            <div className="kv-rows">
              <div className="kv-row"><dt>Верификация</dt><dd>{p.verified ? 'Подтверждён' : 'Не пройдена'}</dd></div>
              <div className="kv-row"><dt>Отвечает</dt><dd>обычно в течение дня</dd></div>
            </div>
          )}
          {role === 'client' && <Link to={'/biz/specialists/' + other.id} className="t-cap muted">Профиль исполнителя →</Link>}
        </div>

        <div className="note"><Icon name="help" size={16} />
          <span className="grow">Если {role === 'client' ? 'исполнитель пропал или результат не соответствует ТЗ' : 'заказчик не отвечает или требует работу вне ТЗ'}, откройте обращение в поддержку — не закрывайте проект молча.</span>
        </div>
        <Btn variant="ghost" onClick={() => open('support')}>Обратиться в поддержку</Btn>
      </div>
    </div>
  );
}

function StageList({ p }) {
  return (
    <div className="steps">
      {p.stages.map((s, i) => {
        const st = p.status === 'awaiting_payment' ? 'is-todo' : i < p.stage ? 'is-done' : i === p.stage ? 'is-now' : 'is-todo';
        return (
          <div className={'step-item ' + st} key={s}>
            <div className="step-mark"><div className="step-dot">{st === 'is-done' ? <Icon name="check" size={13} /> : i + 1}</div><div className="step-line" /></div>
            <div className="step-body stack g1">
              <span className="step-title">{s}</span>
              <span className="step-sub">{st === 'is-done' ? 'Выполнен' : st === 'is-now' ? 'В работе сейчас' : 'Не начат'}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

const ChangeBadge = ({ c }) => (
  c.status === 'approved' ? <Badge tone="ok">Подтверждено</Badge>
    : c.status === 'rejected' ? <Badge tone="stop">Отклонено</Badge>
      : <Badge tone="warn">Ожидает решения</Badge>
);

function WsTz({ p, role, open }) {
  const app = useApp();
  const { other } = useParties(p);
  const clientName = p.mine ? app.bizName : p.client;
  const specName = role === 'client' ? other?.name : app.me.name;
  return (
    <div className="shell-ws">
      <div className="stack g5">
        <div className="card card--pad-lg stack g5">
          <div className="row between wrap g3">
            <div className="stack g1">
              <h3 className="t-h4">Техническое задание</h3>
              <span className="t-cap muted">Зафиксировано и подтверждено обеими сторонами</span>
            </div>
            <Badge tone="ok" dot>Подтверждено</Badge>
          </div>
          <p className="t-sm ink2">{p.brief}</p>
          <hr className="hr" />
          <TzBody p={p} />
        </div>

        <div className="card card--pad-lg stack g4">
          <div className="row g3"><Icon name="lock" size={17} /><h3 className="t-h4">Как меняется ТЗ</h3></div>
          <p className="t-sm ink2">ТЗ нельзя изменить «в переписке». Если объём работы меняется, используется «Предложить изменение задачи»: новая стоимость и срок подтверждаются обеими сторонами.</p>
          <div className="grid-2" style={{ gap: 'var(--s5)' }}>
            <div className="card card--soft card--pad-sm stack g2">
              <span className="t-micro muted">Правка по ТЗ</span>
              <span className="t-sm">Исправить то, что не соответствует ТЗ. Стоимость и срок не меняются.</span>
            </div>
            <div className="card card--soft card--pad-sm stack g2">
              <span className="t-micro muted">Изменение задачи</span>
              <span className="t-sm">Новая работа или расширение объёма. Требует новой оценки и подтверждения.</span>
            </div>
          </div>
          {CHANGEABLE.includes(p.status) && <Btn variant="primary" style={{ alignSelf: 'flex-start' }} onClick={() => open('change')}>Предложить изменение задачи</Btn>}
        </div>
      </div>

      <div className="stack g5 panel--sticky">
        <div className="card card--pad-lg stack g4">
          <h3 className="t-h4">Подтверждение условий</h3>
          <div className="stack g3">
            {[['Заказчик', clientName], ['Исполнитель', specName]].map(([w, n]) => (
              <div className="row g3" key={w}>
                <span className="avatar avatar--sm avatar--c"><Icon name="check" size={14} /></span>
                <span className="stack g1 grow" style={{ minWidth: 0 }}>
                  <span className="t-cap" style={{ fontWeight: 550 }}>{w}: {n}</span>
                  <span className="t-cap muted">Условия подтверждены</span>
                </span>
              </div>
            ))}
          </div>
          <Btn size="sm" icon="download" onClick={() => app.toast('Скачивание PDF появится после подключения сервера')}>Скачать ТЗ в PDF</Btn>
        </div>
        <div className="card card--pad-lg stack g3">
          <span className="t-micro muted">Стоимость и срок</span>
          <div className="kv-rows">
            <div className="kv-row"><dt>Стоимость</dt><dd><Money value={priceOf(p)} /></dd></div>
            <div className="kv-row"><dt>Срок</dt><dd>{daysLabel(daysOf(p))}</dd></div>
            <div className="kv-row"><dt>Правки</dt><dd>{editsLabel(p.edits)}</dd></div>
          </div>
        </div>
      </div>
    </div>
  );
}

const stageHint = (i, n) => (i === 0 ? 'согласование и материалы' : i === n - 1 ? 'финальные файлы и передача' : i === n - 2 ? 'проверка заказчиком' : 'основная работа по ТЗ');

function WsStages({ p, role }) {
  const app = useApp();
  const n = p.stages.length;
  const manualLimit = Math.max(n - 2, 0);
  return (
    <div className="shell-ws">
      <div className="stack g5">
        <div className="card card--pad-lg stack g5">
          <div className="row between wrap g3">
            <div className="stack g1">
              <h3 className="t-h4">Этапы работы</h3>
              <span className="t-cap muted">Простые шаги без сложного управления задачами</span>
            </div>
            {p.paid ? <Badge tone="ok" dot>Оплата зарезервирована</Badge> : <Badge tone="warn" dot>Ждёт оплаты</Badge>}
          </div>
          <div className="stack g4">
            {p.stages.map((s, i) => {
              const waiting = p.status === 'awaiting_payment';
              const isDone = !waiting && i < p.stage;
              const isNow = !waiting && i === p.stage && p.status !== 'done';
              return (
                <div className="card card--pad-sm stack g3" key={s} style={{ opacity: !isDone && !isNow ? 0.72 : 1 }}>
                  <div className="row between wrap g4">
                    <div className="row g3">
                      <span className="step-dot" style={{
                        background: isDone ? 'var(--ok)' : isNow ? 'var(--accent)' : 'var(--surface)',
                        borderColor: isDone ? 'var(--ok)' : isNow ? 'var(--accent)' : 'var(--line-strong)',
                        color: isDone || isNow ? '#fff' : 'var(--ink-3)',
                      }}>{isDone ? <Icon name="check" size={13} /> : i + 1}</span>
                      <div className="stack g1">
                        <span className="t-sm" style={{ fontWeight: 600 }}>{s}</span>
                        <span className="t-cap muted">{isDone ? 'Выполнен' : isNow ? 'В работе' : 'Не начат'} · {stageHint(i, n)}</span>
                      </div>
                    </div>
                    <div className="row g3">
                      {isNow && role === 'specialist' && p.status === 'in_work' && i < manualLimit && (
                        <Btn size="sm" onClick={() => { app.completeStage(p.id); app.toast('Этап «' + s + '» отмечен выполненным'); }}>Отметить выполненным</Btn>
                      )}
                      {isNow && role === 'client' && p.status === 'in_work' && <Badge tone="warn">Ждём исполнителя</Badge>}
                      {isDone && <Badge tone="ok">Готово</Badge>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="note"><Icon name="info" size={16} />
            <span className="grow">Этапы не заменяют ТЗ: они показывают, где сейчас проект. Этап проверки завершается сдачей результата, финальный — приёмкой.</span>
          </div>
        </div>
      </div>
      <div className="stack g5 panel--sticky">
        <div className="card card--pad-lg stack g4">
          <h3 className="t-h4">Прогресс</h3>
          <Rail stage={p.status === 'awaiting_payment' ? -1 : p.stage} total={n} />
          <Metric value={Math.min(p.stage, n) + ' / ' + n} label="этапов завершено" />
          <div className="kv-rows">
            <div className="kv-row"><dt>Дедлайн</dt><dd>{p.dueDate ? dateLabel(p.dueDate) : 'после оплаты'}</dd></div>
            <div className="kv-row"><dt>Осталось</dt><dd>{p.status === 'done' ? 'Проект сдан' : p.dueDate ? daysLeftLabel(p.dueDate) : daysLabel(daysOf(p))}</dd></div>
          </div>
        </div>
        <div className="note note--ok"><Icon name="shield" size={16} /><span className="grow">Средства остаются зарезервированными на всех этапах и передаются исполнителю после приёмки.</span></div>
      </div>
    </div>
  );
}

const FILE_GROUPS = { pdf: 'Документы', doc: 'Документы', txt: 'Документы', xls: 'Таблицы', fig: 'Исходники', zip: 'Архивы', png: 'Изображения' };

function FileRow({ f, compact, waitCheck }) {
  const app = useApp();
  const who = f.who === 'sealed' ? 'ТЗ' : f.who === 'specialist' ? 'Исполнитель' : 'Заказчик';
  return (
    <div className={compact ? 'file-item' : 'row-item'} style={compact ? undefined : { cursor: 'default' }}>
      <span className="file-ic"><Icon name={f.kind === 'pdf' ? 'book' : 'folder'} size={15} /></span>
      <span className="stack g1 grow" style={{ minWidth: 0 }}>
        <span className="t-sm trunc">{f.name}</span>
        <span className="t-cap muted">{f.size} · {f.when}{compact ? ' · ' + who : ''}</span>
      </span>
      {!compact && <Badge tone={f.who === 'sealed' ? 'info' : f.who === 'specialist' ? 'accent' : undefined}>{who}</Badge>}
      {waitCheck && <Badge tone="warn">Ждёт проверки</Badge>}
      <button type="button" className="btn btn--icon btn--sm" aria-label={'Скачать ' + f.name} onClick={() => app.toast('Скачивание файлов появится после подключения сервера')}><Icon name="download" size={15} /></button>
    </div>
  );
}

function WsFiles({ p, role }) {
  const app = useApp();
  const soon = useSoon();
  const files = app.entities.files[p.id] || [];
  const [drag, setDrag] = useState(false);
  const groups = files.reduce((a, f) => { const g = FILE_GROUPS[f.kind] || 'Другое'; a[g] = (a[g] || 0) + 1; return a; }, {});
  return (
    <div className="shell-ws">
      <div className="stack g5">
        <div className="drop stack g3 center" style={drag ? { borderColor: 'var(--accent)', background: 'var(--accent-soft)' } : undefined}
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)}
          onDrop={(e) => { e.preventDefault(); setDrag(false); soon('Загрузка файлов'); }}>
          <Icon name="upload" size={20} />
          <div className="stack g1">
            <strong className="t-sm" style={{ color: 'var(--ink)' }}>Перетащите файлы сюда</strong>
            <span>PDF, PNG, JPG, DOCX, ZIP, FIG · до 25 МБ на файл</span>
          </div>
          <Btn variant="secondary" size="sm" onClick={() => soon('Загрузка файлов')}>Выбрать файлы</Btn>
        </div>

        <div className="card card--flush stack">
          <div className="row between g4" style={{ padding: 'var(--s4) var(--s5)', borderBottom: '1px solid var(--line)' }}>
            <h3 className="t-h4">Все файлы проекта</h3>
            <span className="t-cap muted">{pluralN(files.length, W.file)}</span>
          </div>
          <div className="rows">
            {files.length === 0 && <p className="t-sm muted" style={{ padding: 'var(--s5)' }}>Файлов пока нет.</p>}
            {files.map((f) => <FileRow key={f.name} f={f} waitCheck={f.final && role === 'client' && p.status === 'on_review'} />)}
          </div>
        </div>

        <div className="note"><Icon name="info" size={16} />
          <span className="grow">Файлы остаются в проекте и после завершения: к ним можно вернуться из истории проектов.</span>
        </div>
      </div>
      <div className="stack g5 panel--sticky">
        <div className="card card--pad-lg stack g4">
          <h3 className="t-h4">Файлы по типу</h3>
          <div className="kv-rows">
            {Object.entries(groups).map(([g, n]) => <div className="kv-row" key={g}><dt>{g}</dt><dd>{n}</dd></div>)}
            <div className="kv-row"><dt>Итоговые материалы</dt><dd>{files.filter((f) => f.final).length}</dd></div>
          </div>
        </div>
        <div className="note note--ok"><Icon name="shield" size={16} /><span className="grow">Итоговые файлы фиксируются при сдаче работы — именно их принимает заказчик.</span></div>
      </div>
    </div>
  );
}

function WsMessages({ p, base, open }) {
  const app = useApp();
  const { other, otherRole } = useParties(p);
  return (
    <div className="shell-ws">
      <div className="card card--flush stack" style={{ minHeight: 520 }}>
        <div className="row between wrap g4" style={{ padding: 'var(--s4) var(--s5)', borderBottom: '1px solid var(--line)' }}>
          <div className="row g3">
            <Avatar person={other} size="sm" />
            <div className="stack g1">
              <span className="t-sm" style={{ fontWeight: 550 }}>{other?.name}</span>
              <span className="t-cap muted">{otherRole} · {p.title}</span>
            </div>
          </div>
          {p.paid ? <Badge tone="ok" dot>Оплата зарезервирована</Badge> : <Badge tone="warn" dot>Ждёт оплаты</Badge>}
        </div>
        <ChatThread projectId={p.id} maxHeight={460} />
      </div>
      <div className="stack g5 panel--sticky">
        <div className="card card--pad-lg stack g4">
          <h3 className="t-h4">Быстрые действия</h3>
          <button type="button" className="menu-item" onClick={() => app.navigate(base + p.id + '?s=files')}><Icon name="folder" size={16} />Открыть файлы проекта</button>
          <button type="button" className="menu-item" onClick={() => app.navigate(base + p.id + '?s=tz')}><Icon name="book" size={16} />Открыть ТЗ</button>
          {CHANGEABLE.includes(p.status) && <button type="button" className="menu-item" onClick={() => open('change')}><Icon name="swap" size={16} />Предложить изменение задачи</button>}
          <button type="button" className="menu-item" onClick={() => open('support')}><Icon name="help" size={16} />Обратиться в поддержку</button>
        </div>
        <div className="note"><Icon name="info" size={16} />
          <span className="grow">Если вторая сторона не отвечает больше двух дней, напишите нам — мы напомним ей и разберёмся в ситуации.</span>
        </div>
      </div>
    </div>
  );
}

function WsChanges({ p, role, open }) {
  const app = useApp();
  const list = changesOf(app.entities, p.id);
  const canPropose = CHANGEABLE.includes(p.status);
  return (
    <div className="shell-ws">
      <div className="stack g5">
        {list.length === 0 ? (
          <div className="card">
            <Empty icon="swap" title="Изменений по проекту не было"
              text="Если по ходу работы выяснится, что объём нужно менять — предложите изменение. Новая стоимость и срок подтверждаются обеими сторонами."
              action={canPropose && <Btn variant="primary" onClick={() => open('change')}>Предложить изменение</Btn>} />
          </div>
        ) : list.map((c) => {
          const mineProposal = c.proposedBy === role;
          return (
            <div className="card card--pad-lg stack g5" key={c.id}>
              <div className="row between wrap g3">
                <div className="stack g2">
                  <div className="row g3 wrap">
                    <h3 className="t-h4">{c.title}</h3>
                    <ChangeBadge c={c} />
                  </div>
                  <span className="t-cap muted">Предложил: {c.proposedBy === 'client' ? 'заказчик' : 'исполнитель'}{mineProposal ? ' (вы)' : ''} · {c.when}</span>
                </div>
                <span className="tag tag--line">{c.status === 'approved' ? 'Условия обновлены' : 'Проект не изменён'}</span>
              </div>

              <div className="stack g2">
                <span className="t-micro muted">Что предлагается сделать</span>
                <p className="t-sm ink2">{c.what}</p>
                {c.note && <p className="t-cap muted">{c.note}</p>}
              </div>

              <div className="card card--soft card--pad-sm stack g4">
                <span className="t-micro muted">Как изменятся условия</span>
                <div className="stack g3">
                  <div className="row between g4 wrap">
                    <span className="t-sm" style={{ color: 'var(--ink-3)' }}>Стоимость</span>
                    <span className="row g3">
                      <span className="t-sm muted num" style={{ textDecoration: c.priceTo !== c.priceFrom ? 'line-through' : 'none' }}>{money(c.priceFrom)}</span>
                      <Icon name="arrowR" size={15} />
                      <strong className="num t-sm">{money(c.priceTo)}</strong>
                    </span>
                  </div>
                  <div className="row between g4 wrap">
                    <span className="t-sm" style={{ color: 'var(--ink-3)' }}>Срок</span>
                    <span className="row g3">
                      <span className="t-sm muted" style={{ textDecoration: c.daysTo !== c.daysFrom ? 'line-through' : 'none' }}>{daysLabel(c.daysFrom)}</span>
                      <Icon name="arrowR" size={15} />
                      <strong className="t-sm">{daysLabel(c.daysTo)}</strong>
                    </span>
                  </div>
                </div>
              </div>

              {c.status === 'pending' && !mineProposal && (
                <div className="row g3 wrap">
                  <Btn variant="primary" onClick={() => { app.decideChange(c.id, true); app.toast('Изменение подтверждено. Условия сделки обновлены.'); }}>Подтвердить изменение</Btn>
                  <Btn variant="danger" onClick={() => { app.decideChange(c.id, false); app.toast('Изменение отклонено. Объём остаётся прежним.'); }}>Отклонить</Btn>
                  <Btn variant="ghost" icon="chat" onClick={() => app.navigate((role === 'client' ? '/biz/workspace/' : '/spec/workspace/') + p.id + '?s=messages')}>Обсудить в переписке</Btn>
                </div>
              )}
              {c.status === 'pending' && mineProposal && (
                <div className="note"><Icon name="clock" size={16} /><span className="grow">Ждём решения второй стороны. Пока изменение не подтверждено, действуют прежние условия.</span></div>
              )}
              {c.status === 'approved' && (
                <div className="note note--ok"><Icon name="check" size={16} />
                  <span className="grow"><strong>Изменение вступило в силу.</strong> Новая стоимость и срок отражены в условиях сделки.</span></div>
              )}
              {c.status === 'rejected' && (
                <div className="note"><Icon name="x" size={16} /><span className="grow">Изменение отклонено — объём, стоимость и срок остались прежними.</span></div>
              )}
            </div>
          );
        })}

        <div className="card card--pad-lg stack g4">
          <h3 className="t-h4">Как это работает</h3>
          <div className="grid-3" style={{ gap: 'var(--s5)' }}>
            {[['Предложение', 'Одна из сторон описывает изменение и, если нужно, новую стоимость и срок.'],
              ['Оценка', 'Вторая сторона видит обоснование и решает: подтвердить или отклонить.'],
              ['Вступление в силу', 'Только после подтверждения обеими сторонами ТЗ и условия сделки обновляются.']].map(([t, s], i) => (
              <div className="stack g2" key={t}>
                <span className="step-dot">{i + 1}</span>
                <span className="t-sm" style={{ fontWeight: 600 }}>{t}</span>
                <span className="t-cap muted">{s}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="stack g5 panel--sticky">
        <div className="card card--pad-lg stack g4">
          <h3 className="t-h4">Текущие условия</h3>
          <div className="kv-rows">
            <div className="kv-row"><dt>Стоимость</dt><dd><Money value={priceOf(p)} /></dd></div>
            <div className="kv-row"><dt>Срок</dt><dd>{daysLabel(daysOf(p))}</dd></div>
            <div className="kv-row"><dt>Правки</dt><dd>{editsLabel(p.edits)}</dd></div>
          </div>
          {canPropose && <Btn size="sm" variant="primary" onClick={() => open('change')}>Предложить изменение</Btn>}
        </div>
        <div className="note"><Icon name="lock" size={16} />
          <span className="grow">Это защищает исполнителя от бесконечного расширения задачи, а заказчика — от неожиданной цены.</span>
        </div>
      </div>
    </div>
  );
}

function WsSupport({ role, open }) {
  return (
    <div className="shell-ws">
      <div className="stack g5">
        <div className="card card--pad-lg stack g5">
          <div className="stack g2">
            <h3 className="t-h4">Поддержка по проекту</h3>
            <p className="t-sm muted">Обращение привязано к проекту: поддержка видит ТЗ, файлы, этапы и переписку — объяснять заново не нужно.</p>
          </div>
          <div className="grid-2" style={{ gap: 'var(--s5)' }}>
            {(role === 'client' ? [
              ['Исполнитель не отвечает', 'Более двух дней нет ответа на сообщения или этап не двигается.'],
              ['Результат не соответствует ТЗ', 'Работа сдана, но не совпадает с тем, что описано в ТЗ.'],
              ['Спор по правкам', 'Стороны расходятся в том, что считается правкой, а что — новой работой.'],
            ] : [
              ['Заказчик не отвечает', 'Проект на проверке, но ответа нет более двух дней.'],
              ['Требуют работу вне ТЗ', 'Появились новые требования, которые не входят в описанный объём.'],
              ['Вопрос по оплате', 'Нужно уточнить, когда придёт выплата после приёмки.'],
            ]).map(([t, s]) => (
              <button type="button" className="card card--pad-sm stack g2 card--link" key={t} style={{ textAlign: 'left' }} onClick={() => open('support')}>
                <span className="t-sm" style={{ fontWeight: 600 }}>{t}</span>
                <span className="t-cap muted">{s}</span>
              </button>
            ))}
          </div>
          <Btn variant="primary" style={{ alignSelf: 'flex-start' }} onClick={() => open('support')}>Создать обращение</Btn>
        </div>

        <div className="note"><Icon name="shield" size={16} />
          <span className="grow">Пока идёт разбор спорной ситуации, зарезервированная оплата остаётся на стороне сделки — она не уходит ни одной из сторон.</span>
        </div>
      </div>
      <div className="stack g5 panel--sticky">
        <div className="card card--pad-lg stack g4">
          <h3 className="t-h4">Как мы помогаем</h3>
          <div className="stack g3">
            {['Разбираем ситуацию по ТЗ и файлам проекта', 'Напоминаем второй стороне о необходимости ответить', 'Помогаем заменить исполнителя или вернуть средства', 'Фиксируем итог в истории проекта'].map((t) => (
              <div className="row g3" key={t}><Icon name="check" size={16} style={{ color: 'var(--ok)' }} /><span className="t-sm ink2 grow">{t}</span></div>
            ))}
          </div>
          <p className="t-cap muted">Обычно отвечаем в течение рабочего дня.</p>
        </div>
      </div>
    </div>
  );
}

function DeliverModal({ p, onClose }) {
  const app = useApp();
  const [stage, setStage] = useState('form');
  const [result, setResult] = useState('');
  const [comment, setComment] = useState('');
  const [err, setErr] = useState('');
  const c = commission(priceOf(p));
  const fileName = 'Итог-' + p.id + '.pdf';
  const submit = () => {
    if (result.trim().length < 10) { setErr('Опишите, что именно вы передаёте: ссылка, файл, доступ.'); return; }
    setErr(''); setStage('sending');
    setTimeout(() => {
      app.deliver(p.id, { comment: result.trim() + (comment.trim() ? ' ' + comment.trim() : ''), files: [{ name: fileName, size: '420 КБ', kind: 'pdf' }] });
      setStage('done');
    }, 900);
  };
  return (
    <Modal wide title={stage === 'done' ? 'Результат отправлен на проверку' : 'Отправить результат'}
      sub={stage === 'done' ? undefined : 'Заказчик увидит результат, комментарий и файлы. Оплата уйдёт вам только после приёмки.'}
      onClose={stage === 'sending' ? undefined : onClose}
      footer={stage === 'done'
        ? <Btn variant="primary" onClick={onClose}>Понятно</Btn>
        : <><Btn onClick={onClose} disabled={stage === 'sending'}>Отмена</Btn>
          <Btn variant="primary" onClick={submit} disabled={stage === 'sending'}>
            {stage === 'sending' ? <><span className="spin" /> Отправляем…</> : 'Отправить на проверку'}</Btn></>}>
      {stage === 'done' ? (
        <div className="stack g4">
          <div className="note note--ok"><Icon name="check" size={16} />
            <span className="grow"><strong>Отправлено.</strong> Заказчик получил уведомление. Если правок не будет, оплата придёт после приёмки.</span></div>
          <div className="kv-rows">
            <div className="kv-row"><dt>Проект</dt><dd>{p.title}</dd></div>
            <div className="kv-row"><dt>Файлы</dt><dd>{fileName}</dd></div>
            <div className="kv-row"><dt>Ожидаемая выплата</dt><dd><Money value={c.payout} strong /></dd></div>
          </div>
          <div className="note"><Icon name="clock" size={16} />
            <span className="grow">По ТЗ у заказчика {editsLabel(p.edits - p.editsUsed).toLowerCase()}. Срок ответа на проверку — 3 дня, после этого напомним автоматически.</span></div>
        </div>
      ) : (
        <div className="stack g5">
          <Field label="Результат работы" required error={err} hint="Что именно вы передаёте: ссылка, файл, доступ" id="dl-result">
            <textarea id="dl-result" className="textarea" placeholder="Например: ссылка на опубликованную страницу, исходники Figma в файлах ниже"
              value={result} onChange={(e) => setResult(e.target.value)} data-invalid={!!err} />
          </Field>
          <div className="stack g2">
            <span className="label">Итоговые файлы</span>
            <div className="file-item"><span className="file-ic"><Icon name="folder" size={15} /></span>
              <span className="stack g1 grow" style={{ minWidth: 0 }}><span className="t-sm trunc">{fileName}</span><span className="t-cap muted">420 КБ · демо-файл</span></span>
            </div>
            <span className="t-cap muted">Загрузка своих файлов появится после подключения сервера.</span>
          </div>
          <Field label="Комментарий к результату" hint="Коротко: что сделано и на что обратить внимание при проверке" id="dl-comment">
            <textarea id="dl-comment" className="textarea" style={{ minHeight: 88 }} value={comment} onChange={(e) => setComment(e.target.value)} />
          </Field>
          <div className="note"><Icon name="shield" size={16} />
            <span className="grow">Выплата {money(c.payout)} (стоимость {money(c.price)} минус комиссия 5%) поступит после подтверждения результата заказчиком.</span></div>
        </div>
      )}
    </Modal>
  );
}

function AcceptModal({ p, onClose, onReview }) {
  const app = useApp();
  const { other } = useParties(p);
  const [stage, setStage] = useState('form');
  const checks = ['Результат соответствует ТЗ: ' + p.result, 'Итоговые файлы доступны и открываются', 'Количество правок не превышено'];
  const [ok, setOk] = useState(checks.map(() => false));
  const c = commission(priceOf(p));
  const finals = (app.entities.files[p.id] || []).filter((f) => f.final);
  const accept = () => { app.acceptWork(p.id); setStage('done'); app.toast('Результат принят. Проект завершён.'); };
  return (
    <Modal wide title={stage === 'done' ? 'Проект завершён' : 'Принять работу'}
      sub={stage === 'done' ? 'Выплата оформлена, отзыв можно оставить сейчас или позже.' : 'После приёмки проект завершается, а оплата передаётся исполнителю за вычетом комиссии 5%.'}
      onClose={onClose}
      footer={stage === 'done'
        ? <><Btn onClick={onClose}>Позже</Btn><Btn variant="primary" icon="star" onClick={onReview}>Оставить отзыв</Btn></>
        : <><Btn onClick={onClose}>Отмена</Btn>
          <Btn variant="primary" disabled={!ok.every(Boolean)} onClick={accept}>Принять работу</Btn></>}>
      {stage === 'done' ? (
        <div className="stack g4">
          <div className="note note--ok"><Icon name="check" size={16} />
            <span className="grow"><strong>Проект завершён.</strong> Оплата передана исполнителю, средства списаны из резерва.</span></div>
          <PayoutRows price={c.price} label="Выплачено исполнителю" />
          <p className="t-sm ink2">Оставьте отзыв исполнителю — он появится в профиле {other?.name} и поможет другим заказчикам.</p>
        </div>
      ) : (
        <div className="stack g5">
          <div className="stack g3">
            <span className="t-micro muted">Проверьте перед приёмкой</span>
            {checks.map((t, i) => (
              <label className="check" key={t}><input type="checkbox" checked={ok[i]} onChange={(e) => setOk(ok.map((v, j) => (j === i ? e.target.checked : v)))} /><span>{t}</span></label>
            ))}
          </div>
          <div className="card card--soft stack g3">
            <span className="t-micro muted">Файлы, которые вы принимаете</span>
            {finals.length === 0 && <span className="t-sm muted">Исполнитель не приложил файлы — уточните в переписке.</span>}
            {finals.map((f) => <FileRow key={f.name} f={f} compact />)}
          </div>
          <div className="kv-rows">
            <div className="kv-row"><dt>К списанию из резерва</dt><dd><Money value={c.price} strong /></dd></div>
            <div className="kv-row"><dt>Исполнитель получит</dt><dd><Money value={c.payout} /></dd></div>
          </div>
          <div className="note note--warn"><Icon name="alert" size={16} />
            <span className="grow">Принять работу можно только один раз. Если что-то не соответствует ТЗ — используйте «Запросить правку».</span></div>
        </div>
      )}
    </Modal>
  );
}

function FixModal({ p, onClose }) {
  const app = useApp();
  const [stage, setStage] = useState('form');
  const [type, setType] = useState('td');
  const [text, setText] = useState('');
  const [err, setErr] = useState('');
  const left = p.edits - p.editsUsed;
  const types = { td: 'Не соответствует ТЗ', detail: 'Недостающая деталь', error: 'Ошибка или опечатка' };
  const send = () => {
    if (text.trim().length < 10) { setErr('Опишите, что именно поправить — так правку закроют быстрее.'); return; }
    app.requestFix(p.id, types[type] + ': ' + text.trim());
    setStage('done');
    app.toast('Запрос правки отправлен исполнителю');
  };
  if (left <= 0 && stage === 'form') {
    return (
      <Modal title="Круги правок закончились" onClose={onClose}
        footer={<Btn variant="primary" onClick={onClose}>Понятно</Btn>}>
        <div className="note note--warn"><Icon name="alert" size={16} />
          <span className="grow">По ТЗ было {editsLabel(p.edits).toLowerCase()}, все использованы. Новые доработки оформляются через «Предложить изменение задачи» — с согласованием стоимости.</span></div>
      </Modal>
    );
  }
  return (
    <Modal title={stage === 'done' ? 'Правка запрошена' : 'Запросить правку'}
      sub={stage === 'done' ? undefined : 'Правка — это исправление по ТЗ. Новая работа оформляется через «Предложить изменение задачи».'}
      onClose={onClose}
      footer={stage === 'done'
        ? <Btn variant="primary" onClick={onClose}>Понятно</Btn>
        : <><Btn onClick={onClose}>Отмена</Btn><Btn variant="primary" onClick={send}>Отправить запрос</Btn></>}>
      {stage === 'done' ? (
        <div className="stack g4">
          <div className="note note--warn"><Icon name="clock" size={16} />
            <span className="grow">Исполнитель получил запрос. Стоимость и срок не меняются, пока правка относится к ТЗ.</span></div>
          <div className="kv-rows">
            <div className="kv-row"><dt>Тип</dt><dd>{types[type]}</dd></div>
            <div className="kv-row"><dt>Кругов правок осталось</dt><dd>{Math.max(left - 1, 0)} из {p.edits}</dd></div>
          </div>
        </div>
      ) : (
        <div className="stack g5">
          <Field label="Что именно поправить" required error={err} hint="Опишите конкретно и со ссылкой на пункт ТЗ" id="fx-text">
            <textarea id="fx-text" className="textarea" value={text} onChange={(e) => setText(e.target.value)} data-invalid={!!err}
              placeholder="Например: в блоке услуг не хватает цены для услуги из прайса." />
          </Field>
          <Field label="Тип запроса">
            <div className="stack g3">
              {[['td', 'Что-то из описанного результата не выполнено'], ['detail', 'Работа сделана, но не хватает части материала'], ['error', 'Совсем небольшое исправление']].map(([fid, s]) => (
                <label key={fid} className="card card--pad-sm" style={{ cursor: 'pointer', padding: 'var(--s4)' }}>
                  <span className="radio"><input type="radio" name="fixt" checked={type === fid} onChange={() => setType(fid)} />
                    <span><strong>{types[fid]}</strong>{s}</span></span>
                </label>
              ))}
            </div>
          </Field>
          <div className="note"><Icon name="info" size={16} />
            <span className="grow">Осталось {left} из {pluralN(p.edits, W.round)} правок по ТЗ. Когда они закончатся, новые доработки потребуют отдельного согласования стоимости.</span></div>
        </div>
      )}
    </Modal>
  );
}

function ReviewModal({ p, role, onClose }) {
  const app = useApp();
  const { other } = useParties(p);
  const [stars, setStars] = useState(5);
  const [tags, setTags] = useState([]);
  const [text, setText] = useState('');
  const [stage, setStage] = useState('form');
  const isClient = role === 'client';
  const toggle = (t) => setTags((a) => (a.includes(t) ? a.filter((x) => x !== t) : [...a, t]));
  const tagList = isClient
    ? ['В срок', 'Понятно объясняет', 'Аккуратные файлы', 'Быстрые правки', 'Самостоятельный', 'Мало вопросов']
    : ['Понятное ТЗ', 'Быстрые ответы', 'Оплата в срок', 'Без давления по срокам', 'Готовые материалы'];
  const publish = () => { app.leaveReview(p.id, role, { stars, tags, text: text.trim() }); setStage('done'); app.toast('Спасибо, отзыв опубликован'); };
  return (
    <Modal title={isClient ? 'Отзыв об исполнителе' : 'Отзыв о заказчике'}
      sub={stage === 'done' ? undefined : 'Отзыв появится в профиле и в истории проекта. Это влияет на репутацию и видимость в поиске.'}
      onClose={onClose}
      footer={stage === 'done'
        ? <Btn variant="primary" onClick={onClose}>Готово</Btn>
        : <><Btn onClick={onClose}>Позже</Btn><Btn variant="primary" onClick={publish}>Опубликовать отзыв</Btn></>}>
      {stage === 'done' ? (
        <div className="stack g4">
          <div className="note note--ok"><Icon name="star" size={16} />
            <span className="grow"><strong>Отзыв опубликован.</strong> Вторая сторона получила уведомление и может ответить своим отзывом.</span></div>
          <div className="card card--soft stack g3">
            <Stars value={stars} />
            <div className="tag-row">{tags.length ? tags.map((t) => <Tag key={t}>{t}</Tag>) : <Tag tone="line">Без меток</Tag>}</div>
            {text.trim() && <p className="t-sm ink2">{text.trim()}</p>}
          </div>
        </div>
      ) : (
        <div className="stack g5">
          <div className="row between wrap g4 card card--soft card--pad-sm" style={{ padding: 'var(--s4)' }}>
            <div className="row g3" style={{ minWidth: 0 }}>
              <Avatar person={other} size="sm" />
              <div className="stack g1" style={{ minWidth: 0 }}>
                <span className="t-sm" style={{ fontWeight: 550 }}>{other?.name}</span>
                <span className="t-cap muted trunc">{p.title}</span>
              </div>
            </div>
            <Badge tone="ok" dot>Проект завершён</Badge>
          </div>
          <Field label="Оценка" required>
            <div className="row g2 wrap" role="radiogroup" aria-label="Оценка">
              {[1, 2, 3, 4, 5].map((i) => (
                <button type="button" key={i} className="btn btn--icon" onClick={() => setStars(i)} aria-label={i + ' из 5'} role="radio" aria-checked={stars === i}
                  style={{ width: 40, height: 40 }}>
                  <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true"><path d="M10 3.8l1.9 3.9 4.3.6-3.1 3 .7 4.3-3.8-2-3.8 2 .7-4.3-3.1-3 4.3-.6z" fill={i <= stars ? 'var(--accent)' : 'var(--surface-3)'} /></svg>
                </button>
              ))}
              <span className="t-sm muted">{['', 'Плохо', 'Ниже ожиданий', 'Нормально', 'Хорошо', 'Отлично'][stars]}</span>
            </div>
          </Field>
          <Field label="Что стоит отметить" hint="Необязательно. Метки помогают другим принимать решение быстрее">
            <div className="chips">{tagList.map((t) => <button type="button" key={t} aria-pressed={tags.includes(t)} className={'chip' + (tags.includes(t) ? ' is-on' : '')} onClick={() => toggle(t)}>{t}</button>)}</div>
          </Field>
          <Field label="Комментарий" hint="2–3 предложения: что прошло хорошо и что можно улучшить" id="rv-text">
            <textarea id="rv-text" className="textarea" value={text} onChange={(e) => setText(e.target.value)} placeholder={isClient
              ? 'Например: задача была понятна с первого раза, в срок уложился. Правки вносил быстро.'
              : 'Например: ТЗ описано подробно, отвечал быстро, оплата пришла сразу после приёмки.'} />
          </Field>
        </div>
      )}
    </Modal>
  );
}

const CHANGE_DAYS = [3, 5, 7, 10, 14];

function ChangeModal({ p, role, onClose }) {
  const app = useApp();
  const [scope, setScope] = useState('expand');
  const [stage, setStage] = useState('form');
  const [what, setWhat] = useState('');
  const [note, setNote] = useState('');
  const [price, setPrice] = useState(priceOf(p));
  const [extra, setExtra] = useState(0);
  const [err, setErr] = useState('');
  const days = daysOf(p) + extra;
  const titles = { expand: 'Дополнительный объём работы', scope: 'Уточнение состава работы', time: 'Перенос срока' };
  const send = () => {
    if (what.trim().length < 10) { setErr('Опишите, что именно меняется и почему.'); return; }
    if (price <= 0) { setErr('Укажите стоимость.'); return; }
    app.proposeChange(p.id, role, { title: titles[scope], what: what.trim(), note: note.trim(), priceTo: scope === 'time' ? priceOf(p) : price, daysTo: days });
    setStage('done');
    app.toast('Предложение отправлено второй стороне');
  };
  return (
    <Modal wide title={stage === 'done' ? 'Предложение отправлено' : 'Предложить изменение задачи'}
      sub={stage === 'done' ? undefined : 'Изменение вступит в силу только после подтверждения обеими сторонами.'}
      onClose={onClose}
      footer={stage === 'done'
        ? <Btn variant="primary" onClick={onClose}>Понятно</Btn>
        : <><Btn onClick={onClose}>Отмена</Btn><Btn variant="primary" onClick={send}>Отправить предложение</Btn></>}>
      {stage === 'done' ? (
        <div className="stack g4">
          <div className="note note--accent"><Icon name="clock" size={16} />
            <span className="grow">Вторая сторона получит уведомление. Пока предложение не подтверждено, ТЗ и условия остаются прежними.</span></div>
          <div className="kv-rows">
            <div className="kv-row"><dt>Что предлагается</dt><dd>{titles[scope]}</dd></div>
            <div className="kv-row"><dt>Стоимость</dt><dd>{money(priceOf(p))} → {money(scope === 'time' ? priceOf(p) : price)}</dd></div>
            <div className="kv-row"><dt>Срок</dt><dd>{daysLabel(daysOf(p))} → {daysLabel(days)}</dd></div>
          </div>
        </div>
      ) : (
        <div className="stack g5">
          <Field label="Что меняется" required>
            <div className="stack g3">
              {[['expand', 'Новая функция или объём, которого не было в ТЗ'],
                ['scope', 'ТЗ понятно не полностью, нужно описать точнее — без изменения объёма'],
                ['time', 'Объём тот же, но сроки требуется изменить']].map(([sid, s]) => (
                <label key={sid} className="card card--pad-sm" style={{ cursor: 'pointer', padding: 'var(--s4)' }}>
                  <span className="radio"><input type="radio" name="scope" checked={scope === sid} onChange={() => setScope(sid)} />
                    <span><strong>{titles[sid]}</strong>{s}</span></span>
                </label>
              ))}
            </div>
          </Field>
          <Field label="Описание изменения" required error={err} hint="Что именно добавить или изменить и почему это важно" id="ch-what">
            <textarea id="ch-what" className="textarea" value={what} onChange={(e) => setWhat(e.target.value)} data-invalid={!!err} />
          </Field>
          <div className="grid-2" style={{ gap: 'var(--s5)' }}>
            {scope !== 'time' && (
              <Field label="Новая стоимость" hint={'Текущая: ' + money(priceOf(p))} id="ch-price">
                <div className="affix"><input id="ch-price" className="input input--num" type="number" min="0" step="1000" value={price} onChange={(e) => setPrice(Math.max(0, Math.round(Number(e.target.value) || 0)))} /><span className="suffix">₸</span></div>
              </Field>
            )}
            <Field label="Дополнительное время" hint={'Текущий срок: ' + daysLabel(daysOf(p))} id="ch-days">
              <select id="ch-days" className="select" value={extra} onChange={(e) => setExtra(Number(e.target.value))}>
                <option value={0}>Срок не меняется</option>
                {CHANGE_DAYS.map((d) => <option key={d} value={d}>+{daysLabel(d)}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Обоснование" hint="Помогает второй стороне быстрее подтвердить изменение" id="ch-note">
            <textarea id="ch-note" className="textarea" style={{ minHeight: 80 }} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Например: дополнительная ветка диалога — это ещё около 5 часов работы." />
          </Field>
          {role === 'specialist' && scope !== 'time' && (
            <div className="card card--soft card--pad-sm"><PayoutRows price={price} priceLabel="Новая стоимость" /></div>
          )}
          <div className="note"><Icon name="lock" size={16} />
            <span className="grow">Если изменение отклонят, объём и стоимость останутся прежними. Это защита от расширения задачи «по ходу».</span></div>
        </div>
      )}
    </Modal>
  );
}

function SupportModal({ p, onClose }) {
  const app = useApp();
  const [stage, setStage] = useState('form');
  const [topic, setTopic] = useState('Вторая сторона не отвечает');
  const [text, setText] = useState('');
  const [err, setErr] = useState('');
  const [ticket] = useState(() => 't-' + (2400 + Math.floor(Math.random() * 500)));
  const send = () => {
    if (text.trim().length < 10) { setErr('Опишите ситуацию хотя бы парой предложений.'); return; }
    setStage('done'); app.toast('Обращение создано, ответ придёт в уведомления');
  };
  return (
    <Modal title={stage === 'done' ? 'Обращение создано' : 'Обращение в поддержку'}
      sub={stage === 'done' ? undefined : 'Обращение привяжется к проекту: поддержка увидит ТЗ, файлы, этапы и переписку.'}
      onClose={onClose}
      footer={stage === 'done'
        ? <Btn variant="primary" onClick={onClose}>Понятно</Btn>
        : <><Btn onClick={onClose}>Отмена</Btn><Btn variant="primary" onClick={send}>Создать обращение</Btn></>}>
      {stage === 'done' ? (
        <div className="stack g4">
          <div className="note note--ok"><Icon name="help" size={16} />
            <span className="grow"><strong>Обращение создано.</strong> Ответим в течение рабочего дня. Зарезервированная оплата остаётся на стороне сделки.</span></div>
          <div className="kv-rows">
            <div className="kv-row"><dt>Проект</dt><dd>{p.title}</dd></div>
            <div className="kv-row"><dt>Тема</dt><dd>{topic}</dd></div>
            <div className="kv-row"><dt>Номер обращения</dt><dd>{ticket}</dd></div>
          </div>
        </div>
      ) : (
        <div className="stack g5">
          <Field label="По какому вопросу" required id="sp-topic">
            <select id="sp-topic" className="select" value={topic} onChange={(e) => setTopic(e.target.value)}>
              {['Вторая сторона не отвечает', 'Результат не соответствует ТЗ', 'Спор по правкам', 'Требуют работу вне ТЗ', 'Вопрос по оплате', 'Другое'].map((t) => <option key={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="Опишите ситуацию" required error={err} hint="Что произошло и какое решение вы ожидаете" id="sp-text">
            <textarea id="sp-text" className="textarea" style={{ minHeight: 120 }} value={text} onChange={(e) => setText(e.target.value)} data-invalid={!!err} />
          </Field>
          <div className="note"><Icon name="shield" size={16} />
            <span className="grow">До решения спора средства остаются зарезервированными: они не уходят ни заказчику, ни исполнителю.</span></div>
        </div>
      )}
    </Modal>
  );
}

export { Workspace, DeliverModal, AcceptModal, FixModal, ReviewModal, ChangeModal, SupportModal, WS_SECTIONS };
