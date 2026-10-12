/* Taskly — вход, регистрация и онбординг обеих сторон. */
import React, { useState } from 'react';
import { Icon, useApp, Btn, Link, Field, Ph } from '../components/ui.jsx';
import { directions, skillsByDirection, spheres } from '../data/mock.js';
import { parseRoute } from '../lib/router.js';
import { shortName } from '../lib/format.js';
import { useSoon } from '../components/ui.jsx';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function AuthLayout({ side, children, title, sub }) {
  return (
    <main className="page" style={{ paddingTop: 'var(--s12)', paddingBottom: 'var(--s20)' }}>
      <div className="hero-grid hero-grid--auth">
        <div className="stack g6" style={{ maxWidth: 520 }}>
          <h1 className="t-h2">{title}</h1>
          <p className="t-lg ink2">{sub}</p>
          {side}
        </div>
        <div className="card card--pad-lg stack g5">{children}</div>
      </div>
    </main>
  );
}

function RoleToggle({ value, onChange }) {
  return (
    <div className="grid-2" style={{ gap: 'var(--s3)' }}>
      {[['client', 'briefcase', 'Я бизнес', 'Нужны исполнители для задач'], ['specialist', 'user', 'Я специалист', 'Хочу выполнять проекты']].map(([id, icon, t, s]) => (
        <button key={id} type="button" onClick={() => onChange(id)}
          className={'card card--pad-sm stack g2' + (value === id ? ' card--active' : ' card--link')}
          style={{ textAlign: 'left', alignItems: 'flex-start' }}>
          <span className="row g2" style={{ fontWeight: 600, fontSize: 'var(--fs-sm)' }}>
            <Icon name={icon} size={16} />{t}
          </span>
          <span className="t-cap muted">{s}</span>
        </button>
      ))}
    </div>
  );
}

/* ============================ Вход ============================ */
function SignIn() {
  const app = useApp();
  const [role, setRole] = useState('client');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState({});
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    const v = email.trim();
    const errs = {};
    if (!EMAIL_RE.test(v)) errs.email = 'Введите email, например name@company.kz';
    if (!password) errs.password = 'Введите пароль';
    setErr(errs);
    if (Object.keys(errs).length) return;
    setBusy(true);
    try {
      const res = await app.login({ email: v, password, role });
      const r = res.user.role;
      app.navigate(r === 'client' ? '/biz' : '/spec');
      app.toast('Здравствуйте, ' + (r === 'client' ? res.user.business?.company || res.user.name : shortName(res.user.name)));
    } catch (ex) {
      setErr({ form: ex.message });
      setBusy(false);
    }
  };
  const demo = async (r) => { await app.setRole(r); app.navigate(r === 'client' ? '/biz' : '/spec'); };

  return (
    <AuthLayout title="Вход в Taskly" sub="Войдите, чтобы продолжить работу с проектами, откликами и сообщениями."
      side={
        <div className="stack g4">
          <div className="card card--pad-sm stack g3">
            <span className="t-micro muted">Быстрый вход в демо-аккаунты</span>
            <button type="button" className="menu-item" disabled={app.pending} onClick={() => demo('client')}><Icon name="briefcase" size={16} />Кабинет бизнеса · Barber Loft</button>
            <button type="button" className="menu-item" disabled={app.pending} onClick={() => demo('specialist')}><Icon name="user" size={16} />Кабинет специалиста · Аружан С.</button>
          </div>
          <div className="note"><Icon name="info" size={16} /><span className="grow">Демо-аккаунты — общие для всех, кто смотрит продукт. Чтобы работать со своими проектами, зарегистрируйтесь.</span></div>
        </div>
      }>
      <form className="stack g5" onSubmit={submit} noValidate>
        <RoleToggle value={role} onChange={setRole} />
        {err.form && <div className="note note--stop" role="alert"><Icon name="alert" size={16} /><span className="grow">{err.form}</span></div>}
        <Field label="Email" id="si-email" required error={err.email}>
          <input className="input" id="si-email" type="email" autoComplete="email" placeholder="name@company.kz" value={email} onChange={(e) => setEmail(e.target.value)} data-invalid={!!err.email} />
        </Field>
        <Field label="Пароль" id="si-pass" required error={err.password}>
          <input className="input" id="si-pass" type="password" autoComplete="current-password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} data-invalid={!!err.password} />
        </Field>
        <Btn variant="primary" full size="lg" type="submit" disabled={busy}>
          {busy ? <><span className="spin" /> Входим…</> : 'Войти'}
        </Btn>
        <p className="t-cap muted" style={{ textAlign: 'center' }}>
          Нет аккаунта? <Link to="/signup" style={{ color: 'var(--accent)' }}>Зарегистрироваться</Link>
        </p>
      </form>
    </AuthLayout>
  );
}

