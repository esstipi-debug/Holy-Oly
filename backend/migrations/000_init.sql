-- =====================================================================
-- 000_init.sql · Bootstrap idempotente del esquema base
-- =====================================================================
-- Se ejecuta ANTES de las migraciones 001-005. Crea las tablas mínimas
-- que el resto del sistema asume que existen.
--
-- Diseñado para correr en cada deploy sin romper nada (IF NOT EXISTS).
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ----- ENUMs (con guardas) -----
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('athlete', 'coach', 'admin');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE subscription_tier AS ENUM ('free', 'trial', 'pro', 'elite', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE payment_status AS ENUM ('pending', 'verified', 'expired', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ----- USERS -----
CREATE TABLE IF NOT EXISTS users (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email             VARCHAR(255) UNIQUE NOT NULL,
    password_hash     VARCHAR(255) NOT NULL,
    name              VARCHAR(255) NOT NULL,
    role              user_role NOT NULL DEFAULT 'athlete',
    product           VARCHAR(20) NOT NULL DEFAULT 'volta',  -- 'ho' | 'volta'
    coach_id          UUID REFERENCES users(id),
    avatar_url        VARCHAR(500),
    tier              subscription_tier DEFAULT 'trial',
    trial_ends_at     TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '45 days'),
    subscribed_at     TIMESTAMPTZ,
    cancelled_at      TIMESTAMPTZ,
    is_active         BOOLEAN DEFAULT TRUE,
    created_at        TIMESTAMPTZ DEFAULT NOW(),
    updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_coach ON users(coach_id);

-- ----- BASELINE RESULTS (Tests de Referencia) -----
CREATE TABLE IF NOT EXISTS baseline_results (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    test_id      VARCHAR(64) NOT NULL,         -- ej 'snatch_1rm', 'row_2k'
    value        NUMERIC(10,2) NOT NULL,
    unit         VARCHAR(16) NOT NULL,         -- 'kg' | 'seconds' | 'reps' | 'cm' | 'meters' | 'ml/kg/min'
    tested_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at   TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (user_id, test_id, tested_at)
);

CREATE INDEX IF NOT EXISTS idx_baseline_user_test ON baseline_results(user_id, test_id);
CREATE INDEX IF NOT EXISTS idx_baseline_user_date ON baseline_results(user_id, tested_at DESC);

-- ----- SOCIAL SCREENSHOTS (analytics de viralidad) -----
CREATE TABLE IF NOT EXISTS social_screenshots (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID REFERENCES users(id) ON DELETE SET NULL,
    card_variant        VARCHAR(32) NOT NULL,    -- 'minimalist' | 'stadium' | 'statsheet' | ...
    achievement_type    VARCHAR(64) NOT NULL,    -- 'pr_lift' | 'consecutive_days' | ...
    achievement_id      VARCHAR(64),             -- 'pr_clean' | 'session_today' | ...
    dwell_time_ms       INTEGER,                 -- tiempo en pantalla antes del probable screenshot
    detection_method    VARCHAR(32),             -- 'visibilitychange' | 'manual' | 'native_ios'
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_screenshots_user      ON social_screenshots(user_id);
CREATE INDEX IF NOT EXISTS idx_screenshots_variant   ON social_screenshots(card_variant, achievement_type);
CREATE INDEX IF NOT EXISTS idx_screenshots_created   ON social_screenshots(created_at DESC);

-- ----- PAYMENT INTENTS (transferencia bancaria + verificación email) -----
CREATE TABLE IF NOT EXISTS payment_intents (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    code            VARCHAR(20) UNIQUE NOT NULL,  -- ej 'HOLY-A7K9-MTRZ' (va en concepto)
    plan            VARCHAR(20) NOT NULL,         -- 'pro_1m' | 'pro_3m' | 'pro_12m' | 'elite_1m'
    amount          NUMERIC(10,2) NOT NULL,
    currency        VARCHAR(8) NOT NULL DEFAULT 'ARS',
    status          payment_status NOT NULL DEFAULT 'pending',
    expires_at      TIMESTAMPTZ NOT NULL,
    verified_at     TIMESTAMPTZ,
    verified_email_id VARCHAR(255),               -- message_id del email del banco que matcheó
    bank_sender     VARCHAR(255),                 -- remitente parseado
    notes           TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_code   ON payment_intents(code);
CREATE INDEX IF NOT EXISTS idx_payment_user   ON payment_intents(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payment_status ON payment_intents(status, expires_at);
