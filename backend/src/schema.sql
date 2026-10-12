-- Taskly — схема базы данных (PostgreSQL).
-- Скрипт идемпотентный: его можно запускать при каждом старте сервера.

CREATE SEQUENCE IF NOT EXISTS id_seq START 3000;

-- Пользователь. Один аккаунт может быть и заказчиком, и специалистом;
-- active_role — какой кабинет открыт сейчас.
CREATE TABLE IF NOT EXISTS users (
  id            text PRIMARY KEY DEFAULT ('u-' || nextval('id_seq')),
  email         text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  name          text NOT NULL,
  active_role   text NOT NULL DEFAULT 'client' CHECK (active_role IN ('client', 'specialist')),
  is_demo       boolean NOT NULL DEFAULT false,
  draft         jsonb,                                  -- черновик мастера создания проекта
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- Профиль бизнеса (роль «заказчик»)
CREATE TABLE IF NOT EXISTS business_profiles (
  user_id  text PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  company  text NOT NULL,
  sphere   text,
  city     text,
  site     text,
  about    text,
  verified boolean NOT NULL DEFAULT false,
  since    int NOT NULL DEFAULT EXTRACT(YEAR FROM now())::int
);

-- Профиль специалиста. legacy — история до Taskly (импорт демо-данных),
-- остальные показатели считаются из проектов и отзывов.
CREATE TABLE IF NOT EXISTS specialist_profiles (
  user_id       text PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  handle        text,
  avatar        text NOT NULL DEFAULT 'avatar--a',
  headline      text NOT NULL DEFAULT '',
  about         text NOT NULL DEFAULT '',
  level         text NOT NULL DEFAULT 'new' CHECK (level IN ('new', 'verified', 'experienced')),
  city          text NOT NULL DEFAULT 'удалённо',
  availability  text NOT NULL DEFAULT 'Свободен(на)',
  response_time text NOT NULL DEFAULT 'обычно в течение дня',
  directions    text[] NOT NULL DEFAULT '{}',
  skills        text[] NOT NULL DEFAULT '{}',
  verified_via  text[] NOT NULL DEFAULT '{}',
  portfolio     jsonb NOT NULL DEFAULT '[]',
  legacy        jsonb NOT NULL DEFAULT '{}'
);

-- Проект = ТЗ + сделка. Статус меняется только через API сделки.
CREATE TABLE IF NOT EXISTS projects (
  id              text PRIMARY KEY DEFAULT ('p-' || nextval('id_seq')),
  client_id       text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  specialist_id   text REFERENCES users(id) ON DELETE SET NULL,
  title           text NOT NULL,
  brief           text NOT NULL DEFAULT '',
  result          text NOT NULL DEFAULT '',
  includes        text[] NOT NULL DEFAULT '{}',
  excludes        text[] NOT NULL DEFAULT '{}',
  materials       text[] NOT NULL DEFAULT '{}',
  requirements    text NOT NULL DEFAULT '',
  price           int NOT NULL CHECK (price > 0),       -- бюджет из ТЗ, ₸
  days            int NOT NULL CHECK (days > 0),
  edits           int NOT NULL DEFAULT 1 CHECK (edits >= 0),
  edits_used      int NOT NULL DEFAULT 0,
  level           text NOT NULL DEFAULT 'any',
  directions      text[] NOT NULL DEFAULT '{}',
  skills          text[] NOT NULL DEFAULT '{}',
  format          text[] NOT NULL DEFAULT '{}',
  stages          text[] NOT NULL,
  status          text NOT NULL DEFAULT 'searching'
                  CHECK (status IN ('published', 'searching', 'awaiting_payment', 'in_work', 'on_review', 'needs_fix', 'done', 'cancelled')),
  stage           int NOT NULL DEFAULT 0,
  agreed_price    int,                                  -- условия после выбора исполнителя
  agreed_days     int,
  due_date        date,
  paid            boolean NOT NULL DEFAULT false,
  other_proposals int NOT NULL DEFAULT 0,               -- демо: отклики вне демо-таблицы
  review_by_client     boolean NOT NULL DEFAULT false,
  review_by_specialist boolean NOT NULL DEFAULT false,
  posted_at       timestamptz NOT NULL DEFAULT now(),
  completed_at    timestamptz
);
CREATE INDEX IF NOT EXISTS projects_client_idx ON projects (client_id);
CREATE INDEX IF NOT EXISTS projects_specialist_idx ON projects (specialist_id);
CREATE INDEX IF NOT EXISTS projects_status_idx ON projects (status);

-- Отклики специалистов
CREATE TABLE IF NOT EXISTS proposals (
  id            text PRIMARY KEY DEFAULT ('pr-' || nextval('id_seq')),
  project_id    text NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  specialist_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  price         int NOT NULL CHECK (price > 0),
  days          int NOT NULL CHECK (days > 0),
  message       text NOT NULL,
  portfolio     text,
  status        text NOT NULL DEFAULT 'sent'
                CHECK (status IN ('sent', 'viewed', 'invited', 'accepted', 'declined', 'withdrawn')),
  read          boolean NOT NULL DEFAULT false,
  created_at    timestamptz NOT NULL DEFAULT now()
);
-- Один активный отклик специалиста на проект
CREATE UNIQUE INDEX IF NOT EXISTS proposals_one_active
  ON proposals (project_id, specialist_id) WHERE status IN ('sent', 'viewed', 'invited', 'accepted');

-- Резерв оплаты (демо-провайдер). Комиссия считается только на сервере.
CREATE TABLE IF NOT EXISTS payments (
  id          text PRIMARY KEY DEFAULT ('pay-' || nextval('id_seq')),
  project_id  text NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  amount      int NOT NULL,
  fee         int NOT NULL,
  payout      int NOT NULL,
  status      text NOT NULL DEFAULT 'reserved' CHECK (status IN ('reserved', 'released', 'refunded')),
  provider    text NOT NULL DEFAULT 'demo',
  created_at  timestamptz NOT NULL DEFAULT now(),
  released_at timestamptz
);

-- Переписка по проекту. sender — роль автора, system — сообщения платформы.
CREATE TABLE IF NOT EXISTS messages (
  id         text PRIMARY KEY DEFAULT ('m-' || nextval('id_seq')),
  project_id text NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  sender     text NOT NULL CHECK (sender IN ('client', 'specialist', 'system')),
  author_id  text REFERENCES users(id) ON DELETE SET NULL,
  text       text NOT NULL,
  file       text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS messages_project_idx ON messages (project_id, created_at);

-- Файлы проекта (пока только метаданные; хранилище — следующий этап)
CREATE TABLE IF NOT EXISTS files (
  id         text PRIMARY KEY DEFAULT ('f-' || nextval('id_seq')),
  project_id text NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name       text NOT NULL,
  size       text,
  kind       text,
  who        text NOT NULL CHECK (who IN ('client', 'specialist', 'sealed')),
  final      boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Изменения задачи: предлагает одна сторона, решает другая
CREATE TABLE IF NOT EXISTS change_requests (
  id          text PRIMARY KEY DEFAULT ('cr-' || nextval('id_seq')),
  project_id  text NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  proposed_by text NOT NULL CHECK (proposed_by IN ('client', 'specialist')),
  status      text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  title       text NOT NULL,
  what        text NOT NULL,
  note        text NOT NULL DEFAULT '',
  price_from  int NOT NULL,
  price_to    int NOT NULL,
  days_from   int NOT NULL,
  days_to     int NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Отзывы: по одному от каждой стороны на проект
CREATE TABLE IF NOT EXISTS reviews (
  id         text PRIMARY KEY DEFAULT ('r-' || nextval('id_seq')),
  project_id text NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  from_role  text NOT NULL CHECK (from_role IN ('client', 'specialist')),
  author_id  text REFERENCES users(id) ON DELETE SET NULL,
  target_id  text REFERENCES users(id) ON DELETE CASCADE,
  stars      int NOT NULL CHECK (stars BETWEEN 1 AND 5),
  tags       text[] NOT NULL DEFAULT '{}',
  text       text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (project_id, from_role)
);

-- Уведомления. link — куда ведёт клик, role — в каком кабинете показывать.
CREATE TABLE IF NOT EXISTS notifications (
  id         text PRIMARY KEY DEFAULT ('n-' || nextval('id_seq')),
  user_id    text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role       text NOT NULL CHECK (role IN ('client', 'specialist')),
  link       text NOT NULL,
  text       text NOT NULL,
  kind       text NOT NULL,
  unread     boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS notifications_user_idx ON notifications (user_id, created_at DESC);

-- Сохранённые проекты специалиста
CREATE TABLE IF NOT EXISTS saved_projects (
  user_id    text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  project_id text NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, project_id)
);
