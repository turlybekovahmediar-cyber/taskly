/* Переписка по проекту. Сообщение «моё», если его автор — моя роль (client | specialist). */
import React, { useEffect, useRef, useState } from 'react';
import { Icon, useApp, Btn, Avatar, Badge, Empty } from './ui.jsx';
import { specialistById, projectById } from '../store/store.jsx';
import { initials } from '../lib/format.js';

/* Карточка «вторая сторона» для заказчика: аватар компании */
export const clientPerson = (name) => ({ name, initials: initials(name), avatar: 'avatar--b' });

/* Кто есть кто в проекте с точки зрения роли */
export function useParties(p) {
  const app = useApp();
  const spec = specialistById(p?.specialistId);
  const client = clientPerson(p?.mine ? app.bizName : p?.client);
  return app.role === 'specialist' ? { me: spec, other: client, otherRole: 'Заказчик' } : { me: client, other: spec, otherRole: 'Исполнитель' };
}

export function ChatThread({ projectId, maxHeight }) {
  const app = useApp();
  const role = app.role === 'specialist' ? 'specialist' : 'client';
  const p = projectById(app.entities, projectId);
  const { me, other } = useParties(p);
  const list = app.entities.messages[projectId] || [];
  const [msg, setMsg] = useState('');
  const box = useRef(null);

  useEffect(() => { if (box.current) box.current.scrollTop = box.current.scrollHeight; }, [list.length, projectId]);

  const send = () => {
    const text = msg.trim();
    if (!text) return;
    app.sendMessage(projectId, role, text);
    setMsg('');
  };

  return (
    <>
      <div className="chat grow" ref={box} style={maxHeight ? { maxHeight } : undefined} aria-live="polite">
        {list.length === 0 && <p className="t-sm muted" style={{ textAlign: 'center', margin: 'auto 0' }}>Сообщений пока нет. Напишите первым — переписка сохранится в проекте.</p>}
        {list.map((m) => m.from === 'system' ? (
          <div className="msg--sys" key={m.id}>{m.text}</div>
        ) : (
          <div className={'msg' + (m.from === role ? ' msg--me' : '')} key={m.id}>
            <Avatar person={m.from === role ? me : other} size="sm" />
            <div className="stack g1" style={{ minWidth: 0 }}>
              <div className="msg-b">
                {m.text}
                {m.file && (
                  <div className="file-item msg-file">
                    <span className="file-ic"><Icon name="folder" size={15} /></span>
                    <span className="t-cap trunc">{m.file}</span>
                  </div>
                )}
              </div>
              <span className="msg-time" style={{ textAlign: m.from === role ? 'right' : 'left' }}>{m.when}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="stack g3" style={{ padding: 'var(--s4) var(--s5)', borderTop: '1px solid var(--line)' }}>
        <form className="row g3" onSubmit={(e) => { e.preventDefault(); send(); }}>
          <input className="input grow" placeholder="Сообщение по проекту…" aria-label="Текст сообщения" value={msg} onChange={(e) => setMsg(e.target.value)} />
          <Btn icon="upload" aria-label="Прикрепить файл" onClick={() => app.toast('Вложения появятся после подключения сервера')} />
          <Btn variant="primary" icon="send" type="submit" disabled={!msg.trim()}><span className="hide-sm">Отправить</span></Btn>
        </form>
        <p className="t-cap muted">Новые требования, написанные в переписке, не меняют ТЗ. Для этого есть «Предложить изменение задачи».</p>
      </div>
    </>
  );
}

/* Раздел «Сообщения»: список проектов слева, переписка справа */
export function Inbox({ projects, workspaceBase }) {
  const app = useApp();
  const [q, setQ] = useState('');
  const [active, setActive] = useState(projects[0]?.id);
  const current = projects.find((p) => p.id === active) || projects[0];
  const shown = projects.filter((p) => !q.trim() || (p.title + ' ' + (app.entities.messages[p.id] || []).map((m) => m.text).join(' ')).toLowerCase().includes(q.trim().toLowerCase()));

  if (!projects.length) {
    return (
      <div className="card">
        <Empty icon="chat" title="Переписок пока нет"
          text="Переписка появляется, когда исполнитель выбран: она привязана к проекту, чтобы контекст задачи был рядом." />
      </div>
    );
  }

  return (
    <div className="card card--flush inbox">
      <div className="inbox-list">
        <div style={{ padding: 'var(--s4)', borderBottom: '1px solid var(--line)' }}>
          <input className="input input--search" placeholder="Поиск по переписке" aria-label="Поиск по переписке" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="rows" style={{ overflow: 'auto' }}>
          {shown.map((p) => <InboxRow key={p.id} p={p} on={current && p.id === current.id} onClick={() => setActive(p.id)} />)}
          {shown.length === 0 && <p className="t-cap muted" style={{ padding: 'var(--s4)' }}>Ничего не найдено</p>}
        </div>
      </div>
      {current && <InboxThread p={current} workspaceBase={workspaceBase} />}
    </div>
  );
}

function InboxRow({ p, on, onClick }) {
  const app = useApp();
  const { other } = useParties(p);
  const list = app.entities.messages[p.id] || [];
  const last = [...list].reverse().find((m) => m.from !== 'system');
  return (
    <button type="button" className="row-item" style={{ background: on ? 'var(--surface-2)' : undefined }} onClick={onClick} aria-current={on ? 'true' : undefined}>
      <Avatar person={other} size="sm" />
      <span className="stack g1 grow" style={{ minWidth: 0 }}>
        <span className="t-sm trunc" style={{ fontWeight: 550 }}>{other?.name}</span>
        <span className="t-cap muted trunc">{p.title}</span>
        <span className="t-cap trunc" style={{ color: 'var(--ink-3)' }}>{last ? last.text : 'Сообщений пока нет'}</span>
      </span>
    </button>
  );
}

function InboxThread({ p, workspaceBase }) {
  const app = useApp();
  const { other, otherRole } = useParties(p);
  return (
    <div className="inbox-thread">
      <div className="row between wrap g4" style={{ padding: 'var(--s4) var(--s5)', borderBottom: '1px solid var(--line)' }}>
        <div className="row g3" style={{ minWidth: 0 }}>
          <Avatar person={other} size="sm" />
          <div className="stack g1" style={{ minWidth: 0 }}>
            <span className="t-sm" style={{ fontWeight: 550 }}>{other?.name} <span className="muted" style={{ fontWeight: 400 }}>· {otherRole}</span></span>
            <span className="t-cap muted trunc">{p.title}</span>
          </div>
        </div>
        <div className="row g3">
          {p.paid ? <Badge tone="ok" dot>Оплата зарезервирована</Badge> : <Badge tone="warn" dot>Ожидает оплаты</Badge>}
          <Btn size="sm" variant="quiet" onClick={() => app.navigate(workspaceBase + p.id)}>Проект</Btn>
        </div>
      </div>
      <ChatThread projectId={p.id} />
    </div>
  );
}
