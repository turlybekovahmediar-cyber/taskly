import React, { useEffect, useState } from 'react';
import { Icon, useApp, Btn, Link, Field, Ph } from '../components/ui.jsx';
import { directions, skillsByDirection, spheres } from '../data/mock.js';
import { parseRoute } from '../lib/router.js';
import { shortName } from '../lib/format.js';
import { useSoon } from '../components/ui.jsx';
import { captchaToken, preloadCaptcha } from '../lib/captcha.js';
import { PASSWORD_RULE, passwordProblem } from './meta.jsx';

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

const OAUTH_ERRORS = {
  google: 'Не удалось войти через Google. Попробуйте ещё раз или войдите по email.',
  google_off: 'Вход через Google пока не настроен.',
  blocked: 'Аккаунт заблокирован. Напишите в поддержку.',
};

function GoogleButton({ role, label }) {
  const app = useApp();
  if (!app.config.google) return null;
  return (
    <>
      <a className="btn btn--lg btn--full" href={'/api/auth/google?role=' + role} style={{ gap: 'var(--s3)' }}>
        <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>
        {label}
      </a>
      <div className="row g3" style={{ alignItems: 'center' }}><div className="grow" style={{ height: 1, background: 'var(--line)' }} /><span className="t-cap muted">или</span><div className="grow" style={{ height: 1, background: 'var(--line)' }} /></div>
    </>
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

function SignIn() {
  const app = useApp();
  const [role, setRole] = useState('client');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState({});
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const oauthError = OAUTH_ERRORS[parseRoute(app.route).params.get('error')];
  useEffect(() => { preloadCaptcha(app.config.recaptchaSiteKey); }, [app.config.recaptchaSiteKey]);

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
      const res = await app.login({ email: v, password, role, captchaToken: await captchaToken(app.config.recaptchaSiteKey, 'login') });
      const r = res.user.role;
      app.navigate(r === 'client' ? '/biz' : '/spec');
      app.toast('Здравствуйте, ' + (r === 'client' ? res.user.business?.company || res.user.name : shortName(res.user.name)));
    } catch (ex) {
      setErr({ form: ex.message });
      setBusy(false);
    }
  };

  return (
    <AuthLayout title="Вход в Taskly" sub="Войдите, чтобы продолжить работу с проектами, откликами и сообщениями."
      side={
        <div className="stack g4">
          <div className="card card--pad-sm stack g3">
            <span className="t-micro muted">Один аккаунт — две роли</span>
            <span className="menu-item" style={{ cursor: 'default' }}><Icon name="briefcase" size={16} />Размещайте задачи как бизнес</span>
            <span className="menu-item" style={{ cursor: 'default' }}><Icon name="user" size={16} />Выполняйте проекты как специалист</span>
          </div>
          <div className="note"><Icon name="shield" size={16} /><span className="grow">Оплата резервируется до приёмки работы — исполнитель получает деньги только за принятый результат.</span></div>
        </div>
      }>
      <form className="stack g5" onSubmit={submit} noValidate>
        <RoleToggle value={role} onChange={setRole} />
        {(err.form || oauthError) && <div className="note note--stop" role="alert"><Icon name="alert" size={16} /><span className="grow">{err.form || oauthError}</span></div>}
        <GoogleButton role={role} label="Войти через Google" />
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
  useEffect(() => { preloadCaptcha(app.config.recaptchaSiteKey); }, [app.config.recaptchaSiteKey]);

  const next = async () => {
    const e = {};
    if (step === 1) {
      if (name.trim().length < 2) e.name = 'Укажите ' + (role === 'client' ? 'название компании' : 'имя');
      if (!EMAIL_RE.test(email.trim())) e.email = 'Введите корректный email, например name@company.kz';
    }
    if (step === 2) {
      if (passwordProblem(password)) e.password = PASSWORD_RULE;
    }
    setErr(e);
    if (Object.keys(e).length) return;
    if (step < 2) { setStep(step + 1); return; }
    setBusy(true);
    try {
      await app.register({ role, name: name.trim(), email: email.trim(), password, captchaToken: await captchaToken(app.config.recaptchaSiteKey, 'register') });
      app.navigate(role === 'client' ? '/onboarding/business' : '/onboarding/specialist');
      app.toast('Аккаунт создан');
    } catch (ex) {
      setBusy(false);
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
            <GoogleButton role={role} label="Зарегистрироваться через Google" />
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
            <Field label="Пароль" required hint={PASSWORD_RULE} error={err.password} id="su-pass">
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

function OnboardingBusiness() {
  const app = useApp();
  const [step, setStep] = useState(1);
  const [sphere, setSphere] = useState('Услуги для людей');
  const [tasks, setTasks] = useState([]);
  const [pays, setPays] = useState('Разово под конкретную задачу');
  const [site, setSite] = useState(app.business?.site || '');
  const toggle = (t) => setTasks((a) => (a.includes(t) ? a.filter((x) => x !== t) : [...a, t]));
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
