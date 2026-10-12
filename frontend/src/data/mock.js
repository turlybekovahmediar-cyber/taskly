import { addDays, money } from '../lib/format.js';

export const directions = [
  { id: 'design', name: 'Дизайн' },
  { id: 'dev', name: 'Разработка' },
  { id: 'marketing', name: 'Маркетинг' },
  { id: 'analytics', name: 'Аналитика' },
  { id: 'content', name: 'Контент' },
  { id: 'automation', name: 'Автоматизация' },
  { id: 'business', name: 'Бизнес-задачи' },
  { id: 'other', name: 'Другое' },
];

export const skills = [
  'Figma', 'UI/UX', 'Лендинг', 'Брендинг', 'Иллюстрация', 'Монтаж видео', 'Презентации',
  'HTML/CSS', 'JavaScript', 'React', 'Python', 'Telegram-бот', 'No-code', 'WordPress',
  'Excel', 'Google Sheets', 'Data Analysis', 'Research', 'SQL', 'Метрики',
  'Copywriting', 'Контент-план', 'SMM', 'SEO', 'Email-рассылки', 'Реклама',
  'Автоматизация процессов', 'Интеграции API', 'Парсинг данных', 'Скрипты',
  'Документация', 'Регламенты', 'Подбор данных', 'Оформление', 'Онбординг-материалы',
];

export const skillsByDirection = {
  design: ['Figma', 'UI/UX', 'Лендинг', 'Брендинг', 'Иллюстрация', 'Презентации', 'Оформление'],
  dev: ['HTML/CSS', 'JavaScript', 'React', 'Python', 'Telegram-бот', 'WordPress', 'No-code'],
  marketing: ['SMM', 'SEO', 'Реклама', 'Email-рассылки', 'Метрики', 'Контент-план'],
  analytics: ['Excel', 'Google Sheets', 'Data Analysis', 'SQL', 'Research', 'Метрики'],
  content: ['Copywriting', 'Контент-план', 'Монтаж видео', 'Документация', 'Оформление'],
  automation: ['Автоматизация процессов', 'Интеграции API', 'Парсинг данных', 'Скрипты', 'No-code', 'Telegram-бот'],
  business: ['Регламенты', 'Документация', 'Подбор данных', 'Research', 'Онбординг-материалы'],
  other: ['Оформление', 'Подбор данных', 'Research', 'Документация'],
};

export const levels = [
  { id: 'any', name: 'Любая сложность', hint: 'Задачи для любого уровня' },
  { id: 'junior', name: 'Можно junior', hint: 'Подходит начинающим — есть ТЗ и примеры' },
  { id: 'core', name: 'Уверенный уровень', hint: 'Нужны самостоятельные решения' },
];

export const workFormats = [
  { id: 'remote', name: 'Удалённо' },
  { id: 'calls', name: 'С созвонами' },
  { id: 'fixed', name: 'Фиксированный объём' },
  { id: 'ongoing', name: 'Возможна доработка' },
];

export const statuses = {
  published: { label: 'Опубликован', tone: 'info' },
  searching: { label: 'Идёт поиск исполнителя', tone: 'info' },
  awaiting_payment: { label: 'Ожидает оплаты', tone: 'warn' },
  in_work: { label: 'В работе', tone: 'live' },
  on_review: { label: 'На проверке', tone: 'warn' },
  needs_fix: { label: 'Нужна правка', tone: 'stop' },
  done: { label: 'Завершён', tone: 'ok' },
};
export const OPEN_STATUSES = ['published', 'searching'];
export const ACTIVE_STATUSES = ['awaiting_payment', 'in_work', 'on_review', 'needs_fix'];

export const spheres = ['Услуги для людей', 'Розница и e-commerce', 'Общепит', 'Производство', 'B2B-услуги', 'Онлайн-проект', 'Другое'];

export const directionsOf = (ids = []) => ids.map((d) => directions.find((x) => x.id === d)?.name).filter(Boolean);
export const levelName = (id) => levels.find((l) => l.id === id)?.name || 'Любая сложность';
export const formatNames = (ids = []) => ids.map((f) => workFormats.find((x) => x.id === f)?.name).filter(Boolean);

export const tasksamples = [
  'Сделать сайт или лендинг', 'Написать тексты для соцсетей', 'Свести и почистить таблицы',
  'Собрать презентацию', 'Настроить бота или автоматизацию', 'Провести интервью с клиентами',
  'Найти данные и сравнить варианты', 'Смонтировать видео', 'Описать регламент процесса',
  'Настроить рассылку', 'Разобрать отзывы конкурентов', 'Собрать небольшой сервис',
];

export const DEMO_BUSINESS = { id: 'c-me', name: 'Barber Loft', sphere: 'Услуги для людей', city: 'Алматы', contact: 'Айгерим, управляющая', email: 'hello@barberloft.kz', site: 'barberloft.kz' };
export const DEMO_SPECIALIST_ID = 's-1';

