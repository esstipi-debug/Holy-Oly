-- Migration 011: coach skill evaluation
-- Coach evalúa formalmente el nivel del atleta sobre un movimiento del skill tree.
-- Niveles 1-5: 1·novato · 2·básico · 3·funcional · 4·sólido · 5·maestría
--
-- Diferencia conceptual vs skill_focus (008):
-- - skill_focus      = "trabajá ESTO esta semana" (objetivo activo · loop semanal)
-- - skill_evaluation = "tu destreza HOY es X" (veredicto del coach · destreza persistente)
--
-- Se permite UNA evaluación activa por (athlete, movement) · upsert sobre conflict.

CREATE TABLE IF NOT EXISTS coach_skill_evaluation (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coach_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    athlete_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    movement_id VARCHAR(80) NOT NULL,
    level SMALLINT NOT NULL CHECK (level BETWEEN 1 AND 5),
    note TEXT,
    evaluated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(athlete_id, movement_id)
);

CREATE INDEX IF NOT EXISTS idx_skill_eval_athlete
    ON coach_skill_evaluation(athlete_id);

CREATE INDEX IF NOT EXISTS idx_skill_eval_coach
    ON coach_skill_evaluation(coach_id);
