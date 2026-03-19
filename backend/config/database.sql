-- ============================================================
-- FinCredit Pro — Schéma PostgreSQL complet
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── TABLE USERS ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name         VARCHAR(100) NOT NULL,
  email        VARCHAR(150) UNIQUE NOT NULL,
  password     VARCHAR(255) NOT NULL,
  role         VARCHAR(20)  DEFAULT 'client' CHECK(role IN ('client','admin')),
  phone        VARCHAR(20),
  cin          VARCHAR(20),
  address      TEXT,
  profession   VARCHAR(100),
  income       NUMERIC(12,2),
  credit_score INT          DEFAULT 650,
  is_active    BOOLEAN      DEFAULT TRUE,
  created_at   TIMESTAMP    DEFAULT NOW(),
  updated_at   TIMESTAMP    DEFAULT NOW()
);

-- ── TABLE CREDITS ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS credits (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
  credit_type     VARCHAR(50)    NOT NULL,
  amount          NUMERIC(14,2)  NOT NULL,
  duration_months INT            NOT NULL,
  interest_rate   NUMERIC(5,2)   NOT NULL,
  monthly_payment NUMERIC(12,2)  NOT NULL,
  total_cost      NUMERIC(14,2)  NOT NULL,
  total_interest  NUMERIC(14,2)  NOT NULL,
  remaining_amount NUMERIC(14,2),
  status          VARCHAR(20)    DEFAULT 'active' CHECK(status IN ('active','closed','defaulted')),
  start_date      DATE,
  end_date        DATE,
  created_at      TIMESTAMP      DEFAULT NOW()
);

-- ── TABLE CREDIT_REQUESTS ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS credit_requests (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID REFERENCES users(id) ON DELETE CASCADE,
  credit_type      VARCHAR(50)   NOT NULL,
  amount           NUMERIC(14,2) NOT NULL,
  duration_months  INT           NOT NULL,
  interest_rate    NUMERIC(5,2)  DEFAULT 7.5,
  purpose          TEXT,
  monthly_payment  NUMERIC(12,2),
  status           VARCHAR(20)   DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected')),
  rejection_reason TEXT,
  documents        JSONB         DEFAULT '[]',
  reviewed_by      UUID REFERENCES users(id),
  reviewed_at      TIMESTAMP,
  request_date     TIMESTAMP     DEFAULT NOW(),
  updated_at       TIMESTAMP     DEFAULT NOW()
);

-- ── TABLE NOTIFICATIONS ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID REFERENCES users(id) ON DELETE CASCADE,
  title      VARCHAR(200) NOT NULL,
  message    TEXT         NOT NULL,
  type       VARCHAR(30)  DEFAULT 'info' CHECK(type IN ('info','success','warning','danger')),
  is_read    BOOLEAN      DEFAULT FALSE,
  created_at TIMESTAMP    DEFAULT NOW()
);

-- ── INDEX ─────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_credits_user     ON credits(user_id);
CREATE INDEX IF NOT EXISTS idx_requests_user    ON credit_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_requests_status  ON credit_requests(status);
CREATE INDEX IF NOT EXISTS idx_notif_user_read  ON notifications(user_id, is_read);

-- ── ADMIN PAR DÉFAUT ──────────────────────────────────────────
-- Mot de passe : admin123  (bcrypt hash)
INSERT INTO users (name, email, password, role)
VALUES (
  'Admin Principal',
  'admin@fincredit.tn',
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewuefEh.kARlwgH2',
  'admin'
) ON CONFLICT (email) DO NOTHING;

-- CLIENT DE TEST — Mot de passe : client123
INSERT INTO users (name, email, password, role, phone, profession, income, credit_score)
VALUES (
  'Mohamed Aziz',
  'client@test.tn',
  '$2a$12$XbXbRVrLXYjbXJOHxnlHROHhHlRoIStpSQlwLcz1X3dQr0zWfWbHO',
  'client',
  '+216 71 234 567',
  'Ingénieur',
  4500.00,
  782
) ON CONFLICT (email) DO NOTHING;