export const specialists = [
  {
    id: 's-1', name: 'Аружан Смагулова', initials: 'АС', avatar: 'avatar--a', handle: '@aruzhan.design', email: 'aruzhan@example.kz',
    headline: 'UI/UX и лендинги', level: 'verified', levelName: 'Проверенный специалист',
    about: 'Учусь на 3 курсе по цифровому дизайну. Делаю лендинги и интерфейсы в Figma. Люблю понятные структуры и аккуратную типографику.',
    directions: ['design', 'dev'], skills: ['Figma', 'UI/UX', 'Лендинг', 'HTML/CSS', 'Презентации'],
    city: 'Алматы · удалённо', completed: 3, onTime: 100, successRate: 100,
    reviews: 3, rating: 4.7, responseTime: 'обычно за 2 часа', verifiedVia: ['Портфолио проверено', 'Образование подтверждено'],
    availability: 'Свободна с 30 сентября',
    portfolio: [
      { t: 'Лендинг для языковой школы', s: 'Дизайн и вёрстка, 6 секций', ph: 'скриншот лендинга' },
      { t: 'Мобильный экран записи', s: 'UI-концепт, 4 состояния', ph: 'мобильный макет' },
      { t: 'Учебный проект: сервис аренды', s: 'Курсовая работа, 12 экранов', ph: 'экраны проекта' },
    ],
    reviewList: [
      { who: 'Tea Room', when: '1 неделю назад', stars: 5, text: 'Сделала понятный макет с первого раза, поправки внесла быстро. Спокойно объясняла решения.', project: 'Лендинг для Tea Room', tags: ['В срок', 'Быстрые правки'] },
      { who: 'Lumen Studio', when: '3 недели назад', stars: 5, text: 'Уложилась в срок, отдала исходники в порядке. Будем работать ещё.', project: 'Оформление КП для Lumen Studio', tags: ['Аккуратные файлы'] },
      { who: 'Fit Corner', when: '1 месяц назад', stars: 4, text: 'Результат хороший, но на согласование ушло больше времени, чем ожидали.', project: 'Слайды для внутренней презентации', tags: ['Понятно объясняет'] },
    ],
    archive: [
      { title: 'Лендинг для Tea Room', client: 'Tea Room', gross: 95000, when: '2 сентября', stars: 5 },
      { title: 'Оформление КП для Lumen Studio', client: 'Lumen Studio', gross: 45000, when: '15 августа', stars: 5 },
      { title: 'Слайды для внутренней презентации', client: 'Fit Corner', gross: 40000, when: '28 июля', stars: 4 },
    ],
  },
  {
    id: 's-2', name: 'Дамир Ерғали', initials: 'ДЕ', avatar: 'avatar--b', handle: '@damir.dev',
    headline: 'Telegram-боты и автоматизация', level: 'experienced', levelName: 'Опытный на Taskly',
    about: 'Пишу ботов и небольшие веб-сервисы на Python. Работал над 9 проектами: от записи клиентов до внутренних отчётов.',
    directions: ['dev', 'automation'], skills: ['Python', 'Telegram-бот', 'Интеграции API', 'SQL', 'HTML/CSS', 'JavaScript'],
    city: 'Астана · удалённо', completed: 9, onTime: 89, successRate: 100,
    reviews: 7, rating: 4.8, responseTime: 'обычно за 4 часа', verifiedVia: ['Портфолио проверено', 'Практический кейс', 'Проекты на Taskly'],
    availability: 'Берёт 2 проекта в месяц',
    portfolio: [
      { t: 'Бот записи для барбершопа', s: 'Записи, напоминания, отмены', ph: 'скриншот диалога' },
      { t: 'Парсер цен по 6 сайтам', s: 'Ежедневная выгрузка в таблицу', ph: 'таблица выгрузки' },
      { t: 'Внутренний сервис отчётов', s: 'Итоги смен для сети кафе', ph: 'экран сервиса' },
    ],
    reviewList: [
      { who: 'Orda Trade', when: '1 месяц назад', stars: 5, text: 'Сделал парсинг и сам предложил, как ускорить выгрузку.' },
      { who: 'GreenBox', when: '2 месяца назад', stars: 4, text: 'Один раз сдвинули срок на 3 дня, но предупредил заранее.' },
    ],
    archive: [],
  },
  {
    id: 's-3', name: 'Мадина Қайрат', initials: 'МҚ', avatar: 'avatar--c', handle: '@madina.data',
    headline: 'Аналитика и работа с таблицами', level: 'verified', levelName: 'Проверенный специалист',
    about: 'Работаю с таблицами и данными: свожу выгрузки, ищу расхождения, собираю понятные отчёты. Окончила курсы по анализу данных.',
    directions: ['analytics', 'business'], skills: ['Excel', 'Data Analysis', 'SQL', 'Google Sheets'],
    city: 'Шымкент · удалённо', completed: 6, onTime: 100, successRate: 100,
    reviews: 5, rating: 5.0, responseTime: 'обычно за час', verifiedVia: ['Портфолио проверено', 'Тестовое задание', 'Образование подтверждено'],
    availability: 'Свободна',
    portfolio: [
      { t: 'Свод продаж за квартал', s: '4 источника, сводка по месяцам', ph: 'скриншот таблицы' },
      { t: 'Дашборд для отдела закупок', s: 'Google Sheets + графики', ph: 'дашборд' },
      { t: 'Очистка базы клиентов', s: '8 400 строк, поиск дублей', ph: 'пример таблицы' },
    ],
    reviewList: [
      { who: 'Barber Loft', when: '10 дней назад', stars: 5, text: 'Нашла расхождения, которые мы искали месяц. Всё объяснила на созвоне.' },
      { who: 'Bake House', when: '3 недели назад', stars: 5, text: 'Очень аккуратная работа с таблицами, отдала шаблон.' },
    ],
    archive: [],
  },
  {
    id: 's-4', name: 'Тимур Ахметов', initials: 'ТА', avatar: 'avatar--d', handle: '@timur.text',
    headline: 'Тексты, контент-планы, соцсети', level: 'verified', levelName: 'Проверенный специалист',
    about: 'Пишу тексты для соцсетей и сайтов. Веду два небольших аккаунта, делаю контент-планы и разбор аудитории.',
    directions: ['content', 'marketing'], skills: ['Copywriting', 'Контент-план', 'SMM', 'Email-рассылки', 'Лендинг'],
    city: 'Караганда · удалённо', completed: 11, onTime: 91, successRate: 95,
    reviews: 9, rating: 4.7, responseTime: 'обычно за 3 часа', verifiedVia: ['Портфолио проверено', 'Проекты на Taskly'],
    availability: 'Свободен с 1 октября',
    portfolio: [
      { t: 'Контент-план для фитнес-зала', s: '30 дней, 12 готовых постов', ph: 'пример плана' },
      { t: 'Серия писем для доставки', s: '5 писем, 3 сценария', ph: 'пример письма' },
      { t: 'Тексты карточек товаров', s: '46 карточек для маркетплейса', ph: 'пример карточек' },
    ],
    reviewList: [
      { who: 'Fit Corner', when: '1 неделю назад', stars: 5, text: 'Посты зашли аудитории, впервые получили столько откликов.' },
      { who: 'GreenBox', when: '1 месяц назад', stars: 4, text: 'Хорошие тексты, но два поста пришлось заметно переписать.' },
    ],
    archive: [],
  },
  {
    id: 's-5', name: 'Әсел Нұрлан', initials: 'ӘН', avatar: 'avatar--e', handle: '@assel.ui',
    headline: 'Презентации и оформление документов', level: 'new', levelName: 'Новый специалист',
    about: 'Только начала на Taskly. Делаю аккуратные презентации и оформляю документы. Готова к небольшой задаче с проверкой правок.',
    directions: ['design', 'content'], skills: ['Презентации', 'Оформление', 'Figma'],
    city: 'Ақтау · удалённо', completed: 0, onTime: null, successRate: null,
    reviews: 0, rating: null, responseTime: 'обычно за 6 часов', verifiedVia: ['Образование подтверждено', 'Учебные проекты'],
    availability: 'Свободна',
    portfolio: [
      { t: 'Учебная презентация по маркетингу', s: '18 слайдов, курсовая', ph: 'скриншот слайдов' },
      { t: 'Оформление резюме', s: 'Личный проект', ph: 'макет резюме' },
    ],
    reviewList: [],
    archive: [],
  },
  {
    id: 's-6', name: 'Нурсултан Оспанов', initials: 'НО', avatar: 'avatar--a', handle: '@nurs.research',
    headline: 'Исследования и интервью с клиентами', level: 'experienced', levelName: 'Опытный на Taskly',
    about: 'Провожу интервью с клиентами и собираю выводы в понятный отчёт. Делал исследования для общепита и розницы.',
    directions: ['analytics', 'business'], skills: ['Research', 'Data Analysis', 'Презентации', 'Метрики'],
    city: 'Алматы · удалённо', completed: 8, onTime: 100, successRate: 100,
    reviews: 6, rating: 5.0, responseTime: 'обычно за 2 часа', verifiedVia: ['Портфолио проверено', 'Практический кейс', 'Проекты на Taskly'],
    availability: 'Свободен',
    portfolio: [
      { t: 'Интервью: почему уходят покупатели', s: '12 интервью, отчёт 6 страниц', ph: 'скриншот отчёта' },
      { t: 'Опрос по новому меню', s: '180 ответов, свод', ph: 'график опроса' },
    ],
    reviewList: [
      { who: 'Tea Room', when: '2 месяца назад', stars: 5, text: 'Нашёл причины, о которых мы не думали. Отчёт прочитали всей командой.' },
    ],
    archive: [],
  },
];

