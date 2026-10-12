/* Taskly — публичные страницы: главная, для бизнеса, для специалистов. */
import React, { useState } from 'react';
import { Icon, useApp, Btn, Link, Tag, Badge, Money, FeeCalc, Avatar, Metric } from '../components/ui.jsx';
import { tasksamples, directions, specialists, OPEN_STATUSES } from '../data/mock.js';
import { money, ratingLabel, plural, daysLabel, W } from '../lib/format.js';

function SectionHead({ eyebrow, title, sub, right, narrow }) {
  return (
    <div className="row between wrap g6" style={{ alignItems: 'flex-end', marginBottom: 'var(--s10)' }}>
      <div className="stack g3" style={{ maxWidth: narrow ? 620 : 760 }}>
        {eyebrow && <span className="t-micro muted">{eyebrow}</span>}
        <h2 className="t-h2">{title}</h2>
        {sub && <p className="t-lg ink2">{sub}</p>}
      </div>
      {right}
    </div>
  );
}

/* Мини-карточка проекта — визуальный язык продукта, используется в hero. */
function PreviewCard() {
  return (
    <div className="card card--pad-lg stack g5" style={{ boxShadow: 'var(--sh-md)' }}>
      <div className="row between g4">
        <span className="status status--live">Идёт поиск исполнителя</span>
        <Tag tone="match">Совпадают 3 навыка</Tag>
      </div>
      <div className="stack g2">
        <h3 className="t-h4">Лендинг для студии маникюра</h3>
        <p className="t-sm ink2 clamp2">Одностраничный сайт: услуги, прайс, работы, кнопка записи в WhatsApp.</p>
      </div>
      <div className="tag-row">
        {['Figma', 'UI/UX', 'Лендинг'].map((s) => <Tag key={s}>{s}</Tag>)}
      </div>
      <div className="kv-rows">
        <div className="kv-row"><dt>Результат</dt><dd>Готовая страница + исходники</dd></div>
        <div className="kv-row"><dt>Срок</dt><dd>12 дней</dd></div>
        <div className="kv-row kv-row--total"><dt>Стоимость</dt><dd><Money value={100000} strong /></dd></div>
      </div>
      <div className="note note--ok" style={{ alignItems: 'center' }}>
        <Icon name="shield" size={16} />
        <span className="grow"><strong>Оплата зарезервирована до завершения проекта.</strong></span>
      </div>
    </div>
  );
}

