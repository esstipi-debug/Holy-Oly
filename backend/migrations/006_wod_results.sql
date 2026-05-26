-- Migration 006: WOD Results (Volta · CrossFit benchmark tracking)
-- Stores logged WODs per user with auto-PR detection support.
-- Idempotent: uses IF NOT EXISTS everywhere.

CREATE TABLE IF NOT EXISTS wod_results (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    wod_name     VARCHAR(120) NOT NULL,
    rx_or_scaled VARCHAR(16)  NOT NULL CHECK (rx_or_scaled IN ('rx', 'scaled')),
    score_type   VARCHAR(16)  NOT NULL CHECK (score_type IN ('time', 'rounds_reps', 'reps', 'weight')),
    score_value  DECIMAL(10, 2) NOT NULL CHECK (score_value > 0),
    notes        TEXT,
    completed_at TIMESTAMP DEFAULT NOW(),
    is_pr        BOOLEAN DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_wod_results_user_completed
    ON wod_results (user_id, completed_at DESC);

CREATE INDEX IF NOT EXISTS idx_wod_results_user_wod
    ON wod_results (user_id, wod_name, rx_or_scaled);

COMMENT ON TABLE  wod_results IS 'Volta WOD log: benchmarks (FRAN, HELEN, MURPH) y custom WODs por user.';
COMMENT ON COLUMN wod_results.score_type IS 'time = segundos · rounds_reps = packed (rondas*1000+reps) · reps = total · weight = kg';
COMMENT ON COLUMN wod_results.is_pr      IS 'Mejor histórico del user para (wod_name, rx_or_scaled). Se recalcula on insert/delete.';