const STAGES4 = ['Подготовка', 'Основная работа', 'Проверка', 'Финальный результат'];

function seedProjects() {
  const base = { status: 'searching', stage: 0, specialistId: null, paid: false, mine: false, editsUsed: 0, requirements: '', format: ['remote'] };
  const list = [
    {
      id: 'p-1041', title: 'Лендинг для барбершопа', client: 'Barber Loft', clientId: 'c-me', mine: true, verified: true, clientSince: 2025,
      brief: 'Нужен одностраничный сайт: услуги, прайс, фото работ, кнопка записи в WhatsApp. Своих фото пока мало — обсудим.',
      result: 'Готовая страница, адаптивная под телефон, ссылка на опубликованную версию и исходники в Figma.',
      includes: ['Дизайн в Figma', 'Вёрстка страницы', 'Адаптив под телефон', 'Кнопка записи в WhatsApp'],
      excludes: ['Домен и хостинг', 'Фотографии работ', 'Тексты пишет заказчик'],
      materials: ['Логотип в векторе', 'Прайс в PDF', '3 фото интерьера'],
      requirements: 'Спокойная типографика, без ярких блоков. Кнопка записи видна с первого экрана на телефоне.',
      days: 12, price: 100000, edits: 2, level: 'junior',
      directions: ['design', 'dev'], skills: ['Figma', 'UI/UX', 'Лендинг', 'HTML/CSS'],
      posted: '2 часа назад', stages: ['Подготовка', 'Дизайн и вёрстка', 'Проверка', 'Финальный результат'],
    },
    {
      id: 'p-1042', title: 'Telegram-бот для записи клиентов', client: 'Barber Loft', clientId: 'c-me', mine: true, verified: true, clientSince: 2025,
      status: 'in_work', stage: 1, specialistId: 's-2', paid: true, agreedPrice: 180000, agreedDays: 21, dueDate: addDays(null, 9),
      brief: 'Нужен бот: клиент выбирает услугу, дату и время, бот присылает подтверждение и напоминание за 2 часа.',
      result: 'Работающий бот в Telegram, подключённый к Google Таблице записей, и короткая инструкция для администратора.',
      includes: ['Сценарий диалога', 'Сам бот и подключение', 'Запись данных в Google Sheets', 'Напоминания'],
      excludes: ['Онлайн-оплата', 'Интеграция с CRM', 'Мобильное приложение'],
      materials: ['Список услуг с длительностью', 'Правила переноса записи'],
      days: 21, price: 180000, edits: 2, level: 'core',
      directions: ['automation', 'dev'], skills: ['Telegram-бот', 'Python', 'Интеграции API', 'Google Sheets'],
      format: ['remote', 'calls'], posted: '2 недели назад',
      stages: ['Сценарий и согласование', 'Разработка', 'Тест на реальных записях', 'Передача и инструкция'],
    },
    {
      id: 'p-1043', title: 'Свести таблицу заказов за квартал', client: 'Barber Loft', clientId: 'c-me', mine: true, verified: true, clientSince: 2025,
      status: 'done', stage: 3, specialistId: 's-3', paid: true, agreedPrice: 60000, agreedDays: 5, dueDate: addDays(null, -24), reviewByClient: true, completedAt: '18 сентября',
      brief: 'Есть 4 выгрузки из касс за квартал, названия услуг написаны по-разному. Нужно свести, найти расхождения и собрать свод.',
      result: 'Один файл Excel: свод по месяцам и услугам, лист с расхождениями, короткая записка о найденных проблемах.',
      includes: ['Сверка и очистка данных', 'Сводная таблица', 'Лист расхождений', 'Короткая записка'],
      excludes: ['Автоматизация загрузки', 'Визуализация в BI'],
      materials: ['4 файла CSV', 'Список услуг', 'Правила учёта'],
      days: 5, price: 60000, edits: 1, level: 'junior',
      directions: ['analytics', 'business'], skills: ['Excel', 'Data Analysis', 'Подбор данных'],
      format: ['remote', 'fixed'], posted: '1 месяц назад', stages: ['Сверка данных', 'Свод и выводы', 'Проверка'],
    },
    {
      id: 'p-1044', title: 'Оформить коммерческое предложение в PDF', client: 'Barber Loft', clientId: 'c-me', mine: true, verified: true, clientSince: 2025,
      status: 'on_review', stage: 2, specialistId: 's-1', paid: true, agreedPrice: 45000, agreedDays: 5, dueDate: addDays(null, 2),
      brief: 'Есть текст и фотографии. Нужно собрать КП на 6 страниц: обложка, о нас, услуги, кейсы, цены, контакты.',
      result: 'PDF-файл в брендинге компании плюс исходник, чтобы можно было править текст самостоятельно.',
      includes: ['Вёрстка 6 страниц', 'Работа с фото', 'PDF и исходник', 'Версия для печати'],
      excludes: ['Печать', 'Тексты', 'Фотосъёмка'],
      materials: ['Логотип', 'Тексты в Word', 'Фото объектов'],
      days: 4, price: 45000, edits: 2, level: 'junior',
      directions: ['design', 'content'], skills: ['Презентации', 'Оформление', 'Figma'],
      format: ['remote', 'fixed'], posted: '3 недели назад', stages: ['Структура и обложка', 'Вёрстка', 'Финальная вычитка'],
    },
    {
      id: 'p-1053', title: 'Редизайн меню и прайса для Tea Room', client: 'Tea Room', clientId: 'c-5', verified: true, clientSince: 2025,
      status: 'in_work', stage: 1, specialistId: 's-1', paid: true, agreedPrice: 70000, agreedDays: 10, dueDate: addDays(null, 6),
      brief: 'Обновить меню и прайс: печатная версия для зала и версия для Instagram. Сейчас меню сложно читать, цены теряются.',
      result: 'Макеты меню (А4 и сторис) в Figma, PDF для печати и PNG для соцсетей.',
      includes: ['Меню А4, 2 страницы', 'Прайс для сторис', 'PDF и PNG'],
      excludes: ['Фотосъёмка блюд', 'Печать', 'Тексты описаний'],
      materials: ['Текущее меню', 'Логотип', 'Фото напитков'],
      requirements: 'Спокойные цвета бренда, крупные цены, позиции по категориям.',
      days: 10, price: 70000, edits: 2, level: 'junior',
      directions: ['design'], skills: ['Figma', 'Оформление', 'Презентации'],
      posted: '1 неделю назад', stages: ['Структура', 'Макеты', 'Проверка', 'Финальные файлы'],
    },
    {
      id: 'p-1045', title: 'Исследование: почему клиенты не возвращаются', client: 'Tea Room', clientId: 'c-5', verified: true, clientSince: 2025,
      brief: 'Нужно поговорить с 12 покупателями, которые приходили один раз, и понять причины. Записи разговоров приветствуются.',
      result: 'Отчёт на 4–6 страниц: гипотезы, выводы из интервью, 5 конкретных предложений, цитаты клиентов.',
      includes: ['Гайд для интервью', '12 интервью', 'Анализ и отчёт'],
      excludes: ['Опрос в соцсетях', 'Анализ конкурентов'],
      materials: ['База контактов', 'Краткое описание продукта'],
      days: 14, price: 140000, edits: 1, level: 'core',
      directions: ['analytics', 'business'], skills: ['Research', 'Data Analysis', 'Презентации'],
      format: ['remote', 'calls'], posted: '2 дня назад',
      stages: ['Гайд и пилотные интервью', 'Основные интервью', 'Отчёт и защита выводов'],
    },
    {
      id: 'p-1046', title: 'Парсинг отзывов конкурентов для анализа', client: 'GreenBox', clientId: 'c-6', verified: false, clientSince: 2026,
      brief: 'Собрать отзывы о 5 конкурентах с карт и маркетплейсов, привести в таблицу и разметить по темам.',
      result: 'Таблица с 800+ отзывами, разметка по 6 темам и короткий вывод: на что чаще жалуются.',
      includes: ['Сбор данных', 'Очистка и разметка', 'Свод по темам'],
      excludes: ['Отчёт в презентации', 'Рекомендации по продукту'],
      materials: ['Список конкурентов и ссылок'],
      days: 7, price: 80000, edits: 1, level: 'junior',
      directions: ['automation', 'analytics'], skills: ['Парсинг данных', 'Python', 'Excel'],
      format: ['remote', 'fixed'], posted: '2 дня назад', stages: ['Сбор', 'Разметка', 'Свод и проверка'],
    },
    {
      id: 'p-1047', title: 'Контент-план и 12 постов для Instagram', client: 'Fit Corner', clientId: 'c-7', verified: true, clientSince: 2025,
      brief: 'Нужен план на месяц и 12 готовых постов: текст, идея визуала, хештеги. Отдельно — 4 поста с историями клиентов.',
      result: 'Документ с контент-планом и 12 постами, готовыми к публикации.',
      includes: ['Контент-план на месяц', '12 постов с текстом', 'Идеи визуалов'],
      excludes: ['Съёмка', 'Дизайн постов', 'Публикация'],
      materials: ['Описание зала', 'Прайс', 'Список акций'],
      days: 10, price: 70000, edits: 2, level: 'junior',
      directions: ['content', 'marketing'], skills: ['Copywriting', 'Контент-план', 'SMM'],
      posted: '3 дня назад', stages: ['Идеи и структура', 'Тексты', 'Финальная правка'],
    },
    {
      id: 'p-1048', title: 'Описать регламент работы склада', client: 'Orda Trade', clientId: 'c-8', verified: true, clientSince: 2024,
      brief: 'Нужно поговорить с руководителем склада и оформить текущие процессы в понятные инструкции для новичков.',
      result: 'Регламент на 10–12 страниц: приёмка, хранение, сборка заказа, отгрузка, возвраты. Плюс чек-лист новичка.',
      includes: ['2 интервью', 'Описание процессов', 'Чек-лист для новичка'],
      excludes: ['Обучение сотрудников', 'Видео-инструкции'],
      materials: ['Доступ к складу онлайн', 'Примеры документов'],
      days: 14, price: 120000, edits: 2, level: 'core',
      directions: ['business', 'content'], skills: ['Регламенты', 'Документация', 'Research'],
      format: ['remote', 'calls'], posted: '4 дня назад', stages: ['Интервью и черновик', 'Согласование', 'Финальный документ'],
    },
    {
      id: 'p-1049', title: 'Настроить автоответы и напоминания в CRM', client: 'Dent Plus', clientId: 'c-9', verified: false, clientSince: 2026,
      brief: 'Клиенты забывают о приёме. Нужно настроить автоматические SMS и сообщения в WhatsApp за день и за 2 часа до визита.',
      result: 'Работающая цепочка напоминаний, шаблоны сообщений и инструкция, как менять текст.',
      includes: ['Настройка шаблонов', 'Цепочка напоминаний', 'Тест на 10 записях'],
      excludes: ['Оплата подписки сервиса', 'Интеграция с 1С'],
      materials: ['Доступ к CRM', 'Тексты напоминаний от клиники'],
      days: 6, price: 90000, edits: 1, level: 'junior',
      directions: ['automation', 'marketing'], skills: ['Автоматизация процессов', 'Интеграции API', 'No-code'],
      posted: '4 дня назад', stages: ['Схема напоминаний', 'Настройка', 'Тест и передача'],
    },
    {
      id: 'p-1050', title: 'Аудит сайта: где теряются заявки', client: 'AutoLine', clientId: 'c-10', verified: true, clientSince: 2025,
      brief: 'Много трафика, но мало заявок. Нужно пройти путь клиента, найти слабые места и предложить, что исправить в первую очередь.',
      result: 'Отчёт: разбор пути клиента по шагам, список проблем по приоритету, 7 конкретных правок с описанием.',
      includes: ['Разбор воронки', 'Проверка форм и мобильной версии', 'Список правок по приоритету'],
      excludes: ['Внесение правок на сайт', 'Настройка рекламы', 'A/B-тесты'],
      materials: ['Доступ к аналитике', 'Ссылки на ключевые страницы'],
      days: 8, price: 110000, edits: 1, level: 'core',
      directions: ['analytics', 'marketing', 'design'], skills: ['Research', 'UI/UX', 'Метрики', 'Data Analysis'],
      format: ['remote', 'calls'], posted: '5 дней назад', stages: ['Сбор данных', 'Разбор пути клиента', 'Отчёт и приоритеты'],
    },
    {
      id: 'p-1051', title: 'Мини-приложение для учёта заявок', client: 'Prime Service', clientId: 'c-11', verified: true, clientSince: 2025,
      brief: 'Заявки теряются в переписках. Нужно простое веб-приложение: список заявок, статусы, ответственный.',
      result: 'Работающее веб-приложение, развёрнутое на нашем хостинге, и инструкция для сотрудников.',
      includes: ['Форма заявки', 'Список и статусы', 'Роли сотрудников', 'Развёртывание'],
      excludes: ['Мобильное приложение', 'Бухгалтерия'],
      materials: ['Поля заявки', 'Схема ролей'],
      days: 30, price: 260000, edits: 3, level: 'core',
      directions: ['dev', 'automation', 'design'], skills: ['UI/UX', 'React', 'HTML/CSS', 'Интеграции API'],
      format: ['remote', 'calls', 'ongoing'], posted: '6 дней назад', stages: ['Прототип', 'Основная разработка', 'Тест с сотрудниками', 'Передача'],
    },
    {
      id: 'p-1052', title: 'Найти поставщиков упаковки и сравнить цены', client: 'Bake House', clientId: 'c-12', verified: false, clientSince: 2026,
      brief: 'Нужны 4–5 поставщиков коробок для десертов, сравнение по цене, сроку и минимальной партии.',
      result: 'Таблица сравнения по 6 критериям и короткая рекомендация, с кем начинать.',
      includes: ['Поиск поставщиков', 'Запрос цен', 'Сравнение и рекомендация'],
      excludes: ['Закупка', 'Проверка качества образцов'],
      materials: ['Размеры и типы упаковки', 'Объём заказа'],
      days: 6, price: 55000, edits: 1, level: 'junior',
      directions: ['business', 'other'], skills: ['Research', 'Excel', 'Подбор данных'],
      posted: '1 неделю назад', stages: ['Поиск и запросы', 'Сравнение', 'Рекомендация'],
    },
    {
      id: 'p-1054', title: 'Оформить презентацию для инвесторов', client: 'Lumen Studio', clientId: 'c-4', verified: true, clientSince: 2024,
      brief: 'Есть черновик презентации на 14 слайдов в Google Slides. Нужно привести в порядок: сетка, типографика, графики.',
      result: 'Презентация в Figma и PDF, единый стиль, 3 графика из наших таблиц.',
      includes: ['Редизайн 14 слайдов', '3 графика', 'PDF и исходник'],
      excludes: ['Тексты', 'Финансовая модель'],
      materials: ['Черновик презентации', 'Брендбук', 'Таблицы с цифрами'],
      days: 5, price: 65000, edits: 2, level: 'junior',
      directions: ['design'], skills: ['Презентации', 'Figma', 'Оформление'],
      posted: '1 день назад', stages: ['Структура', 'Слайды', 'Финальная проверка'],
    },
  ];
  const others = { 'p-1045': 3, 'p-1046': 6, 'p-1047': 14, 'p-1048': 2, 'p-1049': 5, 'p-1050': 7, 'p-1051': 5, 'p-1052': 10, 'p-1054': 4 };
  return list.map((p) => ({ ...base, stages: STAGES4, otherProposals: others[p.id] || 0, ...p }));
}

