-- Migration 023 · Volta Recommendations + Pattern Detections
-- 2026-05-27

CREATE TABLE IF NOT EXISTS volta_recommendations (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    athlete_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    coach_id        UUID REFERENCES users(id) ON DELETE SET NULL,
    code            VARCHAR(64) NOT NULL,
                    -- 'overreach_imminent', 'stagnation', 'strength_bias',
                    -- 'skill_gap', 'block_mismatch', 'domain_imbalance',
                    -- 'recovery_needed', 'benchmark_due', 'skill_ladder_up'
    severity        VARCHAR(16) NOT NULL CHECK (severity IN ('critical','warning','info')),
    priority        INTEGER NOT NULL DEFAULT 50 CHECK (priority BETWEEN 1 AND 100),
    title           VARCHAR(160) NOT NULL,
    description     TEXT,
    factors         JSONB NOT NULL DEFAULT '[]'::jsonb,
                    -- [{metric, value, threshold, weeks_window}]
    suggested_action JSONB DEFAULT '{}'::jsonb,
                    -- {type, params, expected_outcome}
    status          VARCHAR(16) NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active','accepted','rejected','applied','expired')),
    accepted_at     TIMESTAMPTZ,
    accepted_by     UUID REFERENCES users(id) ON DELETE SET NULL,
    applied_at      TIMESTAMPTZ,
    expires_at      TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_voltarec_athlete ON volta_recommendations(athlete_id, status, priority DESC);
CREATE INDEX IF NOT EXISTS idx_voltarec_coach ON volta_recommendations(coach_id, status);
CREATE INDEX IF NOT EXISTS idx_voltarec_code ON volta_recommendations(code, status);


-- Weekly analyzer snapshot · histórico para tracking
CREATE TABLE IF NOT EXISTS volta_weekly_snapshots (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    athlete_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    week_start      DATE NOT NULL,

    -- Métricas calculadas
    acwr            DECIMAL(4,2),
    total_volume_kg DECIMAL(10,2),
    sessions_completed INTEGER,
    sessions_planned INTEGER,
    rpe_avg         DECIMAL(3,1),
    rpe_high_count  INTEGER,                          -- sesiones RPE>=8
    domain_coverage JSONB DEFAULT '{}'::jsonb,         -- {1:n, 2:n, ..., 7:n}
    domain_missing  JSONB DEFAULT '[]'::jsonb,         -- domains 0 sessions

    -- Skill tree state al cierre semana
    skills_practiced INTEGER DEFAULT 0,
    skills_total_mastered INTEGER DEFAULT 0,
    keystones_unlocked INTEGER DEFAULT 0,

    -- Performance signals
    prs_this_week   INTEGER DEFAULT 0,
    days_since_last_pr INTEGER,
    benchmark_attempts INTEGER DEFAULT 0,

    -- Recovery context
    sleep_avg_hours DECIMAL(3,1),
    life_stress_avg DECIMAL(3,1),
    alcohol_units_total INTEGER DEFAULT 0,
    pain_zones_count INTEGER DEFAULT 0,

    -- Block + level context (snapshot)
    block_type      VARCHAR(32),
    athlete_level   INTEGER,
    macro_id        UUID,

    snapshot_at     TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (athlete_id, week_start)
);

CREATE INDEX IF NOT EXISTS idx_volta_snapshots_athlete ON volta_weekly_snapshots(athlete_id, week_start DESC);


-- Coach overrides · engine APRENDE de modificaciones recurrentes
CREATE TABLE IF NOT EXISTS volta_session_overrides (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coach_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    athlete_id      UUID REFERENCES users(id) ON DELETE CASCADE,
    original_template_id UUID,
    override_type   VARCHAR(32) NOT NULL CHECK (override_type IN (
                      'swap_movement', 'change_intensity', 'change_volume',
                      'change_time_domain', 'change_scaling', 'full_swap'
                    )),
    original_value  JSONB,
    new_value       JSONB,
    reason          TEXT,
    apply_to_all    BOOLEAN DEFAULT FALSE,             -- bulk a roster
    learned         BOOLEAN DEFAULT FALSE,             -- engine ya aplicó como default
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_voverrides_coach ON volta_session_overrides(coach_id, created_at DESC);


COMMENT ON TABLE volta_recommendations IS 'Recomendaciones priorizadas del engine Volta · análisis backward + forward';
COMMENT ON TABLE volta_weekly_snapshots IS 'Snapshot semanal por atleta · usado por analyzer + pattern detector';
COMMENT ON TABLE volta_session_overrides IS 'Coach edita sesión · si frecuente, engine aprende patrón';