/* ============================ Регистрация ============================ */
function SignUp() {
  const app = useApp();
  const initialRole = parseRoute(app.route).params.get('role') === 'specialist' ? 'specialist' : 'client';
  const [role, setRole] = useState(initialRole);
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState({});
  const [busy, setBusy] = useState(false);

  const next = async () => {
    const e = {};
    if (step === 1) {
      if (name.trim().length < 2) e.name = 'Укажите ' + (role === 'client' ? 'название компании' : 'имя');
      if (!EMAIL_RE.test(email.trim())) e.email = 'Введите корректный email, например name@company.kz';
    }
    if (step === 2) {
      if (password.length < 8) e.password = 'Минимум 8 символов';
      else if (!/\d/.test(password) || !/[a-zа-яё]/i.test(password)) e.password = 'Нужны и буквы, и цифры';
    }
    setErr(e);
    if (Object.keys(e).length) return;
    if (step < 2) { setStep(step + 1); return; }
    setBusy(true);
    try {
      await app.register({ role, name: name.trim(), email: email.trim(), password });
      app.navigate(role === 'client' ? '/onboarding/business' : '/onboarding/specialist');
      app.toast('Аккаунт создан');
    } catch (ex) {
      setBusy(false);
      /* Занятый email — возвращаем на первый шаг к нужному полю */
      if (ex.status === 409) { setStep(1); setErr({ email: ex.message }); } else setErr({ form: ex.message });
    }
  };

  return (
    <AuthLayout title="Регистрация в Taskly" sub="Одна учётная запись для размещения задач и для выполнения проектов."
      side={
        <div className="stack g4">
          <div className="card card--pad-sm stack g3">
            <span className="t-micro muted">Что будет дальше</span>
            <div className="steps">
              {[
                ['Создаём аккаунт', 'Имя или название, email, пароль'],
                ['Настраиваем профиль', role === 'client' ? 'Компания, сфера, как обычно платите' : 'Направления, навыки, портфолио'],
                ['Первый проект или первый отклик', role === 'client' ? 'Мастер из шести шагов' : 'Поиск проектов по навыкам'],
              ].map(([t, s], i) => (
                <div className={'step-item ' + (i === 0 ? 'is-now' : 'is-todo')} key={t}>
                  <div className="step-mark"><div className="step-dot">{i + 1}</div><div className="step-line" /></div>
                  <div className="step-body stack g1"><span className="step-title">{t}</span><span className="step-sub">{s}</span></div>
                </div>
              ))}
            </div>
          </div>
          <p className="t-cap muted">Регистрируясь, вы принимаете <Link to="/terms" style={{ textDecoration: 'underline' }}>условия использования</Link> и <Link to="/privacy" style={{ textDecoration: 'underline' }}>политику конфиденциальности</Link>.</p>
        </div>
      }>
      <div className="stack g5">
        <div className="row between g3">
          <span className="t-micro muted">Шаг {step} из 2</span>
          <div style={{ display: 'flex', gap: 4 }}>
            {[1, 2].map((i) => <div key={i} style={{ width: 26, height: 4, borderRadius: 2, background: i <= step ? 'var(--accent)' : 'var(--surface-3)' }} />)}
          </div>
        </div>
        {step === 1 ? (
          <>
            <RoleToggle value={role} onChange={setRole} />
            <Field label={role === 'client' ? 'Название компании' : 'Имя и фамилия'} required error={err.name} id="su-name">
              <input className="input" id="su-name" value={name} onChange={(e) => setName(e.target.value)}
                placeholder={role === 'client' ? 'Например, Barber Loft' : 'Например, Аружан Смагулова'} data-invalid={!!err.name} />
            </Field>
            <Field label="Email" required error={err.email} id="su-email">
              <input className="input" id="su-email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.kz" data-invalid={!!err.email} />
            </Field>
          </>
        ) : (
          <>
            {err.form && <div className="note note--stop" role="alert"><Icon name="alert" size={16} /><span className="grow">{err.form}</span></div>}
            <Field label="Пароль" required hint="Минимум 8 символов, буквы и цифры" error={err.password} id="su-pass">
              <input className="input" id="su-pass" type="password" autoComplete="new-password" value={password}
                onChange={(e) => setPassword(e.target.value)} data-invalid={!!err.password} />
            </Field>
            <label className="check"><input type="checkbox" defaultChecked />
              <span><strong>Присылать уведомления по проектам</strong>Отклики, изменения условий, сдача работы и выплаты</span>
            </label>
            <label className="check"><input type="checkbox" />
              <span><strong>Полезные материалы и обновления</strong>{role === 'client' ? 'Как формулировать ТЗ и выбирать исполнителя' : 'Как получить первый проект'}</span>
            </label>
          </>
        )}
        <div className="row g3">
          {step > 1 && <Btn onClick={() => setStep(step - 1)} icon="arrowL">Назад</Btn>}
          <Btn variant="primary" full onClick={next} disabled={busy}>
            {busy ? <><span className="spin" /> Создаём аккаунт…</> : step < 2 ? 'Продолжить' : 'Создать аккаунт'}
          </Btn>
        </div>
        <p className="t-cap muted" style={{ textAlign: 'center' }}>
          Уже есть аккаунт? <Link to="/signin" style={{ color: 'var(--accent)' }}>Войти</Link>
        </p>
      </div>
    </AuthLayout>
  );
}

