-- Migration 015 — Athlete Belts (Engine 05)
-- Holy Oly + Volta · Sprint 1 Gamification
-- 2026-05-27
--
-- Fixes hack actual donde BeltCeremony usaba `prior_fitness ?? 60` directo del frontend.
-- Ahora persiste belt_idx con fecha de promoción · permanente (nunca demota) · y
-- recordamos last_eval_at para no recalcular en cada request.

CREATE TABLE IF NOT EXISTS athlete_belts (
    user_id         UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    belt_idx        INTEGER NOT NULL DEFAULT 0 CHECK (belt_idx BETWEEN 0 AND 8),
    earned_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_eval_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- Snapshot de los criterios cuando se promovió (auditable)
    snapshot        JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_athlete_belts_user ON athlete_belts(user_id);

COMMENT ON TABLE  athlete_belts IS 'Belt actual de cada atleta. Permanente · nunca demota. Mapeo BeltCeremony: 0=Blanco · 1=Amarillo · 2=Naranja · 3=Azul · 4=Púrpura · 5=Marrón · 6=Negro · 7=Maestro · 8=Gold.';
COMMENT ON COLUMN athlete_belts.snapshot     IS 'JSON con criterios al momento de promoción (oly_index, streak, active_days, total_lifted, etc) para auditoría.';
COMMENT ON COLUMN athlete_belts.last_eval_at IS 'Última vez que se corrió evaluate_belt() · usar para cache de progreso hacia next belt.';
