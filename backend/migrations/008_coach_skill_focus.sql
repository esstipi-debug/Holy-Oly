-- Migration 008: coach skill focus
-- Coach asigna foco semanal (1-3 movimientos del skill tree) por atleta.
-- Atleta los ve resaltados en MovementProgression con nota técnica del coach.
-- Loop: marcar dominated → cierra el foco (resolved_at) → coach ve progreso.

CREATE TABLE IF NOT EXISTS coach_skill_focus (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coach_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    athlete_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    movement_id VARCHAR(80) NOT NULL,
    note TEXT,
    status VARCHAR(16) NOT NULL DEFAULT 'active', -- active | dominated | retired
    assigned_at TIMESTAMP DEFAULT NOW(),
    resolved_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_skill_focus_athlete
    ON coach_skill_focus(athlete_id) WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_skill_focus_coach
    ON coach_skill_focus(coach_id);

-- Solo 1 foco activo por (atleta, movimiento) — evita duplicados.
-- Permite múltiples 'dominated' / 'retired' históricos.
CREATE UNIQUE INDEX IF NOT EXISTS idx_skill_focus_active_unique
    ON coach_skill_focus(athlete_id, movement_id) WHERE status = 'active';
