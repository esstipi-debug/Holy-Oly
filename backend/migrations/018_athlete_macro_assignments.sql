-- Migration 018 · Athlete Macrocycle Assignments
-- Sprint A · Coach Foundation
-- 2026-05-27
--
-- Persiste la asignación de macrocycles a atletas + tracking de adherencia
-- diaria. Hoy el macrocycle engine es request-scoped · si el atleta cambia de
-- programa, no quedan trazas. Acá guardamos historia completa.

CREATE TABLE IF NOT EXISTS athlete_macro_assignments (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    athlete_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    coach_id            UUID REFERENCES users(id) ON DELETE SET NULL,
    template_id         UUID NOT NULL REFERENCES macrocycle_templates(id) ON DELETE CASCADE,
    program_id          VARCHAR(64) NOT NULL,       -- copia de templates.program_id (audit)

    -- Fechas + estado
    started_at          DATE NOT NULL DEFAULT CURRENT_DATE,
    ends_at             DATE,                       -- calculado: started_at + total_weeks
    completed_at        TIMESTAMPTZ,                -- NULL si activo
    cancelled_at        TIMESTAMPTZ,
    cancel_reason       TEXT,
    is_active           BOOLEAN DEFAULT TRUE,

    -- Snapshot del atleta al momento de la asignación (audit · 1RMs cambian)
    athlete_snapshot    JSONB DEFAULT '{}'::jsonb,
                                                     -- {snatch_1rm, clean_1rm, back_squat_1rm, body_weight, level}
    -- Configuración propia del coach (override del template)
    overrides           JSONB DEFAULT '{}'::jsonb,
                                                     -- {weeks_to_add, intensity_modifier, custom_notes}

    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- Solo 1 macrocycle activo por atleta (si tiene 2 simultáneos, uno se archiva).
CREATE UNIQUE INDEX IF NOT EXISTS idx_macro_assignment_one_active
    ON athlete_macro_assignments(athlete_id)
    WHERE is_active = TRUE;

CREATE INDEX IF NOT EXISTS idx_macro_assignment_athlete ON athlete_macro_assignments(athlete_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_macro_assignment_coach ON athlete_macro_assignments(coach_id, is_active) WHERE coach_id IS NOT NULL;

COMMENT ON TABLE athlete_macro_assignments IS 'Historia de asignación de macrocycles · 1 activo por atleta · resto archivados con cancelled_at o completed_at.';


-- Tracking diario de adherencia · 1 row por (assignment, fecha).
-- Permite calcular adherence % real (sesiones planificadas vs hechas).

CREATE TABLE IF NOT EXISTS macro_session_adherence (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id       UUID NOT NULL REFERENCES athlete_macro_assignments(id) ON DELETE CASCADE,
    session_date        DATE NOT NULL,
    week_number         INTEGER NOT NULL,
    day_number          INTEGER NOT NULL,
    slot                VARCHAR(8) DEFAULT 'full',
    planned             BOOLEAN DEFAULT TRUE,
    completed           BOOLEAN DEFAULT FALSE,
    skipped_reason      VARCHAR(32),                -- 'rest_day', 'illness', 'override', 'injury', 'travel'
    actual_rpe          DECIMAL(3,1) CHECK (actual_rpe BETWEEN 0 AND 10),
    actual_load         DECIMAL(8,2),               -- impulso real de la sesión
    notes               TEXT,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (assignment_id, session_date, slot)
);

CREATE INDEX IF NOT EXISTS idx_adherence_assignment ON macro_session_adherence(assignment_id, session_date DESC);

COMMENT ON TABLE macro_session_adherence IS 'Tracking diario · usado para calcular adherence% en VoltaCoachTools eval macro.';
COMMENT ON COLUMN macro_session_adherence.skipped_reason IS 'Si completed=FALSE · por qué. Crítico para Control de Daños.';