function seedProposals() {
  return [
    { id: 'pr-1', projectId: 'p-1041', specialistId: 's-1', price: 100000, days: 12, created: '3 часа назад', status: 'sent', read: false,
      message: 'Здравствуйте! Делала похожий лендинг для языковой школы — можно посмотреть в портфолио. Соберу структуру на первом созвоне, дальше работаю по секциям. Правки внесу без задержек.',
      portfolio: 'Лендинг для языковой школы' },
    { id: 'pr-2', projectId: 'p-1041', specialistId: 's-5', price: 78000, days: 14, created: '5 часов назад', status: 'sent', read: false,
      message: 'Могу собрать аккуратный одностраничник. Опыта с коммерческими сайтами пока мало, но зато готова уделить проекту много времени и делать правки внимательно.',
      portfolio: 'Учебная презентация по маркетингу' },
    { id: 'pr-3', projectId: 'p-1041', specialistId: 's-4', price: 95000, days: 10, created: '1 день назад', status: 'viewed', read: true,
      message: 'Сделаю сайт и заодно помогу с текстами, если нужно — часто это самая долгая часть. Есть примеры похожих страниц.',
      portfolio: 'Тексты карточек товаров' },
    { id: 'pr-4', projectId: 'p-1041', specialistId: 's-2', price: 130000, days: 8, created: '1 день назад', status: 'viewed', read: true,
      message: 'Могу сделать и вёрстку, и техническую часть: подключу форму, настрою отправку заявок. Есть опыт с подобными задачами.',
      portfolio: 'Бот записи для барбершопа' },
    { id: 'pr-5', projectId: 'p-1054', specialistId: 's-1', price: 65000, days: 5, created: '1 день назад', status: 'sent', read: false,
      message: 'Приведу слайды к единой сетке и типографике, графики соберу из ваших таблиц.', portfolio: 'Учебный проект: сервис аренды' },
    { id: 'pr-6', projectId: 'p-1050', specialistId: 's-1', price: 98000, days: 8, created: '3 дня назад', status: 'viewed', read: true,
      message: 'Пройду путь клиента на телефоне и компьютере, соберу список правок по приоритету со скриншотами.', portfolio: 'Мобильный экран записи' },
    { id: 'pr-7', projectId: 'p-1051', specialistId: 's-1', price: 240000, days: 30, created: '4 дня назад', status: 'invited', read: true,
      message: 'Возьму интерфейс и вёрстку, для серверной части привлеку напарника — опишу распределение на созвоне.', portfolio: 'Учебный проект: сервис аренды' },
    { id: 'pr-8', projectId: 'p-1043', specialistId: 's-1', price: 60000, days: 5, created: '1 месяц назад', status: 'declined', read: true,
      message: 'Сведу таблицы и подготовлю короткую записку по расхождениям.', portfolio: 'Учебный проект: сервис аренды' },
  ];
}