/* ======================= Онбординг: бизнес ======================= */
function OnboardingBusiness() {
  const app = useApp();
  const [step, setStep] = useState(1);
  const [sphere, setSphere] = useState('Услуги для людей');
  const [tasks, setTasks] = useState([]);
  const [pays, setPays] = useState('Разово под конкретную задачу');
  const [site, setSite] = useState(app.business?.site || '');
  const toggle = (t) => setTasks((a) => (a.includes(t) ? a.filter((x) => x !== t) : [...a, t]));
  /* Сохраняем профиль компании и переходим дальше */
  const finish = async (to) => { await app.updateBusiness({ sphere, site: site.trim() }); app.navigate(to); };

  return (
    <main className="page" style={{ paddingTop: 'var(--s12)', paddingBottom: 'var(--s20)' }}>
      <div className="wiz">
        <div className="stack g5 panel--sticky">
          <div className="stack g2">
            <span className="t-micro muted">Онбординг бизнеса</span>
            <h1 className="t-h3">{app.bizName}</h1>
          </div>
          <div className="steps">
            {[['О компании', 'Сфера и размер'], ['Какие задачи', 'Тип задач и направления'], ['Как работаете', 'Оплата и сроки'], ['Готово', 'Что дальше']].map(([t, s], i) => {
              const n = i + 1;
              const st = n < step ? 'is-done' : n === step ? 'is-now' : 'is-todo';
              return (
                <div className={'step-item ' + st} key={t}>
                  <div className="step-mark"><div className="step-dot">{n < step ? <Icon name="check" size={13} /> : n}</div><div className="step-line" /></div>
                  <div className="step-body stack g1"><span className="step-title">{t}</span><span className="step-sub">{s}</span></div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card card--pad-lg stack g6">
          {step === 1 && (
            <>
              <div className="stack g2">
                <h2 className="t-h3">Немного о компании</h2>
                <p className="t-sm muted">Это помогает показывать ваши проекты подходящим специалистам и не спрашивать одно и то же каждый раз.</p>
              </div>
              <Field label="Сфера деятельности" required>
                <select className="select" value={sphere} onChange={(e) => setSphere(e.target.value)}>
                  {spheres.map((s) => <option key={s}>{s}</option>)}
                </select>
              </Field>
              <Field label="Сколько человек в команде" hint="Не влияет на доступ к платформе">
                <select className="select" defaultValue="2–10 человек">
                  {['Только я', '2–10 человек', '11–50 человек', 'Больше 50'].map((s) => <option key={s}>{s}</option>)}
                </select>
              </Field>
              <Field label="Сайт или соцсети" hint="Необязательно — помогает специалисту понять контекст">
                <input className="input" placeholder="barberloft.kz" value={site} onChange={(e) => setSite(e.target.value)} />
              </Field>
            </>
          )}

          {step === 2 && (
            <>
              <div className="stack g2">
                <h2 className="t-h3">Какие задачи вы обычно решаете</h2>
                <p className="t-sm muted">Выберите то, что ближе. Это только подсказка для подбора специалистов и примеров — платформа не ограничена этим списком.</p>
              </div>
              <div className="chips">
                {['Дизайн и оформление', 'Разработка и автоматизация', 'Тексты и контент', 'Аналитика и таблицы',
                  'Маркетинг и реклама', 'Исследования', 'Документы и регламенты', 'Видео и монтаж', 'Разные задачи'].map((t) => (
                  <button type="button" key={t} className={'chip' + (tasks.includes(t) ? ' is-on' : '')} onClick={() => toggle(t)}>{t}</button>
                ))}
              </div>
              <Field label="Опишите одну задачу, которая есть прямо сейчас" hint="Не обязательно идеально — можно своими словами, мы поможем собрать ТЗ">
                <textarea className="textarea" placeholder="Например: нужен лендинг для студии, пока нет ни сайта, ни текстов" />
              </Field>
            </>
          )}

          {step === 3 && (
            <>
              <div className="stack g2">
                <h2 className="t-h3">Как вы предпочитаете работать</h2>
                <p className="t-sm muted">Taskly использует это, чтобы показывать понятные условия без лишних согласований.</p>
              </div>
              <Field label="Формат оплаты" required>
                <div className="stack g3">
                  {['Разово под конкретную задачу', 'Несколько задач в месяц по договорённости', 'Пока не знаю'].map((o) => (
                    <label key={o} className="card card--pad-sm" style={{ cursor: 'pointer', padding: 'var(--s4)' }}>
                      <span className="radio"><input type="radio" name="pay" checked={pays === o} onChange={() => setPays(o)} /><span><strong>{o}</strong></span></span>
                    </label>
                  ))}
                </div>
              </Field>
              <div className="note"><Icon name="shield" size={16} />
                <span className="grow">Перед началом каждого проекта стоимость резервируется через платёжную систему и передаётся специалисту только после приёмки результата.</span>
              </div>
            </>
          )}

          {step === 4 && (
            <>
              <div className="stack g2">
                <h2 className="t-h3">Профиль бизнеса готов</h2>
                <p className="t-sm muted">Дальше — самый важный шаг: описать первую задачу. Это займёт около трёх минут.</p>
              </div>
              <div className="card card--soft stack g3">
                <div className="kv-rows">
                  <div className="kv-row"><dt>Компания</dt><dd>{app.bizName}</dd></div>
                  <div className="kv-row"><dt>Сфера</dt><dd>{sphere}</dd></div>
                  <div className="kv-row"><dt>Типы задач</dt><dd>{tasks.length ? tasks.join(', ') : 'Не указано'}</dd></div>
                  <div className="kv-row"><dt>Формат оплаты</dt><dd>{pays}</dd></div>
                </div>
              </div>
              <div className="stack g3">
                <span className="t-micro muted">Что будет дальше</span>
                <div className="card card--pad-sm stack g3">
                  {[['Создать проект', 'Шесть вопросов → структурированное ТЗ', '/biz/projects/new'],
                    ['Найти специалиста', 'Профили, портфолио, отзывы — можно пригласить в проект', '/biz/specialists'],
                    ['Как проходит сделка', 'Резерв оплаты, этапы, сдача и приёмка', '/how']].map(([t, s, to]) => (
                    <button type="button" key={t} className="menu-item" onClick={() => finish(to)}>
                      <Icon name="arrowR" size={16} />
                      <span className="stack"><strong>{t}</strong><span className="t-cap muted" style={{ fontWeight: 400 }}>{s}</span></span>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          <div className="row between g3 wrap" style={{ borderTop: '1px solid var(--line)', paddingTop: 'var(--s5)' }}>
            <button type="button" className="btn btn--ghost" onClick={() => (step > 1 ? setStep(step - 1) : app.navigate('/signup'))}
              style={{ paddingLeft: 0 }}>{step > 1 ? '← Назад' : 'К регистрации'}</button>
            {step < 4
              ? <Btn variant="primary" onClick={() => setStep(step + 1)}>Продолжить</Btn>
              : <div className="row g3"><Btn onClick={() => finish('/biz')}>В кабинет</Btn>
                <Btn variant="primary" onClick={() => finish('/biz/projects/new')}>Создать первый проект</Btn></div>}
          </div>
        </div>
      </div>
    </main>
  );
}

/* ===================== Онбординг: специалист ===================== */
function OnboardingSpecialist() {
  const app = useApp();
  const [step, setStep] = useState(1);
  const [dirs, setDirs] = useState(['design']);
  const [sk, setSk] = useState(['Figma', 'UI/UX', 'Лендинг']);
  const [level, setLevel] = useState('Начинаю, опыта в коммерческих проектах нет');
  const [items, setItems] = useState([{ t: '', s: '', ph: '' }]);
  const [headline, setHeadline] = useState('');
  const [skillQ, setSkillQ] = useState('');
  const setItem = (i, k, v) => setItems((a) => a.map((it, j) => (j === i ? { ...it, [k]: v } : it)));
  const finish = async (to) => {
    await app.updateSpecProfile({
      headline: headline.trim(), directions: dirs, skills: sk,
      portfolio: items.filter((w) => w.t.trim()).map((w) => ({ t: w.t.trim(), s: w.s.trim(), ph: 'работа из портфолио' })),
    });
    app.navigate(to);
  };
  const soon = useSoon();

  const toggleIn = (arr, set, v) => set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  const stepsList = [['Направления', 'Где хотите работать'], ['Навыки', 'Что уже умеете'], ['Опыт и портфолио', 'Чем подтвердить'], ['Верификация', 'Как получить доверие'], ['Готово', 'Что дальше']];

  return (
    <main className="page" style={{ paddingTop: 'var(--s12)', paddingBottom: 'var(--s20)' }}>
      <div className="wiz">
        <div className="stack g5 panel--sticky">
          <div className="stack g2">
            <span className="t-micro muted">Онбординг специалиста</span>
            <h1 className="t-h3">Профиль специалиста</h1>
          </div>
          <div className="steps">
            {stepsList.map(([t, s], i) => {
              const n = i + 1;
              const st = n < step ? 'is-done' : n === step ? 'is-now' : 'is-todo';
              return (
                <div className={'step-item ' + st} key={t}>
                  <div className="step-mark"><div className="step-dot">{n < step ? <Icon name="check" size={13} /> : n}</div><div className="step-line" /></div>
                  <div className="step-body stack g1"><span className="step-title">{t}</span><span className="step-sub">{s}</span></div>
                </div>
              );
            })}
          </div>
          <div className="note"><Icon name="info" size={16} /><span className="grow">Профиль можно менять в любой момент. Данные из него используются только для поиска подходящих проектов.</span></div>
        </div>

        <div className="card card--pad-lg stack g6">
          {step === 1 && (
            <>
              <div className="stack g2">
                <h2 className="t-h3">В каких направлениях хотите работать</h2>
                <p className="t-sm muted">Можно выбрать несколько. Направления — только для навигации, проекты ищутся ещё и по навыкам.</p>
              </div>
              <div className="chips">
                {directions.map((d) => (
                  <button type="button" key={d.id} className={'chip' + (dirs.includes(d.id) ? ' is-on' : '')} onClick={() => toggleIn(dirs, setDirs, d.id)}>{d.name}</button>
                ))}
              </div>
              <Field label="Короткая строка о себе" hint="Появится в карточке профиля. Например: «UI/UX и лендинги в Figma»" required>
                <input className="input" placeholder="UI/UX и лендинги" value={headline} onChange={(e) => setHeadline(e.target.value)} />
              </Field>
            </>
          )}

          {step === 2 && (
            <>
              <div className="stack g2">
                <h2 className="t-h3">Что вы уже умеете</h2>
                <p className="t-sm muted">Навыки определяют, какие проекты вам показывать и где появится метка «Совпадают N навыка».</p>
              </div>
              <Field label="Поиск навыка">
                <input className="input input--search" placeholder="Например, Figma, Excel, Python" value={skillQ} onChange={(e) => setSkillQ(e.target.value)} />
              </Field>
              <div className="stack g4">
                {dirs.length === 0 && <p className="t-sm muted">Сначала выберите хотя бы одно направление — покажем подходящие навыки.</p>}
                {dirs.map((dir) => {
                  const d = directions.find((x) => x.id === dir);
                  return (
                    <div className="stack g3" key={dir}>
                      <span className="t-micro muted">{d ? d.name : dir}</span>
                      <div className="chips">
                        {(skillsByDirection[dir] || []).filter((s) => !skillQ || s.toLowerCase().includes(skillQ.trim().toLowerCase())).map((s) => (
                          <button type="button" key={s} className={'chip' + (sk.includes(s) ? ' is-on' : '')} onClick={() => toggleIn(sk, setSk, s)}>
                            {sk.includes(s) && <Icon name="check" size={13} />}{s}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
              {sk.length > 0 && (
                <div className="card card--soft stack g3">
                  <span className="t-micro muted">Выбрано: {sk.length}</span>
                  <div className="tag-row">
                    {sk.map((s) => <button type="button" key={s} className="chip is-on" onClick={() => toggleIn(sk, setSk, s)}>{s}<span className="x">×</span></button>)}
                  </div>
                </div>
              )}
            </>
          )}

          {step === 3 && (
            <>
              <div className="stack g2">
                <h2 className="t-h3">Опыт и портфолио</h2>
                <p className="t-sm muted">Коммерческих проектов может не быть. Подойдут учебные работы, личные кейсы, курсовые — что угодно, что показывает ваш уровень.</p>
              </div>
              <Field label="Текущий уровень" required>
                <div className="stack g3">
                  {['Начинаю, опыта в коммерческих проектах нет', 'Есть учебные и личные проекты', 'Есть 1–3 коммерческих проекта', 'Работаю больше года'].map((o) => (
                    <label key={o} className="card card--pad-sm" style={{ cursor: 'pointer', padding: 'var(--s4)' }}>
                      <span className="radio"><input type="radio" name="lvl" checked={level === o} onChange={() => setLevel(o)} /><span><strong>{o}</strong></span></span>
                    </label>
                  ))}
                </div>
              </Field>
              <div className="stack g3">
                <span className="t-micro muted">Работы в портфолио</span>
                {items.map((it, i) => (
                  <div className="card card--pad-sm stack g3" key={i}>
                    <div className="row between g3">
                      <strong className="t-cap">Работа {i + 1}</strong>
                      {items.length > 1 && <button type="button" className="btn btn--icon btn--sm" onClick={() => setItems(items.filter((_, j) => j !== i))} aria-label="Удалить"><Icon name="trash" size={15} /></button>}
                    </div>
                    <Field label="Название"><input className="input" placeholder="Лендинг для языковой школы" value={it.t} onChange={(e) => setItem(i, 't', e.target.value)} /></Field>
                    <Field label="Что было сделано"><input className="input" placeholder="Дизайн и вёрстка, 6 секций" value={it.s} onChange={(e) => setItem(i, 's', e.target.value)} /></Field>
                    <div className="row g3 wrap">
                      <Ph label="изображение работы" variant="shot" style={{ width: 168 }} />
                      <div className="stack g2 grow" style={{ justifyContent: 'center', minWidth: 180 }}>
                        <Btn variant="secondary" size="sm" icon="upload" onClick={() => soon('Загрузка файлов')}>Загрузить файл</Btn>
                        <span className="t-cap muted">PNG, JPG или PDF до 10 МБ. Можно добавить ссылку.</span>
                      </div>
                    </div>
                  </div>
                ))}
                <Btn variant="quiet" icon="plus" onClick={() => setItems([...items, { t: '', s: '', ph: '' }])}>Добавить работу</Btn>
              </div>
            </>
          )}

          {step === 4 && (
            <>
              <div className="stack g2">
                <h2 className="t-h3">Как подтвердить навыки</h2>
                <p className="t-sm muted">Верификация не обязательна, чтобы откликаться. Она помогает заказчику быстрее принять решение — и не мешает новым специалистам.</p>
              </div>
              <div className="stack g3">
                {[
                  ['Портфолио проверено', 'Вы загрузили работы и подтвердили авторство', 'Проверим в течение 1 рабочего дня'],
                  ['Образование подтверждено', 'Диплом, сертификат или справка с курсов', 'Загрузите документ — виден только статус'],
                  ['Тестовое задание', 'Небольшая задача по вашему направлению', 'Около 40 минут, бесплатно'],
                  ['Практический кейс', 'Разбор реальной задачи в переписке', 'Назначим время с куратором'],
                ].map(([t, s, note], i) => (
                  <label key={t} className="card card--pad-sm" style={{ cursor: 'pointer' }}>
                    <div className="row g4" style={{ alignItems: 'flex-start' }}>
                      <input type="checkbox" defaultChecked={i < 2} style={{ marginTop: 3, accentColor: 'var(--accent)' }} />
                      <div className="stack g1 grow">
                        <strong className="t-sm">{t}</strong>
                        <span className="t-cap muted">{s}</span>
                        <span className="t-cap" style={{ color: 'var(--accent)' }}>{note}</span>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
              <div className="note note--accent"><Icon name="sparkle" size={16} />
                <span className="grow">Новым специалистам мы показываем проекты с пометкой «Можно junior» — там уже есть примеры, материалы и понятные требования.</span>
              </div>
            </>
          )}

          {step === 5 && (
            <>
              <div className="stack g2">
                <h2 className="t-h3">Профиль готов к работе</h2>
                <p className="t-sm muted">Дальше — поиск проектов по вашим навыкам. Отклик занимает пару минут, расчёт с комиссией виден сразу.</p>
              </div>
              <div className="card card--soft stack g4">
                <div className="kv-rows">
                  <div className="kv-row"><dt>Направления</dt><dd>{dirs.map((d) => directions.find((x) => x.id === d)?.name).join(', ') || '—'}</dd></div>
                  <div className="kv-row"><dt>Навыки</dt><dd>{sk.join(', ') || '—'}</dd></div>
                  <div className="kv-row"><dt>Уровень</dt><dd>{level}</dd></div>
                  <div className="kv-row"><dt>Работ в портфолио</dt><dd>{items.length}</dd></div>
                </div>
              </div>
              <div className="card card--pad-sm stack g3">
                <span className="t-micro muted">Что будет дальше</span>
                {[['Найти проекты', 'Фильтры по направлению, навыкам, бюджету и сроку', '/spec/projects'],
                  ['Посмотреть свой профиль', 'Так его видят заказчики', '/spec/profile'],
                  ['Как проходит сделка', 'Этапы, файлы, переписка и сдача работы', '/how']].map(([t, s, to]) => (
                  <button type="button" key={t} className="menu-item" onClick={() => finish(to)}>
                    <Icon name="arrowR" size={16} />
                    <span className="stack"><strong>{t}</strong><span className="t-cap muted" style={{ fontWeight: 400 }}>{s}</span></span>
                  </button>
                ))}
              </div>
            </>
          )}

          <div className="row between g3 wrap" style={{ borderTop: '1px solid var(--line)', paddingTop: 'var(--s5)' }}>
            <button type="button" className="btn btn--ghost" onClick={() => (step > 1 ? setStep(step - 1) : app.navigate('/signup'))} style={{ paddingLeft: 0 }}>
              {step > 1 ? '← Назад' : 'К регистрации'}
            </button>
            {step < 5
              ? <Btn variant="primary" disabled={step === 1 && dirs.length === 0} onClick={() => setStep(step + 1)}>Продолжить</Btn>
              : <div className="row g3"><Btn onClick={() => finish('/spec')}>В кабинет</Btn>
                <Btn variant="primary" onClick={() => finish('/spec/projects')}>Найти проекты</Btn></div>}
          </div>
        </div>
      </div>
    </main>
  );
}

export { SignIn, SignUp, OnboardingBusiness, OnboardingSpecialist, RoleToggle, AuthLayout };
