/* Taskly — общие страницы: как это работает, безопасность, комиссия, FAQ, поддержка,
 юридические тексты, уведомления, настройки, UI-kit и карта продукта. */
import React, { useState } from 'react';
import { Icon, useApp, Btn, Link, Field, Tag, Badge, StatusPill, Avatar, Modal, Empty, Skel, Ph, Money, FeeCalc, SafeNote, Rail, Metric, Tabs, Stars } from '../components/ui.jsx';
import { AppShell } from '../components/shell.jsx';
import { Accordion, SectionHead } from './public.jsx';
import { statuses, directions, skills, specialists } from '../data/mock.js';
import { money } from '../lib/format.js';
import { navigate as nav, parseRoute } from '../lib/router.js';

/* ============================ Как это работает ============================ */
function HowPage() {
  const app = useApp();
  const [side, setSide] = useState('business');
  const flow = {
    business: [
      ['Опишите задачу', 'Отвечаете на шесть простых вопросов своими словами. Не нужно разбираться в категориях и терминах.'],
      ['Получаете структурированное ТЗ', 'Taskly собирает описание задачи, ожидаемый результат, состав работы, материалы, срок, бюджет и число правок.'],
      ['Сравниваете отклики', 'В каждом отклике: цена, срок, навыки, релевантная работа из портфолио и короткое предложение.'],
      ['Подтверждаете условия', 'Вы и исполнитель подтверждаете одно и то же ТЗ. До этого момента оплата не списывается.'],
      ['Резервируете оплату', 'Стоимость списывается с карты и резервируется платёжной системой до завершения проекта.'],
      ['Работаете по этапам', 'Обзор, ТЗ, этапы, файлы и переписка в одном рабочем пространстве.'],
      ['Принимаете результат', 'Принять работу или запросить правку. Число правок указано в ТЗ.'],
      ['Оставляете отзыв', 'После приёмки проект завершается, оплата передаётся исполнителю, вы можете оставить отзыв.'],
    ],
    specialist: [
      ['Создаёте профиль', 'Даже без коммерческих проектов: подойдут учебные работы, личные кейсы, тестовое задание или подтверждение образования.'],
      ['Указываете навыки', 'Направления нужны для навигации, навыки — для точного подбора. В проектах появляется метка «Совпадают N навыка».'],
      ['Находите проекты', 'Фильтры по направлению, навыкам, бюджету, сроку, уровню сложности и формату работы. Есть вкладки «Подходит мне» и «Сохранённые».'],
      ['Отправляете отклик', 'Цена, срок, короткое сообщение и похожая работа из портфолио. Сразу видно, сколько вы получите после комиссии 5%.'],
      ['Подтверждаете условия', 'Получаете приглашение, проверяете ТЗ и границы задачи, подтверждаете срок и стоимость.'],
      ['Работаете в проекте', 'Этапы, файлы, переписка. Заказчик видит прогресс без микроменеджмента.'],
      ['Сдаёте результат', 'Загружаете файлы и комментарий. Заказчик принимает работу или просит правку по ТЗ.'],
      ['Получаете выплату', 'Оплата приходит за вычетом комиссии 5%. Отзыв появляется в профиле и в истории проектов.'],
    ],
  };
  return (
    <main>
      <section className="page sec-md">
        <div className="stack g6" style={{ maxWidth: 660 }}>
          <span className="t-micro muted">Как это работает</span>
          <h1 className="t-h1">Полный путь от первой задачи до выплаты</h1>
          <p className="t-lg ink2">Одна и та же механика работает для обеих сторон: понятное ТЗ, подтверждённые условия, зарезервированная оплата и результат, который принимается по описанию, а не «на глаз».</p>
        </div>
      </section>

      <section className="page" style={{ paddingBottom: 'var(--s16)' }}>
        <div className="card card--pad-lg stack g8">
          <div className="row between wrap g4">
            <div className="btn-group">
              <button type="button" aria-pressed={side === 'business'} onClick={() => setSide('business')}>Путь бизнеса</button>
              <button type="button" aria-pressed={side === 'specialist'} onClick={() => setSide('specialist')}>Путь специалиста</button>
            </div>
            <Btn variant="ghost" onClick={() => app.navigate(side === 'business' ? '/biz/projects/new' : '/spec/projects')}>
              Пройти путь в демо<Icon name="arrowR" size={16} />
            </Btn>
          </div>

          <div className="grid-2" style={{ gap: 'var(--s8)' }}>
            <div className="steps">
              {flow[side].slice(0, 4).map(([t, s], i) => (
                <div className="step-item is-todo" key={t}>
                  <div className="step-mark"><div className="step-dot">{i + 1}</div><div className="step-line" /></div>
                  <div className="step-body stack g1"><span className="step-title" style={{ color: 'var(--ink)', fontWeight: 600 }}>{t}</span><span className="step-sub">{s}</span></div>
                </div>
              ))}
            </div>
            <div className="steps">
              {flow[side].slice(4).map(([t, s], i) => (
                <div className="step-item is-todo" key={t}>
                  <div className="step-mark"><div className="step-dot">{i + 5}</div><div className="step-line" /></div>
                  <div className="step-body stack g1"><span className="step-title" style={{ color: 'var(--ink)', fontWeight: 600 }}>{t}</span><span className="step-sub">{s}</span></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section style={{ background: 'var(--surface-2)', padding: 'var(--s16) 0' }}>
        <div className="page">
          <SectionHead narrow eyebrow="Статусы проекта" title="Семь понятных статусов вместо десятков технических"
            sub="Статус всегда виден и заказчику, и специалисту — не нужно спрашивать «на каком этапе мы»." />
          <div className="grid-4">
            {Object.entries(statuses).map(([k, v]) => (
              <div className="card stack g3" key={k}>
                <StatusPill id={k} />
                <span className="t-cap muted">{{
                  published: 'Проект опубликован и виден в поиске',
                  searching: 'Специалисты рассматривают проект и отправляют отклики',
                  awaiting_payment: 'Исполнитель выбран, ждём резервирования оплаты',
                  in_work: 'Работа идёт, оплата зарезервирована',
                  on_review: 'Результат отправлен, заказчик проверяет',
                  needs_fix: 'Заказчик запросил правку по ТЗ',
                  done: 'Работа принята, выплата оформлена',
                }[k]}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="page sec">
        <div className="grid-2" style={{ alignItems: 'start' }}>
          <div className="card card--pad-lg stack g5">
            <div className="row g3"><Icon name="lock" size={18} /><h2 className="t-h3">Что нельзя сделать «в переписке»</h2></div>
            <div className="stack g4">
              {[['Дописать требования после старта', 'Заказчик не может просто добавить работу. Нужно «Предложить изменение задачи».'],
                ['Изменить стоимость в одностороннем порядке', 'Новая цена и срок вступают в силу только после подтверждения обеими сторонами.'],
                ['Считать правкой новую работу', 'Правка — исправление по ТЗ. Всё, что выходит за границы, оформляется отдельным изменением.'],
                ['Забрать оплату до приёмки', 'Специалист получает деньги только после того, как заказчик примет результат.']].map(([t, s]) => (
                <div className="row g3" key={t} style={{ alignItems: 'flex-start' }}>
                  <Icon name="x" size={16} style={{ color: 'var(--stop)', marginTop: 3 }} />
                  <div className="stack g1"><span className="t-sm" style={{ fontWeight: 550 }}>{t}</span><span className="t-cap muted">{s}</span></div>
                </div>
              ))}
            </div>
          </div>
          <div className="stack g5">
            <ModelTz />
            <ModelChange />
          </div>
        </div>
      </section>
    </main>
  );
}

/* Переиспользуемые модели — показываем механику ТЗ и изменений */
function ModelTz() {
  return (
    <div className="card card--pad-lg stack g4">
      <div className="row between g3"><h3 className="t-h4">Модель ТЗ</h3><Badge tone="ok" dot>Подтверждают обе стороны</Badge></div>
      <div className="kv-rows">
        {[['Название проекта', 'Короткое и понятное'], ['Описание задачи', 'Своими словами, без терминов'],
          ['Ожидаемый результат', 'Что считается выполненной работой'], ['Что входит в работу', 'Список пунктов'],
          ['Что не входит', 'Защита от разных ожиданий'], ['Материалы', 'Что даёт заказчик'],
          ['Срок', 'Желаемый или фиксированный дедлайн'], ['Стоимость', 'Согласованная сумма'],
          ['Правки', '1–3 круга или без правок'], ['Этапы', 'Если задача крупная'], ['Дополнительные условия', 'Формат и требования']].map(([k, v]) => (
          <div className="kv-row" key={k}><dt>{k}</dt><dd style={{ color: 'var(--ink-3)', fontWeight: 400 }}>{v}</dd></div>
        ))}
      </div>
    </div>
  );
}

function ModelChange() {
  return (
    <div className="card card--pad-lg stack g4">
      <h3 className="t-h4">Модель изменения задачи</h3>
      <div className="stack g4">
        {[['Предложение', 'Любая сторона описывает изменение и указывает новую стоимость и срок.'],
          ['Оценка второй стороной', 'Видно обоснование: почему объём стал больше.'],
          ['Подтверждение', 'Только после подтверждения обеими сторонами условия сделки обновляются.'],
          ['Отклонение', 'Если предложение отклонено — объём и цена остаются прежними.']].map(([t, s], i) => (
          <div className="row g4" key={t} style={{ alignItems: 'flex-start' }}>
            <span className="step-dot">{i + 1}</span>
            <div className="stack g1"><span className="t-sm" style={{ fontWeight: 550 }}>{t}</span><span className="t-cap muted">{s}</span></div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ============================ Безопасность сделки ============================ */
function SecurityPage() {
  const app = useApp();
  return (
    <main>
      <section className="page sec-md">
        <div className="stack g6" style={{ maxWidth: 680 }}>
          <span className="t-micro muted">Безопасная сделка</span>
          <h1 className="t-h1">Оплата, которая ждёт результата</h1>
          <p className="t-lg ink2">Taskly не хранит деньги на банковском счёте. Оплата проходит через платёжную систему и резервируется до завершения проекта: специалист видит, что средства есть, а заказчик платит за принятый результат.</p>
          <SafeNote amount={100000} />
        </div>
      </section>

      <section className="page" style={{ paddingBottom: 'var(--s16)' }}>
        <div className="card card--pad-lg stack g8">
          <div className="stack g6">
            <h2 className="t-h3">Как проходит оплата</h2>
            <div className="grid-4">
              {[['Заказчик подтверждает условия', 'Резервирование запускается только после того, как обе стороны согласились с ТЗ.'],
                ['Оплата резервируется', 'Сумма списывается с карты заказчика через платёжную систему и резервируется до завершения проекта.'],
                ['Работа идёт по этапам', 'Средства остаются зарезервированными на всех этапах. Исполнитель не получает их заранее.'],
                ['Выплата после приёмки', 'Заказчик принимает результат — оплата передаётся специалисту за вычетом комиссии 5%.']].map(([t, s], i) => (
                <div className="stack g3" key={t} style={{ borderTop: '1px solid var(--line)', paddingTop: 'var(--s5)' }}>
                  <span className="step-dot">{i + 1}</span>
                  <span className="t-sm" style={{ fontWeight: 600 }}>{t}</span>
                  <span className="t-cap muted">{s}</span>
                </div>
              ))}
            </div>
          </div>
          <hr className="hr" />
          <div className="grid-2" style={{ gap: 'var(--s8)' }}>
            <div className="stack g4">
              <h3 className="t-h4">Если исполнитель пропал или результат не тот</h3>
              <div className="stack g4">
                {[['Открыть обращение в поддержку', 'Прямо из рабочего пространства проекта — с ТЗ, файлами и перепиской.'],
                  ['Средства остаются зарезервированными', 'Пока идёт разбор, деньги не уходят ни одной из сторон.'],
                  ['Решение по ситуации', 'Помогаем заменить исполнителя или оформить возврат средств заказчику.'],
                  ['Итог фиксируется в истории', 'Результат разбора виден в проекте, чтобы обе стороны понимали, что произошло.']].map(([t, s]) => (
                  <div className="row g3" key={t} style={{ alignItems: 'flex-start' }}>
                    <Icon name="check" size={17} style={{ color: 'var(--accent)', marginTop: 3 }} />
                    <div className="stack g1"><span className="t-sm" style={{ fontWeight: 550 }}>{t}</span><span className="t-cap muted">{s}</span></div>
                  </div>
                ))}
              </div>
            </div>
            <div className="stack g4">
              <h3 className="t-h4">Если требования меняются на ходу</h3>
              <p className="t-sm ink2">После старта заказчик не может незаметно расширить задачу. Действует один механизм — «Предложить изменение задачи»:</p>
              <div className="card card--soft stack g3">
                <div className="kv-rows">
                  <div className="kv-row"><dt>Было в ТЗ</dt><dd>Сценарий диалога</dd></div>
                  <div className="kv-row"><dt>Предложено добавить</dt><dd>Перенос записи</dd></div>
                  <div className="kv-row"><dt>Стоимость</dt><dd><Money value={180000} /> → <Money value={205000} /></dd></div>
                  <div className="kv-row"><dt>Срок</dt><dd>3 недели → 25 дней</dd></div>
                </div>
                <div className="row g2 wrap"><Badge tone="warn">Ожидает подтверждения</Badge><Badge>Вступит в силу после согласия обеих сторон</Badge></div>
              </div>
              <p className="t-cap muted">Если вторая сторона не подтверждает изменение, проект продолжается на прежних условиях.</p>
            </div>
          </div>
        </div>
      </section>

      <section style={{ background: 'var(--ink)', color: '#fff', padding: 'var(--s16) 0' }}>
        <div className="page stack g8">
          <div className="stack g3" style={{ maxWidth: 640 }}>
            <h2 className="t-h2" style={{ color: '#fff' }}>Доверие строится не на обещаниях</h2>
            <p className="t-lg" style={{ color: 'rgba(255,255,255,.72)' }}>Мы не показываем отзывы из других источников и не рисуем статистику. Репутация формируется только из проектов, завершённых на Taskly.</p>
          </div>
          <div className="grid-3">
            {[['Ответственность исполнителя', 'Проценты выполнения в срок и успешность считаются по реальным проектам. Если данных мало — стоит прочерк, а не выдуманное число.'],
              ['Ответственность заказчика', 'Заказчик тоже получает отзывы: понятное ТЗ, быстрые ответы и оплата в срок влияют на то, с кем захотят работать специалисты.'],
              ['Честность к новым специалистам', 'Отсутствие проектов отображается прямо, а не маскируется. Уровни показывают, на что можно опираться: портфолио, образование, тестовое задание.']].map(([t, s]) => (
              <div className="stack g3" key={t} style={{ borderTop: '1px solid rgba(255,255,255,.18)', paddingTop: 'var(--s5)' }}>
                <h3 className="t-h4" style={{ color: '#fff' }}>{t}</h3>
                <p className="t-sm" style={{ color: 'rgba(255,255,255,.7)' }}>{s}</p>
              </div>
            ))}
          </div>
          <div className="row g3 wrap">
            <Link to="/how" className="btn" style={{ background: 'transparent', border: '1px solid rgba(255,255,255,.3)', color: '#fff' }}>Как это работает</Link>
            <Link to="/support" className="btn btn--primary">Обратиться в поддержку</Link>
          </div>
        </div>
      </section>
    </main>
  );
}

/* ============================ Комиссия ============================ */
function PricingPage() {
  const app = useApp();
  const [price, setPrice] = useState(100000);
  return (
    <main>
      <section className="page sec-md">
        <div className="stack g6" style={{ maxWidth: 660 }}>
          <span className="t-micro muted">Комиссия</span>
          <h1 className="t-h1">5% с успешно завершённого проекта</h1>
          <p className="t-lg ink2">Комиссия удерживается со специалиста один раз — после того, как заказчик примет работу. Для бизнеса стоимость проекта не увеличивается: доплат и скрытых сборов нет.</p>
        </div>
      </section>

      <section className="page" style={{ paddingBottom: 'var(--s16)' }}>
        <div className="grid-2" style={{ alignItems: 'start', gap: 'var(--s8)' }}>
          <div className="card card--pad-lg stack g6">
            <div className="stack g2">
              <h2 className="t-h3">Посчитайте на своём примере</h2>
              <p className="t-sm muted">Этот же расчёт виден в форме отклика и в итоговом расчёте после завершения проекта.</p>
            </div>
            <Field label="Стоимость проекта">
              <div className="affix">
                <input className="input input--num" type="number" step="5000" value={price}
                  onChange={(e) => setPrice(Math.max(0, Number(e.target.value) || 0))} />
                <span className="suffix">₸</span>
              </div>
            </Field>
            <div className="row g2 wrap">
              {[45000, 60000, 100000, 180000, 260000].map((v) => (
                <button key={v} className={'chip' + (price === v ? ' is-on' : '')} onClick={() => setPrice(v)}>{money(v)}</button>
              ))}
            </div>
            <FeeCalc price={price} />
          </div>

          <div className="stack g5">
            <div className="card card--pad-lg stack g4">
              <h3 className="t-h4">Что входит в комиссию</h3>
              <ul className="stack g3">
                {['Резервирование оплаты через платёжную систему и выплата после приёмки',
                  'Рабочее пространство: ТЗ, этапы, файлы и переписка',
                  'Механика изменений условий с подтверждением обеими сторонами',
                  'Поддержка при спорных ситуациях и помощь с заменой исполнителя',
                  'История проектов, отзывы и подтверждённые навыки в профиле'].map((t) => (
                  <li className="row g3" key={t} style={{ alignItems: 'flex-start' }}>
                    <Icon name="check" size={16} style={{ color: 'var(--accent)', marginTop: 3 }} /><span className="t-sm ink2 grow">{t}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="card card--pad-lg stack g4">
              <h3 className="t-h4">Когда комиссия не удерживается</h3>
              <div className="stack g3">
                {[['Проект не состоялся', 'Оплата не резервировалась — удерживать нечего.'],
                  ['Заказчик не принял работу', 'Средства возвращаются заказчику, специалисту комиссия не начисляется.'],
                  ['Отклик отправлен, но вас не выбрали', 'Отклик и переписка бесплатны — комиссия только с завершённой сделки.']].map(([t, s]) => (
                  <div className="stack g1" key={t}><span className="t-sm" style={{ fontWeight: 550 }}>{t}</span><span className="t-cap muted">{s}</span></div>
                ))}
              </div>
            </div>
            <div className="note note--accent"><Icon name="sparkle" size={16} />
              <span className="grow">В будущем появятся дополнительные возможности — продвижение проекта или профиля, инструменты для бизнеса. Основная модель остаётся прежней: 5% с успешно завершённых сделок.</span></div>
          </div>
        </div>
      </section>

      <section style={{ background: 'var(--surface-2)', padding: 'var(--s16) 0' }}>
        <div className="page">
          <SectionHead narrow title="Прозрачно для обеих сторон" />
          <div className="grid-3">
            {[['Специалист видит расчёт до отклика', '«Ваша цена — Комиссия Taskly 5% — Вы получите». Ничего не появляется задним числом.'],
              ['Бизнес платит согласованную стоимость', 'Резервируется ровно та сумма, которая указана в ТЗ и подтверждена сторонами.'],
              ['Итоговый расчёт после приёмки', 'Специалист видит сумму, комиссию и дату зачисления в разделе «Выплаты» и в истории проектов.']].map(([t, s]) => (
              <div className="card stack g3" key={t}>
                <span className="empty-mark" style={{ margin: 0, width: 42, height: 42 }}><Icon name="wallet" size={19} /></span>
                <h3 className="t-h4">{t}</h3>
                <p className="t-sm muted">{s}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

/* ============================ FAQ ============================ */
function FaqPage() {
  const app = useApp();
  const [q, setQ] = useState('');
  const groups = [
    { h: 'Общее', items: [
      ['Что такое Taskly?', 'Платформа, которая соединяет малый и средний бизнес с начинающими специалистами: студентами и junior-исполнителями. Бизнес размещает понятную задачу, специалист выполняет её и получает оплату.'],
      ['Кто может размещать задачи?', 'Компании и предприниматели с конкретной задачей. Ограничений по сфере нет: Taskly — универсальная площадка, а не каталог услуг по одной нише.'],
      ['Кто может выполнять проекты?', 'Начинающие специалисты, студенты и junior-исполнители. Коммерческого опыта может не быть — подойдут учебные работы, личные кейсы и тестовое задание.'],
    ]},
    { h: 'Стоимость', items: [
      ['Сколько стоит использование Taskly?', 'Комиссия Taskly составляет 5% и удерживается со специалиста после успешно завершённого проекта. Для бизнеса стоимость проекта не увеличивается.'],
      ['Когда списывается комиссия?', 'Один раз, после того как заказчик принял работу. До этого момента удержаний нет.'],
      ['Есть ли плата за отклик или публикацию?', 'Нет. Публикация проекта и отклики бесплатны — комиссия берётся только с завершённой сделки.'],
    ]},
    { h: 'Оплата и безопасность', items: [
      ['Как работает зарезервированная оплата?', 'После подтверждения условий стоимость списывается с карты заказчика через платёжную систему и резервируется до завершения проекта. Специалист получает деньги после приёмки результата.'],
      ['Хранит ли Taskly мои деньги?', 'Нет. Платежи проходят через платёжную систему. Taskly выступает стороной сделки, которая фиксирует условия и момент передачи оплаты.'],
      ['Что делать, если исполнитель пропал?', 'Откройте обращение в поддержку прямо из рабочего пространства проекта. Средства останутся зарезервированными, мы поможем заменить исполнителя или оформить возврат.'],
      ['Что если результат не соответствует ТЗ?', 'Используйте «Запросить правку» — правки по ТЗ входят в согласованное число кругов. Если расхождение серьёзное, обращайтесь в поддержку.'],
    ]},
    { h: 'ТЗ и изменения', items: [
      ['Почему нельзя просто дописать требования?', 'Именно так возникают споры. Изменение объёма оформляется через «Предложить изменение задачи»: новая стоимость и срок подтверждаются обеими сторонами.'],
      ['Чем правка отличается от новой работы?', 'Правка — исправление того, что не соответствует ТЗ. Новая работа или расширение объёма — это изменение задачи, оно требует новой оценки.'],
      ['Сколько правок обычно включают?', 'От одного до трёх кругов. Точное число указывается в ТЗ и подтверждается на старте проекта.'],
    ]},
    { h: 'Для специалистов', items: [
      ['Обязательно ли иметь коммерческий опыт?', 'Нет. Новым специалистам доступны проекты с пометкой «Можно junior», где есть материалы и понятные требования. Профиль можно собрать из учебных работ.'],
      ['Как подтвердить навыки?', 'Портфолио, образование, тестовое задание, практический кейс или завершённые проекты на платформе. Верификация не обязательна для откликов.'],
      ['Как понять, сколько я получу?', 'В форме отклика виден расчёт: ваша цена, комиссия Taskly 5% и сумма к получению. Итоговый расчёт появляется после завершения проекта.'],
    ]},
  ];
  const filtered = groups.map((g) => ({ ...g, items: g.items.filter(([a, b]) => !q || (a + b).toLowerCase().includes(q.toLowerCase())) })).filter((g) => g.items.length);

  return (
    <main>
      <section className="page sec-md">
        <div className="stack g6" style={{ maxWidth: 660 }}>
          <span className="t-micro muted">FAQ</span>
          <h1 className="t-h1">Частые вопросы</h1>
          <p className="t-lg ink2">Если ответа нет — напишите в поддержку: обращение привязывается к проекту, объяснять заново не нужно.</p>
          <input className="input input--search" placeholder="Поиск по вопросам" value={q} onChange={(e) => setQ(e.target.value)} style={{ maxWidth: 420 }} />
        </div>
      </section>

      <section className="page" style={{ paddingBottom: 'var(--s20)' }}>
        <div className="stack g10" style={{ maxWidth: 880 }}>
          {filtered.length === 0 ? (
            <div className="card"><Empty icon="search" title="Ничего не найдено"
              text="Попробуйте сформулировать вопрос иначе или посмотрите разделы «Как это работает» и «Безопасная сделка»."
              action={<Btn variant="primary" onClick={() => nav('/support')}>Написать в поддержку</Btn>}
              secondary={<Btn variant="ghost" onClick={() => setQ('')}>Сбросить поиск</Btn>} /></div>
          ) : filtered.map((g) => (
            <div className="stack g4" key={g.h}>
              <h2 className="t-h3">{g.h}</h2>
              <div className="stack g3">{g.items.map(([a, b]) => <Accordion key={a} q={a} a={b} />)}</div>
            </div>
          ))}
          <div className="card card--pad-lg row between wrap g5" style={{ alignItems: 'center' }}>
            <div className="stack g2"><h3 className="t-h4">Не нашли ответ?</h3>
              <p className="t-sm muted">Поддержка отвечает в течение рабочего дня. Обращение можно привязать к конкретному проекту.</p></div>
            <Btn variant="primary" onClick={() => nav('/support')}>Обратиться в поддержку</Btn>
          </div>
        </div>
      </section>
    </main>
  );
}

/* ============================ Поддержка ============================ */
function SupportPage() {
  const app = useApp();
  const [tab, setTab] = useState('new');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [topic, setTopic] = useState('Вопрос по оплате');
  const [who, setWho] = useState(app.role);
  const [text, setText] = useState('');
  const [err, setErr] = useState('');
  const myProjects = app.role === 'client' ? app.entities.projects.filter((p) => p.mine) : app.role === 'specialist' ? app.entities.projects.filter((p) => p.specialistId === app.me.id) : [];
  const [proj, setProj] = useState(myProjects[0]?.id || 'none');
  const actions = app.role === 'guest' ? null : <Btn icon="briefcase" onClick={() => app.navigate(app.role === 'client' ? '/biz' : '/spec')}>Мои проекты</Btn>;

  const send = () => {
    if (text.trim().length < 10) { setErr('Опишите ситуацию хотя бы парой предложений.'); return; }
    setErr(''); setBusy(true); setTimeout(() => { setBusy(false); setSent(true); setText(''); }, 800);
  };

  return (
    <main>
      <section className="page sec-md">
        <div className="stack g6" style={{ maxWidth: 660 }}>
          <span className="t-micro muted">Поддержка</span>
          <h1 className="t-h1">Мы разбираемся вместе с вами</h1>
          <p className="t-lg ink2">Спорные ситуации решаются не «по словам», а по ТЗ, файлам, этапам и переписке проекта. Поэтому обращение лучше создавать из рабочего пространства.</p>
        </div>
      </section>

      <section className="page" style={{ paddingBottom: 'var(--s20)' }}>
        <div className="shell-2">
          <div className="stack g5 panel--sticky">
            <div className="card card--pad-lg stack g4">
              <h3 className="t-h4">Быстрые действия</h3>
              {[['Проект не двигается', 'Исполнитель или заказчик не отвечает больше двух дней'],
                ['Результат не соответствует ТЗ', 'Работа сдана, но расходится с описанием'],
                ['Спор по правкам', 'Стороны по-разному понимают, что считается правкой'],
                ['Вопрос по оплате и выплате', 'Когда придёт выплата, почему резерв не израсходован']].map(([t, s], i) => (
                <button className="menu-item" key={t} style={{ alignItems: 'flex-start' }}
                  onClick={() => { setTopic(t); setTab('new'); window.scrollTo({ top: 300 }); }}>
                  <Icon name="arrowR" size={16} style={{ marginTop: 3 }} />
                  <span className="stack"><strong>{t}</strong><span className="t-cap muted" style={{ fontWeight: 400 }}>{s}</span></span>
                </button>
              ))}
            </div>
            <div className="card card--pad-lg stack g3">
              <h3 className="t-h4">Время ответа</h3>
              <div className="kv-rows">
                <div className="kv-row"><dt>Обычные обращения</dt><dd>в течение рабочего дня</dd></div>
                <div className="kv-row"><dt>Спор по оплате</dt><dd>в течение 4 рабочих часов</dd></div>
                <div className="kv-row"><dt>Языки</dt><dd>Русский, қазақша</dd></div>
              </div>
            </div>
          </div>

          <div className="stack g5">
            <div className="card card--pad-lg stack g6" style={{ maxWidth: 720 }}>
              {sent ? (
                <>
                  <div className="note note--ok"><Icon name="check" size={16} />
                    <span className="grow"><strong>Обращение создано.</strong> Номер t-2484. Ответ придёт в уведомления и в раздел «История обращений».</span></div>
                  <div className="kv-rows">
                    <div className="kv-row"><dt>Тема</dt><dd>{topic}</dd></div>
                    <div className="kv-row"><dt>Проект</dt><dd>{myProjects.find((p) => p.id === proj)?.title || 'Без привязки к проекту'}</dd></div>
                    <div className="kv-row"><dt>Статус</dt><dd><Badge tone="warn" dot>В работе</Badge></dd></div>
                  </div>
                  <div className="row g3 wrap"><Btn onClick={() => setSent(false)}>Создать ещё обращение</Btn><Btn variant="ghost" onClick={() => document.getElementById('support-history')?.scrollIntoView({ behavior: 'smooth' })}>История обращений</Btn></div>
                </>
              ) : (
                <>
                  <div className="stack g2">
                    <h3 className="t-h4">Создать обращение</h3>
                    <p className="t-sm muted">Если вы вошли в аккаунт, обращение можно привязать к проекту — тогда поддержка сразу увидит ТЗ, файлы и переписку.</p>
                  </div>
                  <Field label="Кто вы" hint="Это влияет на то, какие решения мы можем предложить">
                    <div className="row g3 wrap">
                      {[['Я заказчик', 'client'], ['Я специалист', 'specialist'], ['Пока без аккаунта', 'guest']].map(([l, v]) => (
                        <button type="button" key={v} aria-pressed={who === v} className={'chip' + (who === v ? ' is-on' : '')} onClick={() => setWho(v)}>{l}</button>
                      ))}
                    </div>
                  </Field>
                  <Field label="С каким проектом связан вопрос">
                    <select className="select" value={proj} onChange={(e) => setProj(e.target.value)} aria-label="Проект">
                        {myProjects.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
                        <option value="none">Общий вопрос, без привязки к проекту</option>
                      </select>
                  </Field>
                  <Field label="Тема обращения" required>
                    <select className="select" value={topic} onChange={(e) => setTopic(e.target.value)}>
                      {['Вопрос по оплате', 'Проект не двигается', 'Результат не соответствует ТЗ', 'Спор по правкам',
                        'Требуют работу вне ТЗ', 'Как считается комиссия', 'Другое'].map((t) => <option key={t}>{t}</option>)}
                    </select>
                  </Field>
                  <Field label="Опишите ситуацию" required error={err} hint="Что произошло, что уже сделано и какой результат вы ожидаете" id="sup-text">
                    <textarea id="sup-text" className="textarea" style={{ minHeight: 150 }} value={text} onChange={(e) => setText(e.target.value)} data-invalid={!!err} />
                  </Field>
                  <div className="drop stack g3 center">
                    <Icon name="upload" size={20} />
                    <div className="stack g1"><strong className="t-sm" style={{ color: 'var(--ink)' }}>Прикрепите файлы или скриншоты</strong>
                      <span>PNG, JPG, PDF · до 25 МБ</span></div>
                    <Btn variant="secondary" size="sm" onClick={() => app.toast('Вложения появятся после подключения сервера')}>Выбрать файлы</Btn>
                  </div>
                  <label className="check"><input type="checkbox" defaultChecked />
                    <span><strong>Показывать мою переписку по проекту</strong>Помогает быстрее разобраться: поддержка увидит контекст, а не только описание.</span></label>
                  <Btn variant="primary" size="lg" onClick={send} disabled={busy}>
                    {busy ? <><span className="spin" /> Отправляем…</> : 'Отправить обращение'}
                  </Btn>
                </>
              )}
            </div>

            <div className="card card--flush stack" style={{ maxWidth: 720 }} id="support-history">
              <div className="row between g4" style={{ padding: 'var(--s4) var(--s5)', borderBottom: '1px solid var(--line)' }}>
                <h3 className="t-h4">История обращений</h3><span className="t-cap muted">1 обращение</span>
              </div>
              <div className="rows">
                <div className="row-item" style={{ cursor: 'default' }}>
                  <span className="avatar"><Icon name="help" size={16} /></span>
                  <span className="stack g1 grow" style={{ minWidth: 0 }}>
                    <span className="t-sm">Уточнение по срокам</span>
                    <span className="t-cap muted">t-2481 · Telegram-бот для записи клиентов · 26 сентября</span>
                  </span>
                  <Badge tone="ok" dot>Закрыто</Badge>
                  <Icon name="chevR" size={16} className="chev" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

/* ============================ Уведомления ============================ */
function NotificationsPage() {
  const app = useApp();
  const role = app.role === 'specialist' ? 'specialist' : 'client';
  const list = app.emptyMode ? [] : app.entities.notifications.filter((n) => n.role === role);
  const [tab, setTab] = useState(() => (list.some((n) => n.unread) ? 'unread' : 'all'));
  const shown = tab === 'unread' ? list.filter((n) => n.unread) : list;
  const unread = list.filter((n) => n.unread).length;

  const kindIcon = { delivery: 'upload', proposal: 'chat', stage: 'layers', payment: 'wallet', invite: 'briefcase', message: 'chat', match: 'sparkle', payout: 'wallet', change: 'swap' };
  const kindLabel = { delivery: 'Сдача работы', proposal: 'Новый отклик', stage: 'Этап проекта', payment: 'Оплата', invite: 'Приглашение', message: 'Сообщение', match: 'Подходящий проект', payout: 'Выплата', change: 'Изменение задачи' };

  return (
    <AppShell wide title="Уведомления" sub="Только то, что касается ваших проектов, откликов и выплат."
      actions={<>
        <Btn variant="ghost" disabled={!unread} onClick={() => { app.readAllNotifications(role); app.toast('Все уведомления прочитаны'); }}>Отметить все прочитанными</Btn>
        <Btn icon="settings" onClick={() => app.navigate('/settings?tab=notify')}>Настройки уведомлений</Btn>
      </>}>
      <div className="stack g5">
        <Tabs value={tab} onChange={setTab} items={[
          { id: 'unread', label: 'Непрочитанные', count: unread },
          { id: 'all', label: 'Все', count: list.length },
        ]} />
        {shown.length === 0 ? (
          <div className="card">
            <Empty icon="bell" title={tab === 'unread' ? 'Непрочитанных уведомлений нет' : 'Уведомлений пока нет'}
              text={tab === 'unread' ? 'Здесь появятся новые события: отклики, сдача работы, ответы заказчиков и выплаты.' : 'Как только появятся события по проектам и откликам, вы увидите их здесь.'}
              action={tab === 'unread' && list.length ? <Btn onClick={() => setTab('all')}>Показать все</Btn> : <Btn variant="primary" onClick={() => app.navigate(role === 'specialist' ? '/spec/projects' : '/biz/projects')}>{role === 'specialist' ? 'Найти проекты' : 'Мои проекты'}</Btn>} />
          </div>
        ) : (
          <div className="card card--flush">
            <div className="rows">
              {shown.map((n) => (
                <button type="button" key={n.id} className={'row-item' + (n.unread ? ' is-unread' : '')}
                  onClick={() => { app.readNotification(n.id); app.navigate(n.to); }}>
                  {n.unread && <i className="row-dot" aria-label="Не прочитано" />}
                  <span className="avatar"><Icon name={kindIcon[n.kind] || 'bell'} size={16} /></span>
                  <span className="stack g1 grow" style={{ minWidth: 0 }}>
                    <span className="t-sm" style={{ fontWeight: n.unread ? 600 : 500 }}>{n.text}</span>
                    <span className="t-cap muted">{kindLabel[n.kind] || 'Событие'} · {n.when}</span>
                  </span>
                  <Icon name="chevR" size={17} className="chev" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

/* ============================ Настройки ============================ */
function SettingsPage() {
  const app = useApp();
  const initialTab = parseRoute(app.route).params.get('tab');
  const [tab, setTab] = useState(['account', 'notify', 'payment', 'security'].includes(initialTab) ? initialTab : 'account');
  const isClient = app.role === 'client';
  const [channels, setChannels] = useState(['В кабинете', 'Email']);
  return (
    <AppShell wide title="Настройки" sub="Аккаунт, уведомления, оплата и безопасность."
      actions={<Btn variant="primary" onClick={() => app.toast('Настройки сохранены')}>Сохранить</Btn>}>
      <div className="shell-2">
        <div className="stack g5 panel--sticky">
          <div className="card card--pad-lg stack g4">
            <h3 className="t-h4">Кабинет</h3>
            <div className="stack g3">
              {[['client', 'briefcase', 'Бизнес (заказчик)'], ['specialist', 'user', 'Специалист'], ['guest', 'logout', 'Гость (без входа)']].map(([id, icon, l]) => (
                <button key={id} className="menu-item" onClick={() => { app.setRole(id); app.toast('Роль переключена: ' + l); }}>
                  <Icon name={icon} size={16} /><span className="grow">{l}</span>{app.role === id && <Badge tone="accent">Текущая</Badge>}
                </button>
              ))}
            </div>
            <p className="t-cap muted">Один аккаунт может быть и заказчиком, и специалистом. В демо-аккаунтах переключение открывает второй демо-аккаунт, чтобы пройти сделку с обеих сторон.</p>
          </div>
          <div className="card card--pad-lg stack g3">
            <h3 className="t-h4">Защита сделки</h3>
            <p className="t-cap muted">Оплата зарезервирована до завершения проекта. Выплата — после приёмки результата за вычетом комиссии 5%.</p>
            <Link to="/security" className="t-cap" style={{ color: 'var(--accent)' }}>Как это работает →</Link>
          </div>
        </div>

        <div className="stack g5">
          <Tabs value={tab} onChange={setTab} items={[
            { id: 'account', label: 'Аккаунт' },
            { id: 'notify', label: 'Уведомления' },
            { id: 'payment', label: 'Оплата и выплаты' },
            { id: 'security', label: 'Безопасность' },
          ]} />

          {tab === 'account' && (
            <>
              <div className="card card--pad-lg stack g6">
                <h3 className="t-h4">Основное</h3>
                <div className="grid-2" style={{ gap: 'var(--s5)' }}>
                  <Field label={isClient ? 'Название компании' : 'Имя и фамилия'}>
                    <input key={app.role} className="input" defaultValue={isClient ? app.bizName : app.me.name} /></Field>
                  <Field label="Email" hint="Используется для входа и уведомлений">
                    <input key={app.role} className="input" type="email" defaultValue={app.user?.email || ''} /></Field>
                  <Field label="Телефон"><input className="input" defaultValue="+7 707 000 00 00" /></Field>
                  <Field label="Язык интерфейса"><select className="select" defaultValue="Русский"><option>Русский</option><option>Қазақша</option></select></Field>
                </div>
                <div className="row g3 wrap" style={{ borderTop: '1px solid var(--line)', paddingTop: 'var(--s5)' }}>
                  <Btn variant="danger" onClick={() => app.toast('В демо удаление аккаунта недоступно')}>{isClient ? 'Удалить аккаунт компании' : 'Удалить аккаунт'}</Btn>
                  <span className="t-cap muted" style={{ alignSelf: 'center' }}>Аккаунт нельзя удалить, пока есть активные проекты.</span>
                </div>
              </div>
              <div className="card card--pad-lg stack g5">
                <h3 className="t-h4">Публичность</h3>
                <label className="switch"><input type="checkbox" defaultChecked />Показывать профиль в поиске</label>
                <label className="switch"><input type="checkbox" defaultChecked />Разрешить писать мне напрямую</label>
                {!isClient && <label className="switch"><input type="checkbox" />Скрывать количество завершённых проектов</label>}
              </div>
            </>
          )}

          {tab === 'notify' && (
            <div className="card card--pad-lg stack g6">
              <h3 className="t-h4">Какие уведомления присылать</h3>
              <div className="stack g2">
                {[['Новые отклики на проект', true], ['Сдача работы и запрос правки', true], ['Изменения условий проекта', true],
                  ['Сообщения по проекту', true], ['Напоминания о сроках', true], ['События по оплате и выплатам', true],
                  ['Новые подходящие проекты', true, 'только специалистам'], ['Подборка похожих задач раз в неделю', false],
                  ['Новости и обновления платформы', false]].map(([t, on, note]) => (
                  <div className="row between g4" key={t} style={{ padding: 'var(--s3) 0', borderBottom: '1px solid var(--line)' }}>
                    <span className="stack g1"><span className="t-sm">{t}</span>{note && <span className="t-cap muted">{note}</span>}</span>
                    <label className="switch"><input type="checkbox" defaultChecked={on} /><span className="sr">Вкл</span></label>
                  </div>
                ))}
              </div>
              <Field label="Куда присылать" hint="Дублирование в email удобно, если вы редко заходите в кабинет">
                <div className="row g3 wrap">
                  {['В кабинете', 'Email', 'Push', 'Telegram'].map((c) => <button type="button" key={c} aria-pressed={channels.includes(c)} className={'chip' + (channels.includes(c) ? ' is-on' : '')} onClick={() => setChannels(channels.includes(c) ? channels.filter((x) => x !== c) : [...channels, c])}>{c}</button>)}
                </div>
              </Field>
            </div>
          )}

          {tab === 'payment' && (
            <>
              <div className="card card--pad-lg stack g6">
                <h3 className="t-h4">{isClient ? 'Способ оплаты' : 'Способ получения выплат'}</h3>
                <div className="stack g3">
                  {isClient ? (
                    <>
                      <label className="card card--pad-sm row g4 card--active" style={{ cursor: 'pointer', padding: 'var(--s4)' }}>
                        <Icon name="card" size={18} />
                        <span className="stack g1 grow"><strong className="t-sm">Банковская карта</strong><span className="t-cap muted">Visa · 4111 •••• 8842 · истекает 08/29</span></span>
                        <Badge tone="accent">По умолчанию</Badge>
                      </label>
                      <button type="button" onClick={() => app.toast('Добавление способов оплаты появится после подключения платёжного провайдера')} className="card card--pad-sm row g4 card--link" style={{ textAlign: 'left', padding: 'var(--s4)' }}>
                        <Icon name="plus" size={18} />
                        <span className="stack g1 grow"><strong className="t-sm">Добавить способ оплаты</strong><span className="t-cap muted">Карта, счёт на компанию</span></span>
                      </button>
                    </>
                  ) : (
                    <>
                      <label className="card card--pad-sm row g4 card--active" style={{ cursor: 'pointer', padding: 'var(--s4)' }}>
                        <Icon name="card" size={18} />
                        <span className="stack g1 grow"><strong className="t-sm">Карта 4404 •••• 9121</strong><span className="t-cap muted">Выплаты приходят в течение 1–2 рабочих дней после приёмки</span></span>
                        <Badge tone="accent">По умолчанию</Badge>
                      </label>
                      <button type="button" onClick={() => app.toast('Добавление способов оплаты появится после подключения платёжного провайдера')} className="card card--pad-sm row g4 card--link" style={{ textAlign: 'left', padding: 'var(--s4)' }}>
                        <Icon name="plus" size={18} />
                        <span className="stack g1 grow"><strong className="t-sm">Добавить счёт или банк</strong><span className="t-cap muted">Для получения выплат на ИП или ТОО</span></span>
                      </button>
                    </>
                  )}
                </div>
              </div>
              <div className="card card--pad-lg stack g5">
                <h3 className="t-h4">Комиссия Taskly</h3>
                <div className="kv-rows" style={{ maxWidth: 480 }}>
                  <div className="kv-row"><dt>Размер комиссии</dt><dd>5%</dd></div>
                  <div className="kv-row"><dt>С кого удерживается</dt><dd>Со специалиста</dd></div>
                  <div className="kv-row"><dt>Когда удерживается</dt><dd>После успешного завершения проекта</dd></div>
                  <div className="kv-row"><dt>Для заказчика</dt><dd>Дополнительных сборов нет</dd></div>
                </div>
                <FeeCalc price={100000} />
              </div>
              {isClient && (
                <div className="card card--pad-lg stack g5">
                  <h3 className="t-h4">История платежей</h3>
                  <div className="rows">
                    {app.entities.projects.filter((p) => p.mine && p.paid).map((p) => [p.title, p.agreedPrice ?? p.price, p.status === 'done' ? 'Выплачено исполнителю' : 'Зарезервировано', p.status === 'done' ? 'ok' : 'warn']).map(([t, v, st, tone]) => (
                      <div className="row-item" key={t} style={{ cursor: 'default' }}>
                        <span className="avatar"><Icon name="wallet" size={16} /></span>
                        <span className="stack g1 grow"><span className="t-sm">{t}</span><span className="t-cap muted num">{money(v)}</span></span>
                        <Badge tone={tone} dot>{st}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {tab === 'security' && (
            <>
              <div className="card card--pad-lg stack g6">
                <h3 className="t-h4">Вход и защита</h3>
                <div className="grid-2" style={{ gap: 'var(--s5)' }}>
                  <Field label="Пароль" hint="Обновляйте раз в полгода"><Btn icon="lock" onClick={() => app.toast('Смена пароля появится после подключения сервера')}>Изменить пароль</Btn></Field>
                  <Field label="Двухэтапная проверка" hint="Код в SMS при входе с нового устройства">
                    <label className="switch"><input type="checkbox" /><span className="t-sm">Включить</span></label>
                  </Field>
                </div>
              </div>
              <div className="card card--pad-lg stack g4">
                <h3 className="t-h4">Где вы вошли</h3>
                <div className="rows">
                  {[['Chrome · macOS', 'Алматы · сейчас', true], ['Safari · iPhone', 'Алматы · 3 дня назад', false]].map(([d, w, cur]) => (
                    <div className="row-item" key={d} style={{ cursor: 'default' }}>
                      <span className="avatar"><Icon name="user" size={16} /></span>
                      <span className="stack g1 grow"><span className="t-sm">{d}</span><span className="t-cap muted">{w}</span></span>
                      {cur ? <Badge tone="ok" dot>Текущая сессия</Badge> : <Btn size="sm" variant="ghost" onClick={() => app.toast('Сеанс завершён')}>Завершить</Btn>}
                    </div>
                  ))}
                </div>
              </div>
              <div className="card card--pad-lg stack g4">
                <h3 className="t-h4">Документы</h3>
                <Link to="/terms" className="menu-item"><Icon name="book" size={16} />Условия использования</Link>
                <Link to="/privacy" className="menu-item"><Icon name="lock" size={16} />Политика конфиденциальности</Link>
                <Link to="/security" className="menu-item"><Icon name="shield" size={16} />Безопасная сделка и оплата</Link>
              </div>
            </>
          )}
        </div>
      </div>
    </AppShell>
  );
}

/* ============================ Юридические страницы ============================ */
function LegalPage({ kind }) {
  const isTerms = kind === 'terms';
  return (
    <AppShell wide={false} title={isTerms ? 'Условия использования' : 'Политика конфиденциальности'}
      sub={isTerms ? 'Правила работы платформы Taskly для заказчиков и специалистов.' : 'Какие данные мы собираем, зачем и как долго храним.'}
      crumbs={[{ label: 'Главная', to: '/' }, { label: isTerms ? 'Условия использования' : 'Политика конфиденциальности' }]}>
      <div className="shell-2">
        <div className="stack g2 panel--sticky">
          <div className="side-label">Разделы</div>
          {(isTerms ? ['Общие положения', 'Регистрация и роли', 'Комиссия и расчёты', 'Резервирование оплаты', 'ТЗ и изменения', 'Правки и приёмка', 'Отзывы и репутация', 'Запрещённые действия', 'Споры']
            : ['Какие данные мы собираем', 'Зачем они нужны', 'Передача третьим лицам', 'Хранение и удаление', 'Cookies и аналитика', 'Ваши права', 'Контакты']).map((s, i) => (
            <button key={s} className="side-item" onClick={() => {
              const el = document.getElementById('sec-' + i);
              if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 90, behavior: 'smooth' });
            }}>{s}</button>
          ))}
        </div>

        <div className="stack g8" style={{ maxWidth: 'var(--w-text)' }}>
          <div className="note"><Icon name="info" size={16} />
            <span className="grow">Черновик документа для демонстрации интерфейса. Текст не является юридически обязывающим и перед запуском требует проверки юристом.</span></div>

          {(isTerms ? [
            ['Общие положения', 'Taskly — платформа, которая соединяет заказчиков задач и специалистов-исполнителей. Платформа предоставляет интерфейс для описания задач, поиска исполнителей, согласования условий, обмена файлами и расчётов. Договор на выполнение работы заключается между заказчиком и специалистом; Taskly выступает площадкой, обеспечивающей механику сделки.'],
            ['Регистрация и роли', 'Пользователь регистрируется как бизнес (заказчик) или как специалист. Один аккаунт может переключать роль, но активные проекты привязаны к роли, в которой они созданы. Пользователь отвечает за достоверность данных профиля, включая сведения о навыках, образовании и портфолио.'],
            ['Комиссия и расчёты', 'Комиссия Taskly составляет 5% от стоимости успешно завершённого проекта и удерживается со специалиста в момент выплаты. Заказчик оплачивает согласованную стоимость проекта без дополнительной комиссии платформы. Комиссия не начисляется, если проект не завершён или результат не принят.'],
            ['Резервирование оплаты', 'Перед началом работы заказчик резервирует оплату через платёжную систему. Taskly не хранит средства на собственном банковском счёте: резервирование и выплаты обеспечиваются платёжным провайдером. Выплата специалисту производится после подтверждения результата заказчиком.'],
            ['ТЗ и изменения', 'Стороны подтверждают техническое задание до начала работы. Изменение объёма работы, стоимости или сроков оформляется через функцию «Предложить изменение задачи» и вступает в силу только после подтверждения обеими сторонами. Изменения, изложенные только в переписке, не считаются согласованными.'],
            ['Правки и приёмка', 'Количество кругов правок определяется ТЗ. Правкой считается исправление результата до соответствия ТЗ. Новая работа оформляется как изменение задачи. Заказчик обязан рассмотреть результат и принять его или запросить правку в разумный срок; при отсутствии реакции платформа направляет напоминание.'],
            ['Отзывы и репутация', 'Отзывы публикуются только по проектам, завершённым на платформе. Отзывы не удаляются, но на них можно ответить. Показатели надёжности рассчитываются по фактическим проектам; при недостатке данных отображается прочерк.'],
            ['Запрещённые действия', 'Запрещено: выводить расчёты за пределы платформы для обхода комиссии, публиковать задачи, требующие бесплатного выполнения большого объёма работы как «тестового», размещать недостоверные данные о навыках или компании, использовать платформу для незаконного контента и деятельности.'],
            ['Споры', 'При спорной ситуации стороны могут открыть обращение в поддержку. Разбор ведётся по данным проекта: ТЗ, файлам, этапам, переписке и истории изменений. До решения спора зарезервированные средства не передаются ни одной из сторон.'],
          ] : [
            ['Какие данные мы собираем', 'Данные аккаунта (имя или название компании, email, телефон, язык интерфейса), данные профиля специалиста (навыки, направления, портфолио, сведения об образовании), данные проектов (ТЗ, файлы, переписка, этапы, история изменений) и платёжные данные в объёме, необходимом для резервирования и выплаты.'],
            ['Зачем они нужны', 'Чтобы обеспечить работу платформы: показывать подходящие проекты и специалистов, фиксировать условия сделки, проводить расчёты, уведомлять о событиях проекта и разбирать спорные ситуации.'],
            ['Передача третьим лицам', 'Мы не продаём персональные данные. Ограниченная передача возможна платёжному провайдеру для проведения расчётов, а также сервисам уведомлений. Данные проекта доступны только сторонам сделки и поддержке при обращении.'],
            ['Хранение и удаление', 'Данные проектов хранятся в течение срока, необходимого для расчётов и разбора возможных споров. При удалении аккаунта данные профиля удаляются; сведения о завершённых сделках сохраняются в объёме, необходимом для отчётности.'],
            ['Cookies и аналитика', 'Мы используем технические cookies для входа и сохранения состояния интерфейса. Аналитические данные собираются в обезличенном виде: какие разделы востребованы и где пользователи испытывают затруднения.'],
            ['Ваши права', 'Вы можете запросить доступ к своим данным, исправить их, отозвать согласие на информационные рассылки и запросить удаление аккаунта. Ограничения возможны, пока есть активные проекты или незакрытые расчёты.'],
            ['Контакты', 'По вопросам данных напишите в поддержку из аккаунта — обращение автоматически содержит нужный контекст. По вопросам обработки данных мы отвечаем в течение нескольких рабочих дней.'],
          ]).map(([t, s], i) => (
            <div className="stack g3" key={t} id={'sec-' + i}>
              <h2 className="t-h4">{t}</h2>
              <p className="t-sm ink2">{s}</p>
            </div>
          ))}

          <hr className="hr" />
          <div className="row g3 wrap">
            <Link to={isTerms ? '/privacy' : '/terms'} className="btn btn--secondary">{isTerms ? 'Политика конфиденциальности' : 'Условия использования'}</Link>
            <Link to="/faq" className="btn btn--ghost">Частые вопросы</Link>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

/* ============================ UI-kit ============================ */
function UiKitPage() {
  const app = useApp();
  const [chip, setChip] = useState('Figma');
  const [tab, setTab] = useState('all');
  const [modal, setModal] = useState(false);
  const swatches = [
    ['--bg', '#FAF8F5', 'Основной фон · warm off-white'], ['--surface', '#FFFFFF', 'Карточки и панели'],
    ['--surface-2', '#F4F1EB', 'Вторичные поверхности'], ['--surface-3', '#EAE5DC', 'Неактивные элементы'],
    ['--line', '#E6E1D8', 'Тонкие границы'], ['--line-strong', '#D6CFC3', 'Поля ввода, разделители'],
    ['--ink', '#17161A', 'Основной текст'], ['--ink-2', '#4A4850', 'Второстепенный текст'],
    ['--ink-3', '#7D7A84', 'Подписи и метки'], ['--accent', '#E04E2A', 'Акцент · primary CTA'],
    ['--accent-soft', '#FBEEE8', 'Акцентная подложка'], ['--ok', '#2C7358', 'Успех и завершение'],
    ['--info', '#35597F', 'Информация и проверка'], ['--warn', '#8A6420', 'Ожидание и предупреждение'], ['--stop', '#9B3B34', 'Ошибка и правка'],
  ];
  return (
    <AppShell wide title="Taskly UI-kit" sub="Единый набор элементов. Используется на всех страницах без изменений — это и держит продукт цельным."
      actions={<Btn variant="ghost" icon="layers" onClick={() => app.navigate('/map')}>Карта продукта и флоу</Btn>}>
      <div className="stack g8">
        <Block title="Цвет" note="Один акцент, экономно: primary CTA, активное состояние, метки. Фон тёплый молочный, текст почти чёрный.">
          <div className="grid-4">
            {swatches.map(([v, hex, label]) => (
              <div className="card card--pad-sm stack g3" key={v}>
                <div style={{ height: 62, borderRadius: 'var(--r-sm)', background: `var(${v})`, border: '1px solid var(--line)' }} />
                <div className="stack g1">
                  <span className="t-sm mono">{hex}</span>
                  <span className="t-cap muted">{label}</span>
                  <span className="t-cap mono" style={{ color: 'var(--ink-3)' }}>{v}</span>
                </div>
              </div>
            ))}
          </div>
        </Block>

        <Block title="Типографика" note="Шрифт Onest. Пять размеров текста и четыре уровня заголовков — без десятков вариантов.">
          <div className="card card--pad-lg stack g5">
            {[['t-display', 'Дисплей 56px', 'Реальные задачи для специалистов'],
              ['t-h1', 'H1 40px', 'Что нужно сделать'],
              ['t-h2', 'H2 30px', 'Рабочее пространство проекта'],
              ['t-h3', 'H3 21px', 'Итоговое техническое задание'],
              ['t-h4', 'H4 17px', 'Telegram-бот для записи клиентов'],
              ['', 'Body 15.5px', 'Оплата зарезервирована до завершения проекта: специалист получает деньги после приёмки результата.'],
              ['t-sm', 'Small 14px', 'Комиссия Taskly 5% удерживается со специалиста один раз.'],
              ['t-cap', 'Caption 12.5px', 'Показано 6 из 12 проектов · обновлено сегодня'],
              ['t-micro', 'Micro 11.5px', 'НАПРАВЛЕНИЯ И НАВЫКИ']].map(([cls, label, sample]) => (
              <div className="stack g2" key={label}>
                <span className="t-micro muted">{label}</span>
                <span className={cls} style={{ color: 'var(--ink)' }}>{sample}</span>
              </div>
            ))}
          </div>
        </Block>

        <Block title="Кнопки" note="На одном экране визуально главным должно быть только одно действие.">
          <div className="grid-3">
            <div className="card card--pad-lg stack g4">
              <span className="t-micro muted">Основные</span>
              <div className="row g3 wrap"><Btn variant="primary">Откликнуться</Btn><Btn variant="primary" disabled>Недоступно</Btn></div>
              <div className="row g3 wrap"><Btn>Подробнее</Btn><Btn variant="ghost">Отмена</Btn></div>
              <div className="row g3 wrap"><Btn variant="quiet">Сохранить</Btn><Btn variant="danger">Запросить правку</Btn></div>
              <div className="row g3 wrap"><Btn size="sm" variant="primary">Создать</Btn><Btn size="sm">Фильтры</Btn><Btn size="lg" variant="primary">Отправить отклик</Btn></div>
            </div>
            <div className="card card--pad-lg stack g4">
              <span className="t-micro muted">Состояния и размеры</span>
              <div className="row g3 wrap"><Btn variant="primary"><span className="spin" /> Отправляем…</Btn><Btn variant="primary" icon="check">Готово</Btn></div>
              <div className="row g3 wrap"><Btn icon="plus">Создать проект</Btn><Btn iconRight="arrowR" variant="secondary">Далее</Btn></div>
              <div className="row g3 wrap"><Btn variant="icon" aria-label="Ещё"><Icon name="more" /></Btn><Btn variant="icon"><Icon name="bell" /></Btn></div>
              <div className="btn-group"><button aria-pressed="true">Путь бизнеса</button><button>Путь специалиста</button></div>
            </div>
            <div className="card card--pad-lg stack g4">
              <span className="t-micro muted">Правило иерархии</span>
              <div className="stack g3">
                {[['Primary', 'Одно главное действие: отправить, создать, принять'],
                  ['Secondary', 'Альтернатива рядом с главным действием'],
                  ['Quiet / Ghost', 'Навигация и второстепенные действия'],
                  ['Destructive', 'Только правка, отклонение, удаление']].map(([t, s]) => (
                  <div className="stack g1" key={t}><span className="t-sm" style={{ fontWeight: 550 }}>{t}</span><span className="t-cap muted">{s}</span></div>
                ))}
              </div>
            </div>
          </div>
        </Block>

        <Block title="Поля и формы" note="Подпись, подсказка под полем, ошибка под полем. Длинные формы разделены на шаги.">
          <div className="grid-3">
            <div className="card card--pad-lg stack g5">
              <Field label="Название проекта" required hint="Появится в списке проектов и в откликах">
                <input className="input" placeholder="Лендинг для студии маникюра" />
              </Field>
              <Field label="Стоимость проекта" hint="Специалисты могут предложить свою цену">
                <div className="affix"><input className="input input--num" defaultValue="100000" /><span className="suffix">₸</span></div>
              </Field>
              <Field label="С ошибкой" error="Опишите задачу подробнее, минимум 2–3 предложения">
                <input className="input" data-invalid="true" defaultValue="нужен сайт" />
              </Field>
            </div>
            <div className="card card--pad-lg stack g5">
              <Field label="Направление"><select className="select" defaultValue="Дизайн">{directions.map((d) => <option key={d.id}>{d.name}</option>)}</select></Field>
              <Field label="Описание задачи"><textarea className="textarea" placeholder="Опишите задачу своими словами…" /></Field>
              <Field label="Поиск"><input className="input input--search" placeholder="Что нужно сделать?" /></Field>
            </div>
            <div className="card card--pad-lg stack g5">
              <span className="t-micro muted">Выбор и переключатели</span>
              <label className="check"><input type="checkbox" defaultChecked /><span><strong>Условия ТЗ понятны</strong>Ожидаемый результат совпадает с тем, что я выполню</span></label>
              <label className="radio"><input type="radio" name="uikit-r" defaultChecked /><span><strong>Можно junior</strong>Подходит начинающим</span></label>
              <label className="radio"><input type="radio" name="uikit-r" /><span><strong>Уверенный уровень</strong>Нужны самостоятельные решения</span></label>
              <label className="switch"><input type="checkbox" defaultChecked /><span className="t-sm">Показывать статус верификации</span></label>
              <div className="stack g2">
                <span className="t-micro muted">Chips — направления и навыки</span>
                <div className="chips">
                  {['Все направления', 'Дизайн', 'Разработка', 'Аналитика'].map((c) => (
                    <button key={c} className={'chip' + (chip === c ? ' is-on' : '')} onClick={() => setChip(c)}>{c}</button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Block>

        <Block title="Метки, статусы, бейджи" note="Статус проекта — точка и подпись. Навыки — метки. Совпадение навыков — акцентная метка.">
          <div className="grid-3">
            <div className="card card--pad-lg stack g4">
              <span className="t-micro muted">Метки навыков</span>
              <div className="tag-row">
                <Tag>Figma</Tag><Tag>UI/UX</Tag><Tag tone="match">Совпадают 3 навыка</Tag>
                <Tag tone="line">Направление</Tag><Tag tone="ink">Новый</Tag><Tag tone="match">Можно junior</Tag>
              </div>
              <span className="t-micro muted">Бейджи</span>
              <div className="row g2 wrap">
                <Badge>Обычный</Badge><Badge tone="ok" dot>Завершён</Badge><Badge tone="info" dot>Проверено</Badge>
                <Badge tone="warn" dot>Ожидает</Badge><Badge tone="stop" dot>Правка</Badge><Badge tone="accent">Новый отклик</Badge>
              </div>
            </div>
            <div className="card card--pad-lg stack g4">
              <span className="t-micro muted">Статусы проекта · 7 значений</span>
              <div className="stack g3">
                {Object.keys(statuses).map((k) => <StatusPill key={k} id={k} />)}
              </div>
            </div>
            <div className="card card--pad-lg stack g4">
              <span className="t-micro muted">Аватары · показатели</span>
              <div className="row g3 wrap">
                {specialists.slice(0, 5).map((s) => <Avatar key={s.id} person={s} round />)}
                <Avatar person={specialists[0]} size="lg" />
                <Avatar person={specialists[1]} size="xl" />
              </div>
              <div className="row g4 wrap">
                <Stars value={4.9} /><Stars value={4} /><Stars value={0} />
              </div>
              <div className="grid-2" style={{ gap: 'var(--s4)' }}>
                <Metric value="4" label="завершённых проекта" />
                <Metric value="100%" label="выполнено в срок" />
              </div>
            </div>
          </div>
        </Block>

        <Block title="Карточки и панели" note="Светлый фон, тонкая граница, умеренный радиус, мягкая тень или без неё, много свободного места.">
          <div className="grid-3">
            <div className="card card--pad-lg stack g4">
              <span className="t-micro muted">Карточка проекта</span>
              <div className="row between g3"><Tag tone="match">Можно junior</Tag><span className="t-cap muted">2 часа назад</span></div>
              <div className="stack g2">
                <span className="t-h4">Лендинг для студии маникюра</span>
                <span className="t-sm muted clamp2">Одностраничный сайт: услуги, прайс, работы, кнопка записи в WhatsApp.</span>
              </div>
              <div className="tag-row"><Tag>Figma</Tag><Tag>Лендинг</Tag></div>
              <div className="kv-rows">
                <div className="kv-row"><dt>Бюджет</dt><dd><Money value={100000} strong /></dd></div>
                <div className="kv-row"><dt>Срок</dt><dd>12 дней</dd></div>
              </div>
              <div className="row g2"><Btn size="sm" className="grow">Подробнее</Btn><Btn size="sm" variant="primary">Откликнуться</Btn></div>
            </div>
            <div className="card card--pad-lg stack g4">
              <span className="t-micro muted">Панель с условиями</span>
              <div className="kv-rows">
                <div className="kv-row"><dt>Стоимость</dt><dd><Money value={100000} strong /></dd></div>
                <div className="kv-row"><dt>Срок</dt><dd>12 дней</dd></div>
                <div className="kv-row"><dt>Правки</dt><dd>2 круга по ТЗ</dd></div>
                <div className="kv-row"><dt>Оплата</dt><dd>Резервируется до старта</dd></div>
              </div>
              <SafeNote compact />
            </div>
            <div className="stack g4">
              <div className="card card--soft stack g3">
                <span className="t-micro muted">Мягкая панель</span>
                <span className="t-sm ink2">Для второстепенных блоков: примеры, подсказки, сводки.</span>
              </div>
              <div className="note"><Icon name="info" size={16} /><span className="grow">Информационная заметка: нейтральная подложка и иконка.</span></div>
              <div className="note note--accent"><Icon name="sparkle" size={16} /><span className="grow">Акцентная заметка: только для важного пояснения.</span></div>
              <div className="note note--ok"><Icon name="shield" size={16} /><span className="grow"><strong>Оплата зарезервирована до завершения проекта.</strong></span></div>
            </div>
          </div>
        </Block>

        <Block title="Навигация, табы, крошки, пагинация">
          <div className="grid-2">
            <div className="card card--pad-lg stack g5">
              <div className="crumbs"><span>Мои проекты</span><span className="sep">/</span><span>Рабочее пространство</span><span className="sep">/</span><span className="here">Этапы</span></div>
              <Tabs value={tab} onChange={setTab} items={[{ id: 'all', label: 'Все проекты', count: 12 }, { id: 'match', label: 'Подходит мне', count: 5 }, { id: 'saved', label: 'Сохранённые', count: 2 }]} />
              <div className="side-nav" style={{ position: 'static' }}>
                <Link to="/spec/projects" className="side-item is-on"><Icon name="search" size={16} />Найти проекты</Link>
                <Link to="/spec/proposals" className="side-item"><Icon name="send" size={16} /><span className="grow">Мои отклики</span><span className="count">4</span></Link>
                <Link to="/spec/payout" className="side-item"><Icon name="wallet" size={16} />Выплаты</Link>
              </div>
              <div className="pager">
                <button aria-label="Назад"><Icon name="arrowL" size={15} /></button>
                <button aria-current="true">1</button><button>2</button><button>3</button>
                <span className="t-cap muted" style={{ padding: '0 6px' }}>…</span><button>8</button>
                <button aria-label="Вперёд"><Icon name="arrowR" size={15} /></button>
              </div>
              <div className="chips chips--scroll">
                {skills.slice(0, 12).map((s) => <button key={s} className="chip">{s}</button>)}
              </div>
            </div>
            <div className="card card--pad-lg stack g5">
              <span className="t-micro muted">Прогресс и этапы</span>
              <Rail stage={1} total={4} />
              <div className="steps">
                {[['Подготовка', true], ['Основная работа', false], ['Проверка', false], ['Результат', false]].map(([t, done], i) => (
                  <div className={'step-item ' + (i === 0 ? 'is-done' : i === 1 ? 'is-now' : 'is-todo')} key={t}>
                    <div className="step-mark"><div className="step-dot">{i === 0 ? <Icon name="check" size={13} /> : i + 1}</div><div className="step-line" /></div>
                    <div className="step-body stack g1" style={{ paddingBottom: 'var(--s4)' }}>
                      <span className="step-title">{t}</span>
                      <span className="step-sub">{i === 0 ? 'Выполнен · материалы собраны' : i === 1 ? 'В работе сейчас' : 'Не начат'}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="row g3"><Icon name="lock" size={16} /><span className="t-cap muted">Изменение условий требует подтверждения обеими сторонами.</span></div>
            </div>
          </div>
        </Block>

        <Block title="Состояния: пустое, загрузка, ошибка, успех">
          <div className="grid-2">
            <div className="card" style={{ padding: 0 }}>
              <Empty icon="briefcase" title="У вас пока нет проектов"
                text="Опишите задачу своими словами — Taskly соберёт структурированное ТЗ и покажет подходящих специалистов."
                action={<Btn variant="primary" icon="plus">Создать первый проект</Btn>} />
            </div>
            <div className="stack g4">
              <div className="card card--pad-lg stack g4">
                <span className="t-micro muted">Загрузка — скелетоны</span>
                <div className="stack g3">
                  <div className="row g3"><Skel w={40} h={40} r="var(--r-sm)" /><div className="stack g2 grow"><Skel w="58%" /><Skel w="34%" h={12} /></div></div>
                  <Skel w="86%" h={12} /><Skel w="72%" h={12} />
                </div>
                <div className="row g3"><span className="spin spin--ink" /><span className="t-cap muted">Загружаем проекты…</span></div>
              </div>
              <div className="note note--warn"><Icon name="alert" size={16} /><span className="grow"><strong>Не удалось загрузить отклики.</strong> Проверьте соединение — данные проекта не потеряны. <button className="btn btn--sm btn--ghost">Повторить</button></span></div>
              <div className="note note--ok"><Icon name="check" size={16} /><span className="grow"><strong>Отклик отправлен.</strong> Заказчик увидит вашу цену, срок и работу из портфолио.</span></div>
              <div className="drop stack g2 center">
                <Icon name="upload" size={18} /><strong className="t-sm" style={{ color: 'var(--ink)' }}>Перетащите файлы сюда</strong><span>PDF, PNG, DOCX · до 25 МБ</span>
              </div>
            </div>
          </div>
        </Block>

        <Block title="Модальные окна и уведомления" note="Модальное окно — только для подтверждения действия или короткой формы. Всё длинное живёт на страницах.">
          <div className="row g3 wrap">
            <Btn variant="primary" onClick={() => setModal(true)}>Открыть пример модального окна</Btn>
            <Btn onClick={() => app.toast('Правка отправлена исполнителю')}>Показать уведомление</Btn>
            <Btn onClick={() => app.toast('Не удалось сохранить черновик', 'err')}>Уведомление об ошибке</Btn>
          </div>
          {modal && (
            <Modal title="Отправить отклик" sub="Заказчик увидит цену, срок и работу из портфолио."
              onClose={() => setModal(false)}
              footer={<><Btn onClick={() => setModal(false)}>Отмена</Btn><Btn variant="primary" onClick={() => { setModal(false); app.toast('Отклик отправлен'); }}>Отправить отклик</Btn></>}>
              <div className="stack g4">
                <Field label="Предлагаемая стоимость" required>
                  <div className="affix"><input className="input input--num" defaultValue="100000" /><span className="suffix">₸</span></div>
                </Field>
                <FeeCalc price={100000} compact />
                <label className="check"><input type="checkbox" defaultChecked /><span>Условия ТЗ понятны</span></label>
              </div>
            </Modal>
          )}
        </Block>

        <Block title="Сетка и отступы" note="Шкала 4→112. Контейнер контента 1180px, приложение 1320px, текст 720px. Радиусы 5/7/10/14/20.">
          <div className="grid-3">
            <div className="card card--pad-lg stack g3">
              <span className="t-micro muted">Шкала отступов</span>
              {[['--s1', '4px'], ['--s2', '8px'], ['--s3', '12px'], ['--s4', '16px'], ['--s5', '20px'], ['--s6', '24px'], ['--s8', '32px'], ['--s12', '48px'], ['--s16', '64px'], ['--s24', '112px']].map(([v, px]) => (
                <div className="row g3" key={v}>
                  <span className="t-cap mono" style={{ width: 56, color: 'var(--ink-3)' }}>{v}</span>
                  <span style={{ height: 8, width: px, background: 'var(--accent-soft)', border: '1px solid var(--accent-line)', borderRadius: 2 }} />
                  <span className="t-cap muted">{px}</span>
                </div>
              ))}
            </div>
            <div className="card card--pad-lg stack g3">
              <span className="t-micro muted">Радиусы</span>
              {[['--r-xs', '5px · метки, мелкие кнопки'], ['--r-sm', '7px · кнопки, поля'], ['--r-md', '10px · внутренние блоки'], ['--r-lg', '14px · карточки, панели'], ['--r-xl', '20px · модальные окна'], ['--r-full', '999px · чипы, бейджи, статусы']].map(([v, d]) => (
                <div className="row g3" key={v}>
                  <span style={{ width: 34, height: 26, background: 'var(--surface-2)', border: '1px solid var(--line-strong)', borderRadius: `var(${v === '--r-full' ? '--r-full' : v})` }} />
                  <span className="t-cap muted"><strong className="mono">{v}</strong> · {d}</span>
                </div>
              ))}
            </div>
            <div className="card card--pad-lg stack g3">
              <span className="t-micro muted">Сетки</span>
              {[['grid-2', 'Две колонки: сравнения, формы с пояснением'], ['grid-3', 'Три колонки: карточки возможностей, метрики'],
                ['grid-4', 'Четыре колонки: шаги, статусы, показатели'], ['grid-auto', 'Карточки специалистов и проектов'],
                ['shell-2', 'Кабинет: боковая навигация + контент'], ['shell-ws', 'Рабочее пространство: контент + условия сбоку']].map(([c, d]) => (
                <div className="stack g1" key={c}><span className="t-sm mono">{c}</span><span className="t-cap muted">{d}</span></div>
              ))}
            </div>
          </div>
        </Block>

        <Block title="Placeholders для изображений" note="Мы не рисуем изображения кодом: вместо этого — корректный плейсхолдер. Замените на реальные материалы заказчика.">
          <div className="grid-3">
            <Ph label="скриншот лендинга" variant="wide" />
            <Ph label="мобильный макет" variant="tall" />
            <Ph label="превью работы из портфолио" variant="shot" />
          </div>
        </Block>
      </div>
    </AppShell>
  );
}

function Block({ title, note, children }) {
  return (
    <section className="stack g4">
      <div className="stack g2" style={{ maxWidth: 720 }}>
        <h2 className="t-h3">{title}</h2>
        {note && <p className="t-sm muted">{note}</p>}
      </div>
      {children}
    </section>
  );
}

/* ============================ Карта продукта ============================ */
function MapPage() {
  const app = useApp();
  const [side, setSide] = useState('business');
  const ia = [
    { h: 'Публичная часть', items: [['Главная', '/'], ['Для бизнеса', '/business'], ['Для специалистов', '/specialists'], ['Как это работает', '/how'], ['Безопасная сделка', '/security'], ['Комиссия 5%', '/pricing'], ['FAQ', '/faq'], ['Поддержка', '/support'], ['Условия', '/terms'], ['Конфиденциальность', '/privacy']] },
    { h: 'Вход и онбординг', items: [['Вход', '/signin'], ['Регистрация', '/signup'], ['Онбординг бизнеса', '/onboarding/business'], ['Онбординг специалиста', '/onboarding/specialist']] },
    { h: 'Кабинет бизнеса', items: [['Обзор', '/biz'], ['Мои проекты', '/biz/projects'], ['Создание проекта (мастер)', '/biz/projects/new'], ['Предпросмотр ТЗ', '/biz/projects/new/preview'], ['Опубликованный проект', '/biz/projects/p-1041'], ['Отклики', '/biz/projects/p-1041/proposals'], ['Выбор исполнителя и условия', '/biz/projects/p-1041/select?proposal=pr-1'], ['Рабочее пространство', '/biz/workspace/p-1042'], ['Сообщения', '/biz/messages'], ['Поиск специалистов', '/biz/specialists'], ['Профиль специалиста', '/biz/specialists/s-1'], ['История проектов', '/biz/history'], ['Профиль компании', '/biz/profile']] },
    { h: 'Кабинет специалиста', items: [['Обзор', '/spec'], ['Найти проекты', '/spec/projects'], ['Детальная страница проекта', '/spec/projects/p-1045'], ['Отклик и расчёт комиссии', '/spec/projects/p-1045/apply'], ['Мои отклики', '/spec/proposals'], ['Сообщения', '/spec/messages'], ['Рабочее пространство', '/spec/workspace/p-1053'], ['Выплаты и итоговый расчёт', '/spec/payout'], ['История проектов', '/spec/history'], ['Отзывы', '/spec/reviews'], ['Профиль', '/spec/profile'], ['Редактирование профиля', '/spec/profile/edit']] },
    { h: 'Общее для аккаунта', items: [['Уведомления', '/notifications'], ['Настройки', '/settings'], ['UI-kit', '/ui-kit'], ['Карта продукта', '/map']] },
  ];

  const flows = {
    business: [['Первое знакомство', [['Главная: две кнопки — «Мне нужен специалист» и «Хочу выполнять проекты»', '/'], ['Как это работает: путь бизнеса по шагам', '/how']]],
      ['Подготовка задачи', [['Регистрация за 2 шага', '/signup'], ['Онбординг: сфера, типы задач, формат оплаты', '/onboarding/business'], ['Мастер из 6 шагов: задача → результат → материалы → срок → бюджет → условия', '/biz/projects/new'], ['Предпросмотр ТЗ и публикация', '/biz/projects/new/preview']]],
      ['Выбор исполнителя', [['Страница проекта и отклики специалистов', '/biz/projects/p-1041/proposals'], ['Профиль специалиста: навыки, портфолио, надёжность, верификация', '/biz/specialists/s-1'], ['Подтверждение условий обеими сторонами', '/biz/projects/p-1041/select?proposal=pr-1'], ['Резервирование оплаты через платёжную систему', '/biz/projects/p-1041/select?proposal=pr-1']]],
      ['Работа и результат', [['Рабочее пространство: обзор, ТЗ, этапы, файлы, сообщения', '/biz/workspace/p-1042'], ['Приёмка результата или запрос правки', '/biz/workspace/p-1044'], ['Завершение проекта, выплата за вычетом 5%', '/biz/workspace/p-1044'], ['Отзыв исполнителю и история проектов', '/biz/history']]],
      ['Особые ситуации', [['Изменение условий проекта с подтверждением двух сторон', '/biz/workspace/p-1042'], ['Обращение в поддержку по спору', '/biz/workspace/p-1042'], ['Резервная ветка: ничего не найдено / нет откликов / пустой аккаунт', '/biz/projects']]]],
    specialist: [['Первое знакомство', [['Страница «Для специалистов»: новичкам без опыта', '/specialists'], ['Как считается комиссия 5% на примере', '/pricing']]],
      ['Профиль', [['Регистрация и онбординг специалиста', '/onboarding/specialist'], ['Направления → навыки', '/spec/profile/edit'], ['Портфолио: учебные работы и личные кейсы', '/spec/profile/edit'], ['Верификация: портфолио, образование, тестовое задание', '/spec/profile']]],
      ['Поиск и отклик', [['Найти проекты: поиск, направления, фильтры, вкладки', '/spec/projects'], ['Детальная страница проекта: ТЗ, этапы, расчёт', '/spec/projects/p-1045'], ['Отклик: цена, срок, сообщение, работа из портфолио', '/spec/projects/p-1045/apply'], ['Расчёт: ваша цена → комиссия 5% → к получению', '/spec/projects/p-1045/apply'], ['Мои отклики и приглашение от заказчика', '/spec/proposals']]],
      ['Работа и деньги', [['Рабочее пространство, этапы и файлы', '/spec/workspace/p-1053'], ['Сдача результата на проверку', '/spec/workspace/p-1053'], ['Работа с правками по ТЗ', '/spec/workspace/p-1053'], ['Предложение изменения условий', '/spec/workspace/p-1053']]],
      ['Итог', [['Выплата и итоговый расчёт за вычетом 5%', '/spec/payout'], ['Полученный отзыв и репутация', '/spec/reviews'], ['История проектов как портфолио', '/spec/history']]]],
  };

  return (
    <AppShell wide title="Карта продукта" sub="Информационная архитектура, оба пользовательских сценария и полный список страниц прототипа."
      actions={<><Btn icon="grid" onClick={() => app.navigate('/ui-kit')}>UI-kit</Btn>
        <Btn variant="primary" onClick={() => { app.setEmptyMode(false); app.setRole(side === 'business' ? 'client' : 'specialist'); app.navigate(side === 'business' ? '/biz' : '/spec'); }}>Войти в демо-путь</Btn></>}>
      <div className="stack g8">
        <Block title="Как читать прототип" note="Это один продукт: единый header, цвета, типографика, карточки, кнопки, поля и сетка на всех страницах. Ниже — карта переходов.">
          <div className="grid-3">
            <div className="card card--pad-lg stack g3">
              <span className="empty-mark" style={{ margin: 0, width: 42, height: 42 }}><Icon name="briefcase" size={19} /></span>
              <h3 className="t-h4">Путь бизнеса</h3>
              <p className="t-sm muted">От «нужен специалист» до принятой работы и отзыва: 8 шагов, где главное действие на каждом экране одно.</p>
              <Btn size="sm" variant="primary" onClick={() => { app.setEmptyMode(false); app.setRole('client'); app.navigate('/biz'); }}>Начать путь бизнеса</Btn>
            </div>
            <div className="card card--pad-lg stack g3">
              <span className="empty-mark" style={{ margin: 0, width: 42, height: 42 }}><Icon name="user" size={19} /></span>
              <h3 className="t-h4">Путь специалиста</h3>
              <p className="t-sm muted">От профиля без коммерческого опыта до выплаты и отзыва: поиск, отклик с прозрачным расчётом, сдача и правки.</p>
              <Btn size="sm" variant="primary" onClick={() => { app.setEmptyMode(false); app.setRole('specialist'); app.navigate('/spec'); }}>Начать путь специалиста</Btn>
            </div>
            <div className="card card--pad-lg stack g3">
              <span className="empty-mark" style={{ margin: 0, width: 42, height: 42 }}><Icon name="shield" size={19} /></span>
              <h3 className="t-h4">Механики доверия</h3>
              <p className="t-sm muted">Зарезервированная оплата, фиксация ТЗ, изменения только по согласию двух сторон, отзывы только по завершённым сделкам.</p>
              <Btn size="sm" onClick={() => app.navigate('/security')}>Безопасная сделка</Btn>
            </div>
          </div>
        </Block>

        <Block title="Информационная архитектура" note="Публичная часть, вход, два кабинета и общие страницы аккаунта. Второстепенные страницы объединены: юридические тексты — один раздел с двумя документами, поддержка совмещает создание обращения и историю.">
          <div className="grid-3">
            {ia.map((g) => (
              <div className="card card--pad-lg stack g3" key={g.h}>
                <span className="t-micro muted">{g.h}</span>
                <div className="stack g1">
                  {g.items.map(([l, to]) => (
                    <Link key={to + l} to={to} className="side-item" style={{ padding: '6px 8px' }}>
                      <Icon name="chevR" size={14} style={{ color: 'var(--ink-3)' }} />
                      <span className="grow trunc t-cap" style={{ fontSize: 'var(--fs-sm)' }}>{l}</span>
                      <span className="mono" style={{ fontSize: 10, color: 'var(--ink-3)' }}>{to}</span>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Block>

        <Block title="Пользовательские сценарии">
          <div className="card card--pad-lg stack g6">
            <div className="row between wrap g4">
              <div className="btn-group">
                <button type="button" aria-pressed={side === 'business'} onClick={() => setSide('business')}>Бизнес</button>
                <button type="button" aria-pressed={side === 'specialist'} onClick={() => setSide('specialist')}>Специалист</button>
              </div>
              <span className="t-cap muted">{flows[side].length} этапа · {flows[side].reduce((a, [, items]) => a + items.length, 0)} шагов</span>
            </div>
            <div className="stack g8">
              {flows[side].map(([h, items], i) => (
                <div className="stack g4" key={h}>
                  <div className="row g4">
                    <span className="step-dot">{i + 1}</span>
                    <h3 className="t-h4">{h}</h3>
                  </div>
                  <div className="grid-2" style={{ gap: 'var(--s3)' }}>
                    {items.map(([t, to]) => (
                      <Link key={t} to={to} className="card card--pad-sm row g3 card--link" style={{ padding: 'var(--s4)', alignItems: 'flex-start' }}>
                        <Icon name="arrowR" size={16} style={{ color: 'var(--accent)', marginTop: 3 }} />
                        <span className="stack g1 grow" style={{ minWidth: 0 }}>
                          <span className="t-sm ink2">{t}</span>
                          <span className="mono" style={{ fontSize: 10.5, color: 'var(--ink-3)' }}>{to}</span>
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Block>

        <Block title="Состояния, которые предусмотрены" note="Не только «счастливый путь»: пустые состояния, ошибки, загрузка, отсутствие результатов и отказы. Режим «пустой аккаунт» выключается в демо-панели (кнопка «Демо» внизу справа).">
          <div className="grid-4">
            {[['Пустой аккаунт бизнеса', 'Создать первый проект', () => { app.setEmptyMode(true); app.setRole('client'); app.navigate('/biz'); }],
              ['Пустой аккаунт специалиста', 'Найти проекты', () => { app.setEmptyMode(true); app.setRole('specialist'); app.navigate('/spec'); }],
              ['Нет откликов на проект', 'Пригласить специалиста', () => { app.setEmptyMode(true); app.setRole('client'); app.navigate('/biz/projects/p-1041/proposals'); }],
              ['Ничего не найдено в поиске', 'Сбросить фильтры', () => { app.setEmptyMode(true); app.setRole('specialist'); app.navigate('/spec/projects'); }],
              ['Нет сохранённых проектов', 'Смотреть все проекты', () => { app.setEmptyMode(true); app.setRole('specialist'); app.navigate('/spec/projects'); }],
              ['Нет отзывов и портфолио', 'Добавить работу', () => { app.setEmptyMode(true); app.setRole('specialist'); app.navigate('/spec/profile'); }],
              ['Загрузка и скелетоны', 'Смотреть в UI-kit', () => app.navigate('/ui-kit')],
              ['Ошибки и подтверждения', 'Смотреть в UI-kit', () => app.navigate('/ui-kit')]].map(([t, s, fn]) => (
              <button className="card card--pad-lg stack g3 card--link" key={t} style={{ textAlign: 'left' }} onClick={fn}>
                <span className="t-sm" style={{ fontWeight: 600 }}>{t}</span>
                <span className="t-cap muted">{s}</span>
                <Icon name="arrowR" size={16} style={{ color: 'var(--accent)' }} />
              </button>
            ))}
          </div>
        </Block>
      </div>
    </AppShell>
  );
}

export { HowPage, SecurityPage, PricingPage, FaqPage, SupportPage, NotificationsPage, SettingsPage, LegalPage, UiKitPage, MapPage, ModelTz, ModelChange };