function seedMessages() {
  return {
    'p-1042': [
      { id: 'm4', from: 'system', text: 'Оплата зарезервирована до завершения проекта · ' + money(180000), when: '26 сентября, 10:02' },
      { id: 'm1', from: 'specialist', text: 'Здравствуйте! Посмотрел ТЗ, всё понятно. Начинаю со сценария диалога — пришлю в течение двух дней.', when: '26 сентября, 11:20' },
      { id: 'm2', from: 'client', text: 'Отлично. Администратор сможет посмотреть черновик до доработки?', when: '26 сентября, 11:34' },
      { id: 'm3', from: 'specialist', text: 'Да, выложу в файлы как схему. После вашего «ок» перенесу в бота.', when: '26 сентября, 11:41' },
      { id: 'm5', from: 'specialist', text: 'Загрузил схему сценария: 4 ветки, напоминания за день и за 2 часа.', when: '27 сентября, 16:10', file: 'Сценарий-диалога-v1.pdf' },
    ],
    'p-1044': [
      { id: 'm6', from: 'specialist', text: 'Готово, отправила результат на проверку. В файлах — PDF и исходник Figma.', when: '27 сентября, 18:02', file: 'KP-final.pdf' },
      { id: 'm7', from: 'client', text: 'Спасибо, посмотрим сегодня и вернёмся с ответом.', when: '27 сентября, 18:30' },
    ],
    'p-1053': [
      { id: 'm8', from: 'system', text: 'Оплата зарезервирована до завершения проекта · ' + money(70000), when: '2 октября, 09:15' },
      { id: 'm9', from: 'client', text: 'Аружан, добрый день! Прислали фото напитков в файлы. Меню на А4 — главное, сторис можно позже.', when: '2 октября, 10:05' },
      { id: 'm10', from: 'specialist', text: 'Добрый день! Структуру по категориям выложила, жду ваш «ок» — потом перехожу к макетам.', when: '3 октября, 14:40', file: 'Структура-меню.pdf' },
    ],
  };
}

