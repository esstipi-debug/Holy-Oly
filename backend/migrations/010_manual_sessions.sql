-- 010_manual_sessions.sql
-- Manual session assignments · coach asigna entrenamiento del día
-- ad-hoc cuando el atleta no tiene macrociclo activo (o lo quiere modificar).
--
-- Soporta doble turno (slot=am/pm) o sesión única (slot=full).
-- Constraint UNIQUE evita doble asignación para mismo athlete+date+slot.

CREATE TABLE IF NOT EXISTS manual_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  coach_id UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  slot VARCHAR(8) NOT NULL DEFAULT 'full',  -- am | pm | full
  focus VARCHAR(32) NOT NULL,  -- technique | strength | olympic | accessory | metcon
  exercises JSONB NOT NULL,  -- [{name, sets, reps, pct, max_key}]
  note TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(athlete_id, date, slot)
);

CREATE INDEX IF NOT EXISTS idx_manual_sessions_athlete_date
  ON manual_sessions(athlete_id, date DESC);

CREATE INDEX IF NOT EXISTS idx_manual_sessions_coach
  ON manual_sessions(coach_id, date DESC);
