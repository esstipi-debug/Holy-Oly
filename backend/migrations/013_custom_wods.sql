-- Migration 013: custom WODs (coach asigna WOD a competidor)
-- Override del Volta WOD Recommender · coach define WOD del día para el
-- atleta competidor en lugar del template generic del engine.
--
-- Unique constraint (athlete_id, date) → 1 custom WOD por día · usar PATCH
-- (futuro) o DELETE+POST para reemplazar.

CREATE TABLE IF NOT EXISTS custom_wods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coach_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    athlete_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    title VARCHAR(120) NOT NULL,
    type VARCHAR(32) NOT NULL,  -- AMRAP | EMOM | For Time | Strength | Skill | Recovery
    duration_sec INTEGER,
    movements JSONB NOT NULL,  -- [{name, scaling: {rx, scaled, beginner}, tag}]
    intensity_target VARCHAR(16),
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(athlete_id, date)
);

CREATE INDEX IF NOT EXISTS idx_custom_wods_athlete_date
    ON custom_wods(athlete_id, date DESC);

CREATE INDEX IF NOT EXISTS idx_custom_wods_coach
    ON custom_wods(coach_id, date DESC);