function seedFiles() {
  return {
    'p-1042': [
      { name: 'ТЗ-Barber-Loft.pdf', size: '184 КБ', who: 'sealed', when: '26 сентября', kind: 'pdf' },
      { name: 'Сценарий-диалога-v1.pdf', size: '640 КБ', who: 'specialist', when: '27 сентября', kind: 'pdf' },
      { name: 'Примеры-бота.txt', size: '3 КБ', who: 'client', when: '26 сентября', kind: 'txt' },
    ],
    'p-1044': [
      { name: 'ТЗ-КП.pdf', size: '96 КБ', who: 'sealed', when: '20 сентября', kind: 'pdf' },
      { name: 'KP-final.pdf', size: '2,1 МБ', who: 'specialist', when: '27 сентября', kind: 'pdf', final: true },
      { name: 'KP-исходник.fig', size: '4,8 МБ', who: 'specialist', when: '27 сентября', kind: 'fig', final: true },
      { name: 'Тексты-КП.docx', size: '42 КБ', who: 'client', when: '20 сентября', kind: 'doc' },
    ],
    'p-1043': [
      { name: 'ТЗ-свод-таблиц.pdf', size: '88 КБ', who: 'sealed', when: '10 сентября', kind: 'pdf' },
      { name: 'Свод-за-квартал.xlsx', size: '312 КБ', who: 'specialist', when: '17 сентября', kind: 'xls', final: true },
    ],
    'p-1053': [
      { name: 'ТЗ-меню-Tea-Room.pdf', size: '102 КБ', who: 'sealed', when: '2 октября', kind: 'pdf' },
      { name: 'Фото-напитков.zip', size: '18 МБ', who: 'client', when: '2 октября', kind: 'zip' },
      { name: 'Структура-меню.pdf', size: '210 КБ', who: 'specialist', when: '3 октября', kind: 'pdf' },
    ],
  };
}

