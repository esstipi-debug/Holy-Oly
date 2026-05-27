-- 014_hormonal_cycle.sql
-- Engine 13 · Hormonal Periodization · Menstrual Cycle Support
--
-- Implementa el spec engines/13_hormonal_engine.md
-- Optional opt-in feature · data sensible · GDPR delete cascade respetada.

-- ============================================================
-- 1. cycle_tracking · settings per user (opt-in)
-- ============================================================
CREATE TABLE IF NOT EXISTS cycle_tracking (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    cycle_start_date    DATE NOT NULL,
    cycle_length_days   INT NOT NULL DEFAULT 28 CHECK (cycle_length_days BETWEEN 21 AND 45),
    is_enabled          BOOLEAN NOT NULL DEFAULT true,
    source              VARCHAR(32) DEFAULT 'manual',  -- manual | flo | apple_health | oura
    notes               TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cycle_tracking_user ON cycle_tracking(user_id);

-- ============================================================
-- 2. cycle_log_entries · daily logs (síntomas, flujo, notas)
-- ============================================================
CREATE TABLE IF NOT EXISTS cycle_log_entries (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    log_date        DATE NOT NULL,
    day_of_cycle    INT NOT NULL,
    phase           VARCHAR(20) NOT NULL CHECK (phase IN ('menstruation', 'follicular', 'ovulation', 'luteal')),
    symptoms        JSONB,           -- ej. ["energy_up", "fatigue", "mood_swing", "cramps"]
    flow_intensity  VARCHAR(16),     -- light | moderate | heavy | null
    notes           TEXT,
    logged_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(user_id, log_date)
);

CREATE INDEX IF NOT EXISTS idx_cycle_log_user_date ON cycle_log_entries(user_id, log_date DESC);

-- ============================================================
-- 3. Trigger updated_at automático
-- ============================================================
CREATE OR REPLACE FUNCTION cycle_tracking_set_updated_at() RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_cycle_tracking_updated ON cycle_tracking;
CREATE TRIGGER trg_cycle_tracking_updated
    BEFORE UPDATE ON cycle_tracking
    FOR EACH ROW EXECUTE FUNCTION cycle_tracking_set_updated_at();
