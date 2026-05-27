-- Migration 020 · Lifestyle Inputs (Engine 12)
-- Sprint B · Health Orchestrator
-- 2026-05-27
--
-- Inputs holísticos: sleep + stress + cafeína + alcohol + fumar + dolor por zona.
-- Engine 14 Smart Coach los consume para alertas convergentes.
-- Cumple visión "Smart Training Zero Burnout" · cuantificar todo lo que afecta entrenamiento.

CREATE TABLE IF NOT EXISTS lifestyle_checkins (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    checkin_date    DATE NOT NULL DEFAULT CURRENT_DATE,

    -- Sleep
    sleep_hours     DECIMAL(3,1) CHECK (sleep_hours >= 0 AND sleep_hours <= 24),
    sleep_quality   INTEGER CHECK (sleep_quality BETWEEN 1 AND 10),

    -- Stress vida
    life_stress     INTEGER CHECK (life_stress BETWEEN 1 AND 10),
    mood            INTEGER CHECK (mood BETWEEN 1 AND 10),

    -- Energía + motivación
    energy_level    INTEGER CHECK (energy_level BETWEEN 1 AND 10),
    motivation      INTEGER CHECK (motivation BETWEEN 1 AND 10),

    -- Cafeína · log diario · clave para Pulse engine
    caffeine_mg          INTEGER DEFAULT 0 CHECK (caffeine_mg >= 0 AND caffeine_mg <= 1000),
    caffeine_last_time   TIMESTAMPTZ,
    caffeine_sources     JSONB DEFAULT '[]'::jsonb,  -- [{type:'cafe', mg:100, time:'09:14'}]

    -- Alcohol · 0=nada · 1=copa · 2=2+ unidades
    alcohol_units   INTEGER DEFAULT 0 CHECK (alcohol_units >= 0 AND alcohol_units <= 20),
    alcohol_type    VARCHAR(32),  -- 'vino' · 'cerveza' · 'destilado' · 'otro'

    -- Fumar · si el user lo declaró en onboarding
    smoking_today   BOOLEAN DEFAULT FALSE,
    cigarettes_count INTEGER DEFAULT 0 CHECK (cigarettes_count >= 0 AND cigarettes_count <= 60),

    -- Hidratación
    water_liters    DECIMAL(3,1) DEFAULT 0,

    -- Comida · si comió antes de entrenar
    meals_today     INTEGER DEFAULT 0 CHECK (meals_today >= 0 AND meals_today <= 10),
    last_meal_time  TIMESTAMPTZ,

    -- Notes free-text
    notes           TEXT,

    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (user_id, checkin_date)
);

CREATE INDEX IF NOT EXISTS idx_lifestyle_user_date ON lifestyle_checkins(user_id, checkin_date DESC);

COMMENT ON TABLE lifestyle_checkins IS 'Engine 12 Lifestyle · inputs diarios del atleta (sleep/stress/cafe/alcohol/fumar/dolor). Smart Coach consume estos para alertas.';


-- ============================================================================
-- Dolor por zona · captura granular
-- ============================================================================

CREATE TABLE IF NOT EXISTS pain_reports (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    checkin_id      UUID REFERENCES lifestyle_checkins(id) ON DELETE CASCADE,

    zone            VARCHAR(32) NOT NULL CHECK (zone IN (
                      'shoulders_left', 'shoulders_right',
                      'elbows_left', 'elbows_right',
                      'wrists_left', 'wrists_right',
                      'upper_back', 'lower_back', 'lumbar',
                      'hips_left', 'hips_right',
                      'knees_left', 'knees_right',
                      'ankles_left', 'ankles_right',
                      'feet_left', 'feet_right',
                      'core', 'neck', 'chest'
                    )),
    pain_level      INTEGER NOT NULL CHECK (pain_level BETWEEN 0 AND 10),
    pain_type       VARCHAR(32),  -- 'sharp' · 'dull' · 'burning' · 'numbness' · 'tingling'
    onset           VARCHAR(32),  -- 'sudden' · 'gradual' · 'chronic'
    aggravated_by   VARCHAR(120),
    notes           TEXT,

    reported_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pain_user_date ON pain_reports(user_id, reported_at DESC);
CREATE INDEX IF NOT EXISTS idx_pain_zone ON pain_reports(user_id, zone);

COMMENT ON TABLE pain_reports IS 'Dolor por zona · si >6 dispara alerta Smart Coach + notif al coach.';


-- ============================================================================
-- Catálogo de píldoras educacionales · contenido contextual
-- ============================================================================

CREATE TABLE IF NOT EXISTS knowledge_pills (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug            VARCHAR(64) UNIQUE NOT NULL,
    category        VARCHAR(32) NOT NULL CHECK (category IN (
                      'sleep', 'nutrition', 'caffeine', 'alcohol', 'smoking',
                      'recovery', 'stress', 'hormonal', 'training', 'mobility',
                      'injury_prevention', 'mental'
                    )),
    title           VARCHAR(160) NOT NULL,
    short_text      VARCHAR(280) NOT NULL,    -- chip/banner version
    long_text       TEXT NOT NULL,             -- expanded version
    citation        VARCHAR(280),              -- fuente científica
    severity        VARCHAR(16) NOT NULL DEFAULT 'info'
                    CHECK (severity IN ('critical', 'warning', 'info')),
    trigger_rules   JSONB DEFAULT '{}'::jsonb,
                    -- {when: 'sleep_hours < 6', context: 'pre_wod'}
    related_engines JSONB DEFAULT '[]'::jsonb, -- ['stress', 'lifestyle']
    sort_order      INTEGER DEFAULT 100,
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pills_category ON knowledge_pills(category, is_active);
CREATE INDEX IF NOT EXISTS idx_pills_severity ON knowledge_pills(severity);

COMMENT ON TABLE knowledge_pills IS 'Píldoras educacionales · IA Mistral las contextualiza con el estado del atleta · core de "ganar conciencia de salud".';


-- ============================================================================
-- Historial de píldoras vistas · evitar repetir
-- ============================================================================

CREATE TABLE IF NOT EXISTS pill_views (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    pill_id         UUID NOT NULL REFERENCES knowledge_pills(id) ON DELETE CASCADE,
    context         VARCHAR(64),    -- 'pre_wod' · 'check_in' · 'damage_control'
    viewed_at       TIMESTAMPTZ DEFAULT NOW(),
    expanded        BOOLEAN DEFAULT FALSE,
    UNIQUE (user_id, pill_id, context, viewed_at)
);

CREATE INDEX IF NOT EXISTS idx_pill_views_user ON pill_views(user_id, viewed_at DESC);