function seedChangeRequests() {
  return [
    { id: 'cr-1', projectId: 'p-1042', proposedBy: 'client', status: 'pending',
      title: 'Добавить перенос записи', what: 'Клиент должен уметь перенести запись на другое время без звонка администратору.',
      priceFrom: 180000, priceTo: 205000, daysFrom: 21, daysTo: 25,
      note: 'Нужна ещё одна ветка диалога и проверка доступных слотов.', when: '27 сентября' },
    { id: 'cr-2', projectId: 'p-1044', proposedBy: 'specialist', status: 'approved',
      title: 'Добавить версию для печати', what: 'Заказчик попросил вариант PDF с полями под печать. Согласовано, входит в текущую стоимость.',
      priceFrom: 45000, priceTo: 45000, daysFrom: 4, daysTo: 5,
      note: 'Дополнительная вёрстка страницы под печать.', when: '24 сентября' },
    { id: 'cr-3', projectId: 'p-1053', proposedBy: 'client', status: 'pending',
      title: 'Добавить меню на казахском', what: 'Нужна вторая версия меню А4 на казахском языке. Тексты переведём сами.',
      priceFrom: 70000, priceTo: 82000, daysFrom: 10, daysTo: 12,
      note: 'Дополнительная вёрстка двух страниц.', when: '4 октября' },
  ];
}