/* ============================ Главная ============================ */
function HomePage() {
  const app = useApp();
  const steps = {
    business: [
      ['Опишите задачу', 'Своими словами, без технических категорий. Taskly соберёт из этого структурированное ТЗ.'],
      ['Получите отклики', 'Специалисты предлагают стоимость и срок. Видны навыки, портфолио и опыт.'],
      ['Работайте по условиям', 'Оплата зарезервирована. Результат принимается по ТЗ, правки — по числу из ТЗ.'],
    ],
    specialist: [
      ['Найдите задачу', 'Фильтры по направлению, навыкам, бюджету и сроку. Подборка по вашим навыкам.'],
      ['Отправьте отклик', 'Сразу видно, сколько вы получите после комиссии 5%. Без скрытых вычетов.'],
      ['Получите оплату', 'Заказчик принимает работу — деньги приходят вам. Отзыв остаётся в профиле.'],
    ],
  };

  return (
    <main>
      {/* Hero */}
      <section className="page" style={{ paddingTop: 'var(--s20)', paddingBottom: 'var(--s20)' }}>
        <div className="hero-grid">
          <div className="stack g6">
            <span className="t-micro muted">Биржа задач для бизнеса и начинающих специалистов</span>
            <h1 className="t-display">Цифровизация<br />вашего бизнеса<br />без переплат и рисков</h1>
            <p className="t-lg ink2" style={{ maxWidth: 540 }}>
              Taskly соединяет малый и средний бизнес с начинающими специалистами, студентами и junior-исполнителями.
              Задача описана понятно, условия зафиксированы, оплата зарезервирована до завершения работы.
            </p>
            <div className="row g3 wrap">
              <Btn variant="primary" size="lg" onClick={() => { if (app.role === 'guest') app.navigate('/signup?role=client'); else app.navigate('/biz/projects/new'); }}>
                Мне нужен специалист
              </Btn>
              <Btn size="lg" iconRight="arrowR" onClick={() => { if (app.role === 'guest') app.navigate('/signup?role=specialist'); else app.navigate('/spec/projects'); }}>
                Хочу выполнять проекты
              </Btn>
            </div>
            <p className="t-cap muted">Регистрация занимает минуту. Комиссия Taskly — 5% и только с успешно завершённого проекта.</p>
          </div>
          <PreviewCard />
        </div>
      </section>

      <hr className="hr" />

      {/* Как работает */}
      <section className="page sec">
        <SectionHead eyebrow="Как это работает" title="Три шага с каждой стороны"
          sub="Никаких сложных настроек и лишних экранов: задача → исполнитель → результат." />
        <div className="grid-2">
          {[['business', 'Для бизнеса', 'briefcase', '/business'], ['specialist', 'Для специалистов', 'user', '/specialists']].map(([k, title, icon, to]) => (
            <div className="card card--pad-lg stack g6" key={k}>
              <div className="row g3">
                <span className="badge badge--accent"><Icon name={icon} size={14} />{title}</span>
              </div>
              <div className="steps">
                {steps[k].map(([t, s], i) => (
                  <div className="step-item is-todo" key={t}>
                    <div className="step-mark"><div className="step-dot">{i + 1}</div><div className="step-line" /></div>
                    <div className="step-body stack g1">
                      <span className="step-title" style={{ color: 'var(--ink)', fontWeight: 600 }}>{t}</span>
                      <span className="step-sub">{s}</span>
                    </div>
                  </div>
                ))}
              </div>
              <Link to={to} className="btn btn--ghost" style={{ alignSelf: 'flex-start', paddingLeft: 0 }}>
                Подробнее {k === 'business' ? 'для бизнеса' : 'для специалистов'}<Icon name="arrowR" size={16} />
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Защита сделки */}
      <section style={{ background: 'var(--ink)', color: 'var(--ink-inv)', padding: 'var(--s24) 0' }}>
        <div className="page">
          <div className="stack g3" style={{ maxWidth: 700, marginBottom: 'var(--s12)' }}>
            <span className="t-micro" style={{ color: 'rgba(255,255,255,.55)' }}>Безопасная сделка</span>
            <h2 className="t-h2" style={{ color: '#fff' }}>Как Taskly защищает обе стороны</h2>
            <p className="t-lg" style={{ color: 'rgba(255,255,255,.72)' }}>
              Большинство проблем начинается не с навыков, а с неясных условий. Поэтому Taskly фиксирует их до старта работы.
            </p>
          </div>
          <div className="grid-4">
            {[
              ['book', 'Понятное ТЗ', 'Результат, объём работы и границы задачи описаны до начала. Расширить ТЗ можно только с подтверждения обеих сторон.'],
              ['shield', 'Защищённая оплата', 'Оплата зарезервирована до завершения проекта. Специалист видит, что деньги есть, заказчик — что платит за результат.'],
              ['calendar', 'Прозрачные сроки', 'Сроки и этапы согласованы заранее. Изменение срока проходит отдельным предложением, а не в переписке.'],
              ['star', 'Отзывы и репутация', 'После завершения обе стороны оставляют отзыв. Профиль показывает выполненные проекты и пунктуальность.'],
            ].map(([icon, t, s]) => (
              <div key={t} className="stack g3" style={{ borderTop: '1px solid rgba(255,255,255,.18)', paddingTop: 'var(--s5)' }}>
                <Icon name={icon} size={20} />
                <h3 className="t-h4" style={{ color: '#fff' }}>{t}</h3>
                <p className="t-sm" style={{ color: 'rgba(255,255,255,.68)' }}>{s}</p>
              </div>
            ))}
          </div>
          <div className="row g4 wrap" style={{ marginTop: 'var(--s12)' }}>
            <Link to="/security" className="btn btn--primary">Как работает оплата</Link>
            <Link to="/pricing" className="btn" style={{ background: 'transparent', border: '1px solid rgba(255,255,255,.3)', color: '#fff' }}>Комиссия 5% и расчёт</Link>
          </div>
        </div>
      </section>

      {/* Для бизнеса */}
      <section className="page sec">
        <div className="hero-grid">
          <div className="stack g6">
            <span className="t-micro muted">Для бизнеса</span>
            <h2 className="t-h2">Не нужно искать старшего специалиста или агентство</h2>
            <p className="t-lg ink2">
              Часть задач не оправдывает найм сотрудника. Опишите задачу своими словами — Taskly соберёт её в понятное ТЗ
              и покажет специалистов, которые с ней справятся.
            </p>
            <ul className="stack g4">
              {[
                ['Понятное ТЗ вместо переписки', 'Шесть простых вопросов превращаются в структурированное описание задачи.'],
                ['Отклики с ценой и сроком', 'Специалист предлагает стоимость, срок и релевантную работу из портфолио.'],
                ['Защищённая оплата', 'Средства резервируются до старта и передаются специалисту после приёмки.'],
                ['Контроль без микроменеджмента', 'Статусы, этапы и файлы в одном месте. Не нужно спрашивать «как дела» каждый день.'],
              ].map(([t, s]) => (
                <li key={t} className="row g3" style={{ alignItems: 'flex-start' }}>
                  <Icon name="check" size={18} style={{ color: 'var(--accent)', marginTop: 3 }} />
                  <div className="stack g1">
                    <span style={{ fontWeight: 550 }}>{t}</span>
                    <span className="t-sm muted">{s}</span>
                  </div>
                </li>
              ))}
            </ul>
            <div className="row g3 wrap">
              <Link to="/business" className="btn btn--secondary">Подробнее для бизнеса</Link>
              <Link to="/biz/projects/new" className="btn btn--ghost" style={{ paddingLeft: 0 }}>Создать проект<Icon name="arrowR" size={16} /></Link>
            </div>
          </div>
          <div className="card card--pad-lg stack g5" style={{ background: 'var(--surface-2)', borderColor: 'transparent' }}>
            <span className="t-micro muted">Итоговое ТЗ · как его видит заказчик</span>
            <div className="stack g2">
              <h3 className="t-h4">Telegram-бот для записи клиентов</h3>
              <p className="t-sm ink2">Клиент выбирает услугу, дату и время. Бот подтверждает запись и напоминает за 2 часа.</p>
            </div>
            <div className="card card--pad-sm stack g3" style={{ boxShadow: 'var(--sh-xs)' }}>
              <div className="kv-rows">
                <div className="kv-row"><dt>Входит в работу</dt><dd>Сценарий, бот, запись в таблицу, напоминания</dd></div>
                <div className="kv-row"><dt>Не входит</dt><dd>Онлайн-оплата, интеграция с CRM</dd></div>
                <div className="kv-row"><dt>Правки</dt><dd>2 круга, по ТЗ</dd></div>
              </div>
            </div>
            <div className="row g2 wrap">
              <Badge tone="ok" dot>Оплата зарезервирована</Badge>
              <Badge>Срок согласован: 3 недели</Badge>
            </div>
          </div>
        </div>
      </section>

      {/* Для специалистов */}
      <section style={{ background: 'var(--surface-2)', padding: 'var(--s24) 0' }}>
        <div className="page">
          <SectionHead eyebrow="Для специалистов"
            title="Опыт появляется на реальных задачах"
            sub="На Taskly можно начать без коммерческих кейсов: покажите учебные проекты, портфолио или пройдите тестовое задание." />
          <div className="grid-3">
            {[
              ['briefcase', 'Задачи, которые вам подходят', 'Двухуровневый поиск: направление и навыки. Проект помечается, если совпадают ваши навыки.'],
              ['wallet', 'Прозрачный расчёт', 'В каждом отклике видно: ваша цена, комиссия 5%, сумма к получению.'],
              ['star', 'Портфолио и отзывы', 'Каждый завершённый проект добавляется в историю и подтверждает навыки.'],
            ].map(([icon, t, s]) => (
              <div className="card stack g4" key={t}>
                <span className="empty-mark" style={{ margin: 0, width: 42, height: 42 }}><Icon name={icon} size={19} /></span>
                <h3 className="t-h4">{t}</h3>
                <p className="t-sm muted">{s}</p>
              </div>
            ))}
          </div>

          <div className="card card--pad-lg stack g6" style={{ marginTop: 'var(--s8)', boxShadow: 'var(--sh-sm)' }}>
            <div className="row between wrap g6">
              <div className="stack g2" style={{ maxWidth: 520 }}>
                <h3 className="t-h3">Пример отклика: сколько вы получите</h3>
                <p className="t-sm ink2">Расчёт виден до отправки отклика и повторяется в итоговом расчёте после завершения проекта.</p>
              </div>
              <div style={{ width: '100%', maxWidth: 400 }}><FeeCalc price={100000} /></div>
            </div>
          </div>

          <div className="grid-2" style={{ marginTop: 'var(--s8)' }}>
            <div className="card card--pad-lg stack g4">
              <h3 className="t-h4">Новым специалистам</h3>
              <p className="t-sm muted">Отсутствие выполненных проектов не значит, что человек ненадёжный. Мы показываем это честно: уровни, подтверждённые навыки и другой опыт.</p>
              <div className="row g2 wrap">
                <Tag>Учебные проекты</Tag><Tag>Личные кейсы</Tag><Tag>Тестовое задание</Tag><Tag>Подтверждение образования</Tag>
              </div>
            </div>
            <div className="card card--pad-lg stack g4">
              <h3 className="t-h4">Показатели, которые действительно полезны</h3>
              <div className="grid-2" style={{ gap: 'var(--s4)' }}>
                <Metric value="4" label="завершённых проекта" />
                <Metric value="100%" label="выполнено в срок" />
                <Metric value="4,9" label="средняя оценка" />
                <Metric value="3" label="отзыва" />
              </div>
              <p className="t-cap muted">Пример профиля. Цифры появляются только после реальных проектов на платформе.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Примеры задач */}
      <section className="page sec">
        <SectionHead narrow eyebrow="Примеры задач"
          title="Что размещают на Taskly"
          sub="Taskly — универсальная платформа. Это лишь примеры разных направлений, а не каталог услуг: размещать можно любую понятную задачу." />
        <div className="chips">
          {tasksamples.map((t) => <span className="chip" key={t} style={{ cursor: 'default' }}>{t}</span>)}
        </div>
        <div className="grid-3" style={{ marginTop: 'var(--s10)' }}>
          {['design', 'dev', 'analytics'].map((id) => {
            const d = directions.find((x) => x.id === id);
            const list = app.entities.projects.filter((p) => OPEN_STATUSES.includes(p.status) && !p.mine && p.directions.includes(id)).slice(0, 3);
            return (
              <div className="stack g4" key={id}>
                <div className="row between g3"><h3 className="t-h4">{d.name}</h3><Link to="/spec/projects" className="t-cap muted">Все проекты</Link></div>
                <div className="stack g3">
                  {list.map((p) => (
                    <Link key={p.id} to={'/spec/projects/' + p.id} className="card card--pad-sm card--link stack g2">
                      <span className="t-sm" style={{ fontWeight: 550 }}>{p.title}</span>
                      <span className="row g3 t-cap muted"><span>{daysLabel(p.days)}</span><span>·</span><span className="num">{money(p.price)}</span></span>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Финальный CTA */}
      <section className="page" style={{ paddingBottom: 'var(--s24)' }}>
        <div className="card card--pad-lg stack g8" style={{ background: 'var(--surface-2)', borderColor: 'transparent', textAlign: 'center', alignItems: 'center' }}>
          <div className="stack g3" style={{ maxWidth: 620, alignItems: 'center' }}>
            <h2 className="t-h2">Начните с одной задачи</h2>
            <p className="t-lg ink2">Опишите, что нужно сделать — Taskly поможет собрать ТЗ и найти исполнителя. Или найдите проект под свои навыки.</p>
          </div>
          <div className="row g3 wrap center">
            <Btn variant="primary" size="lg" onClick={() => app.navigate(app.role === 'guest' ? '/signup?role=client' : '/biz/projects/new')}>Мне нужен специалист</Btn>
            <Btn size="lg" onClick={() => app.navigate(app.role === 'guest' ? '/signup?role=specialist' : '/spec/projects')}>Хочу выполнять проекты</Btn>
          </div>
          <p className="t-cap muted">5% комиссии — только с успешно завершённого проекта. Оплата зарезервирована до приёмки работы.</p>
        </div>
      </section>
    </main>
  );
}

/* ============================ Для бизнеса ============================ */
function BusinessPage() {
  const app = useApp();
  const faq = [
    ['Что если исполнитель пропадёт?', 'Если специалист перестал отвечать, откройте обращение в поддержку из рабочего пространства проекта. Оплата остаётся зарезервированной, а не уходит исполнителю: мы помогаем заменить исполнителя или вернуть средства.'],
    ['Кто пишет ТЗ?', 'Вы описываете задачу своими словами, Taskly собирает структуру, а специалист подтверждает условия. Если специалист видит неясность, он задаёт вопрос до старта.'],
    ['Можно ли добавить работу в процессе?', 'Да, через «Предложить изменение задачи». Если объём меняется, специалист предложит новую стоимость и срок. Изменение вступает в силу только после подтверждения обеими сторонами.'],
    ['Нужно ли платить вперёд?', 'Да, стоимость резервируется до старта работы. Это защита для обеих сторон: специалист видит, что деньги есть, а заказчик платит за принятый результат.'],
    ['Можно ли нанять одного специалиста на несколько задач?', 'Да. Договоритесь о повторном проекте прямо из рабочего пространства или пригласите специалиста в новый проект.'],
  ];
  return (
    <main>
      <section className="page" style={{ paddingTop: 'var(--s20)', paddingBottom: 'var(--s16)' }}>
        <div className="stack g6" style={{ maxWidth: 760 }}>
          <span className="t-micro muted">Для бизнеса</span>
          <h1 className="t-h1">Задачи, для которых не нужен новый сотрудник</h1>
          <p className="t-lg ink2">
            Наём специалиста и агентство — не всегда разумное решение. Taskly помогает найти человека под конкретную
            задачу, зафиксировать условия и не тратить время на постоянный контроль.
          </p>
          <div className="row g3 wrap">
            <Link to="/biz/projects/new" className="btn btn--primary btn--lg">Создать проект</Link>
            <Link to="/biz/specialists" className="btn btn--lg">Найти специалиста</Link>
          </div>
        </div>
      </section>

      <section className="page" style={{ paddingBottom: 'var(--s16)' }}>
        <div className="grid-2">
          <div className="card card--pad-lg stack g6">
            <h2 className="t-h3">Что вы получаете</h2>
            <ul className="stack g5">
              {[
                ['Понятное ТЗ вместо переписки', 'Шесть вопросов — и у вас структурированное описание: результат, состав работы, материалы, срок, бюджет, правки.'],
                ['Отклики, которые можно сравнить', 'Цена, срок, навыки, портфолио и короткое предложение — в одной карточке.'],
                ['Оплата зарезервирована до приёмки', 'Средства списываются с вашей карты и резервируются платёжной системой. Выплата — после подтверждения результата.'],
                ['Один экран на весь проект', 'Статус, ТЗ, этапы, файлы и переписка. Без таблиц, чатов в мессенджерах и потерянных файлов.'],
              ].map(([t, s]) => (
                <li className="row g3" key={t} style={{ alignItems: 'flex-start' }}>
                  <Icon name="check" size={18} style={{ color: 'var(--accent)', marginTop: 3 }} />
                  <div className="stack g1"><span style={{ fontWeight: 550 }}>{t}</span><span className="t-sm muted">{s}</span></div>
                </li>
              ))}
            </ul>
          </div>
          <div className="stack g5">
            <div className="card card--pad-lg stack g4">
              <h3 className="t-h4">Оплата и комиссия</h3>
              <p className="t-sm ink2">Вы оплачиваете согласованную стоимость проекта. Комиссия Taskly 5% удерживается со специалиста после успешного завершения сделки — скрытых доплат для бизнеса нет.</p>
              <div className="note"><Icon name="info" size={16} /><span className="grow">Стоимость проекта: <strong>100 000 ₸</strong>. Вы платите 100 000 ₸, специалист получает 95 000 ₸.</span></div>
            </div>
            <div className="card card--pad-lg stack g4">
              <h3 className="t-h4">Сроки и правки по ТЗ</h3>
              <p className="t-sm ink2">Число кругов правок указано в ТЗ. Если нужно больше — это отдельное согласование, а не бесконечные доработки.</p>
              <div className="row g2 wrap">
                <Badge>2 круга правок по ТЗ</Badge>
                <Badge tone="ok" dot>Срок фиксируется</Badge>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section style={{ background: 'var(--surface-2)', padding: 'var(--s16) 0' }}>
        <div className="page">
          <SectionHead narrow eyebrow="Путь заказчика" title="От задачи до принятого результата" />
          <div className="grid-4">
            {[['Опишите задачу', 'Своими словами, в свободной форме.'],
              ['Соберите ТЗ', 'Пошаговый мастер превращает описание в структуру.'],
              ['Выберите исполнителя', 'Сравните отклики и подтвердите условия.'],
              ['Примите работу', 'Результат → приёмка или правка → выплата.']].map(([t, s], i) => (
              <div className="stack g3" key={t}>
                <span className="step-dot">{i + 1}</span>
                <h3 className="t-h4">{t}</h3>
                <p className="t-sm muted">{s}</p>
              </div>
            ))}
          </div>
          <div className="row g3 wrap" style={{ marginTop: 'var(--s10)' }}>
            <Link to="/biz/projects/new" className="btn btn--primary">Создать проект</Link>
            <Link to="/how" className="btn btn--ghost">Как это работает целиком</Link>
          </div>
        </div>
      </section>

      <section className="page sec">
        <SectionHead narrow title="Частые вопросы бизнеса" />
        <div className="stack g3" style={{ maxWidth: 860 }}>
          {faq.map(([q, a]) => <Accordion key={q} q={q} a={a} />)}
        </div>
      </section>

      <section className="page" style={{ paddingBottom: 'var(--s24)' }}>
        <div className="card card--pad-lg row between wrap g6" style={{ alignItems: 'center' }}>
          <div className="stack g2">
            <h2 className="t-h3">Первая задача — самая простая</h2>
            <p className="t-sm muted">Опишите её своими словами. Дальше Taskly подскажет шаги.</p>
          </div>
          <Btn variant="primary" size="lg" onClick={() => app.navigate('/biz/projects/new')}>Создать проект</Btn>
        </div>
      </section>
    </main>
  );
}

function Accordion({ q, a, defaultOpen }) {
  const [open, setOpen] = useState(!!defaultOpen);
  return (
    <div className="card card--pad-sm" style={{ padding: 0, overflow: 'hidden' }}>
      <button type="button" className="row between g4" style={{ width: '100%', background: 'none', border: 0, padding: 'var(--s5)', cursor: 'pointer', textAlign: 'left' }}
        onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <span style={{ fontWeight: 550, fontSize: 'var(--fs-body)' }}>{q}</span>
        <Icon name="chevD" size={18} style={{ color: 'var(--ink-3)', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .16s ease' }} />
      </button>
      {open && <p className="t-sm ink2" style={{ padding: '0 var(--s5) var(--s5)', maxWidth: 720 }}>{a}</p>}
    </div>
  );
}

/* ============================ Для специалистов ============================ */
function SpecialistsPage() {
  const app = useApp();
  const s = specialists[0];
  return (
    <main>
      <section className="page" style={{ paddingTop: 'var(--s20)', paddingBottom: 'var(--s16)' }}>
        <div className="hero-grid">
          <div className="stack g6">
            <span className="t-micro muted">Для специалистов</span>
            <h1 className="t-h1">Первые коммерческие проекты — без опыта в резюме</h1>
            <p className="t-lg ink2">
              Taskly создана в том числе для студентов и junior-специалистов. Покажите учебные проекты, личные кейсы или
              пройдите тестовое задание — и получайте реальные задачи с понятным ТЗ и защищённой оплатой.
            </p>
            <div className="row g3 wrap">
              <Link to="/signup?role=specialist" className="btn btn--primary btn--lg">Создать профиль</Link>
              <Link to="/spec/projects" className="btn btn--lg">Найти проекты</Link>
            </div>
          </div>
          <div className="card card--pad-lg stack g5" style={{ boxShadow: 'var(--sh-md)' }}>
            <div className="row g4">
              <Avatar person={s} size="lg" />
              <div className="stack g1 grow">
                <div className="row g2 wrap"><strong>{s.name}</strong><Badge tone="info" dot>{s.levelName}</Badge></div>
                <span className="t-cap muted">{s.headline} · {s.city}</span>
              </div>
            </div>
            <div className="tag-row">{s.skills.map((k) => <Tag key={k}>{k}</Tag>)}</div>
            <hr className="hr" />
            <div className="grid-2" style={{ gap: 'var(--s4)' }}>
              <Metric value={s.completed} label={plural(s.completed, ['завершённый проект', 'завершённых проекта', 'завершённых проектов'])} />
              <Metric value={s.onTime + '%'} label="выполнено в срок" />
              <Metric value={ratingLabel(s.rating)} label="средняя оценка" />
              <Metric value={s.reviews} label={plural(s.reviews, W.review)} />
            </div>
            <div className="note"><Icon name="info" size={16} /><span className="grow">{s.verifiedVia.join(' · ')}</span></div>
          </div>
        </div>
      </section>

      <section className="page" style={{ paddingBottom: 'var(--s16)' }}>
        <div className="grid-3">
          {[
            ['briefcase', 'Реальные задачи, а не тестовые полигоны', 'Проекты размещает бизнес с конкретной потребностью. Результат используется в работе заказчика.'],
            ['wallet', 'Понятный расчёт до отклика', 'В форме отклика сразу видно: ваша цена, комиссия 5%, сумма к получению.'],
            ['layers', 'Репутация, которую можно показать', 'Завершённые проекты, отзывы и подтверждённые навыки собираются в профиль.'],
            ['book', 'Понятное ТЗ', 'Вы видите объём работы, границы задачи и число правок до того, как согласитесь.'],
            ['shield', 'Уверенность в оплате', 'Оплата зарезервирована до завершения проекта — деньги уже на стороне сделки.'],
            ['star', 'Развитие навыков', 'Разные направления и уровни сложности: от небольшой таблицы до небольшого сервиса.'],
          ].map(([icon, t, s2]) => (
            <div className="card stack g4" key={t}>
              <span className="empty-mark" style={{ margin: 0, width: 42, height: 42 }}><Icon name={icon} size={19} /></span>
              <h3 className="t-h4">{t}</h3>
              <p className="t-sm muted">{s2}</p>
            </div>
          ))}
        </div>
      </section>

      <section style={{ background: 'var(--surface-2)', padding: 'var(--s16) 0' }}>
        <div className="page">
          <SectionHead narrow eyebrow="Уровни и верификация" title="Статус не ярлык, а способ вызвать доверие"
            sub="Уровни не уменьшают доступ к проектам. Они показывают заказчику, на что вы можете опираться: портфолио, образование, тестовое задание или выполненные проекты." />
          <div className="grid-3">
            {[
              ['Новый специалист', 'Нет коммерческих проектов на платформе. Показаны учебные проекты, портфолио или пройденное тестовое задание.'],
              ['Проверенный специалист', 'Подтверждено портфолио или образование. Есть завершённые проекты и отзывы на платформе.'],
              ['Опытный на Taskly', 'Несколько завершённых проектов, стабильные отзывы, высокая доля работ, сданных в срок.'],
            ].map(([t, s2], i) => (
              <div className="card stack g4" key={t}>
                <Badge tone={i === 0 ? undefined : i === 1 ? 'info' : 'ok'} dot>{['Level 1 · New', 'Level 2 · Verified', 'Level 3 · Experienced'][i]}</Badge>
                <h3 className="t-h4">{t}</h3>
                <p className="t-sm muted">{s2}</p>
              </div>
            ))}
          </div>
          <div className="note" style={{ marginTop: 'var(--s8)', maxWidth: 780 }}>
            <Icon name="info" size={16} />
            <span className="grow">Отсутствие проектов не означает, что специалист ненадёжный. В профиле это указано прямо, а не спрятано за пустыми блоками.</span>
          </div>
        </div>
      </section>

      <section className="page sec">
        <SectionHead narrow title="Как считаются деньги" sub="Пример на проекте 100 000 ₸. Комиссия удерживается один раз, после успешного завершения проекта." />
        <div className="grid-2" style={{ alignItems: 'start' }}>
          <FeeCalc price={100000} />
          <div className="card card--pad-lg stack g5">
            <h3 className="t-h4">Что входит в комиссию 5%</h3>
            <ul className="stack g4">
              {[
                'Резервирование оплаты и выплата после приёмки работы',
                'Разбор спорных ситуаций с участием поддержки',
                'Фиксация ТЗ и изменений, чтобы объём не менялся «по ходу»',
                'История проектов, отзывы и подтверждённые навыки в профиле',
              ].map((t) => (
                <li className="row g3" key={t} style={{ alignItems: 'flex-start' }}>
                  <Icon name="check" size={17} style={{ color: 'var(--accent)', marginTop: 3 }} /><span className="t-sm ink2 grow">{t}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="page" style={{ paddingBottom: 'var(--s24)' }}>
        <div className="card card--pad-lg row between wrap g6" style={{ alignItems: 'center' }}>
          <div className="stack g2">
            <h2 className="t-h3">Посмотрите, какие задачи открыты сейчас</h2>
            <p className="t-sm muted">Можно начать с фильтра по своим навыкам — регистрация не обязательна для просмотра.</p>
          </div>
          <div className="row g3 wrap">
            <Btn variant="primary" onClick={() => app.navigate('/spec/projects')}>Найти проекты</Btn>
            <Btn onClick={() => app.navigate(app.role === 'guest' ? '/signup?role=specialist' : '/spec/profile/edit')}>Создать профиль</Btn>
          </div>
        </div>
      </section>
    </main>
  );
}

export { HomePage, BusinessPage, SpecialistsPage, SectionHead, Accordion, PreviewCard };