function seedReviews() {
  return [
    { id: 'r-1', projectId: 'p-1043', from: 'client', to: 's-3', stars: 5, when: '10 дней назад', tags: ['Аккуратные файлы', 'Понятно объясняет'],
      text: 'Нашла расхождения, которые мы искали месяц. Всё объяснила на созвоне, файл собрала аккуратно.' },
  ];
}

function seedNotifications() {
  return [
    { id: 'n-1', role: 'client', to: '/biz/workspace/p-1044', text: 'Исполнитель отправил результат по проекту «Оформить коммерческое предложение в PDF»', when: '40 минут назад', unread: true, kind: 'delivery' },
    { id: 'n-2', role: 'client', to: '/biz/projects/p-1041/proposals', text: '2 новых отклика на проект «Лендинг для барбершопа»', when: '2 часа назад', unread: true, kind: 'proposal' },
    { id: 'n-3', role: 'client', to: '/biz/workspace/p-1042?s=stages', text: 'Этап «Разработка» по проекту «Telegram-бот для записи клиентов» перешёл в работу', when: 'вчера', unread: false, kind: 'stage' },
    { id: 'n-4', role: 'client', to: '/biz/history', text: 'Платёж по проекту «Свести таблицу заказов за квартал» отправлен исполнителю', when: '3 дня назад', unread: false, kind: 'payment' },
    { id: 'n-5', role: 'specialist', to: '/spec/proposals', text: 'Вас выбрали исполнителем: «Мини-приложение для учёта заявок»', when: '15 минут назад', unread: true, kind: 'invite' },
    { id: 'n-6', role: 'specialist', to: '/spec/workspace/p-1053?s=changes', text: 'Tea Room предлагает изменить задачу «Редизайн меню и прайса для Tea Room»', when: '5 часов назад', unread: true, kind: 'change' },
    { id: 'n-7', role: 'specialist', to: '/spec/projects/p-1054', text: 'Новый проект подходит вашим навыкам: «Оформить презентацию для инвесторов»', when: 'вчера', unread: false, kind: 'match' },
    { id: 'n-8', role: 'specialist', to: '/spec/payout', text: 'Выплата 90 250 ₸ за «Лендинг для Tea Room» зачислена на вашу карту', when: '4 дня назад', unread: false, kind: 'payout' },
  ];
}

export function seedEntities() {
  return {
    projects: seedProjects(),
    proposals: seedProposals(),
    messages: seedMessages(),
    files: seedFiles(),
    changeRequests: seedChangeRequests(),
    reviews: seedReviews(),
    notifications: seedNotifications(),
  };
}
