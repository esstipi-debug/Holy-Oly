-- Migration 017 · Macrocycle Templates
-- Sprint A · Coach Foundation
-- 2026-05-27
--
-- Convierte los 23 programas hardcoded en `macrocycle_engine.py` a tabla DB.
-- Permite que el coach customice templates · cree los suyos propios · y que el
-- engine valide contra inventario.
--
-- NO borra el catálogo hardcoded · se mantiene como fallback durante la migración.

CREATE TABLE IF NOT EXISTS macrocycle_templates (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    program_id      VARCHAR(64) UNIQUE NOT NULL,    -- 'russian_classic', 'bulgarian_intensity', 'cf_open_prep'
    name            VARCHAR(160) NOT NULL,
    school          VARCHAR(32) NOT NULL CHECK (school IN (
                      'bulgarian', 'russian', 'chinese', 'american', 'iranian',
                      'european', 'japanese', 'ukrainian', 'turkish',
                      'crossfit', 'hyrox', 'custom'
                    )),
    product         VARCHAR(16) NOT NULL DEFAULT 'holy-oly'
                    CHECK (product IN ('holy-oly', 'volta', 'axon', 'any')),
    description     TEXT,
    total_weeks     INTEGER NOT NULL CHECK (total_weeks BETWEEN 2 AND 52),
    focus           VARCHAR(64),                    -- 'fuerza máxima', 'pico de fuerza', 'conditioning'
    level_min       VARCHAR(16) DEFAULT 'beginner' CHECK (level_min IN ('beginner', 'intermediate', 'advanced', 'elite')),
    level_max       VARCHAR(16) DEFAULT 'elite'    CHECK (level_max IN ('beginner', 'intermediate', 'advanced', 'elite')),
    goal_tags       JSONB DEFAULT '[]'::jsonb,      -- ['strength', 'olympic', 'meet_prep']
    phases          JSONB NOT NULL DEFAULT '[]'::jsonb,
                                                     -- [{week, phase, intensity_pct, volume_pct, focus}]
    required_equipment JSONB DEFAULT '[]'::jsonb,    -- ['barbell_olympic_20kg', 'plate_bumper_kg', 'rack']
    typical_athletes INTEGER DEFAULT 1,             -- 1 = individual · 8-15 = group class
    is_system       BOOLEAN DEFAULT TRUE,           -- TRUE = catálogo Peak Qual · FALSE = creado por coach
    coach_id        UUID REFERENCES users(id) ON DELETE CASCADE, -- NULL si is_system=TRUE
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_macrocycle_templates_product ON macrocycle_templates(product);
CREATE INDEX IF NOT EXISTS idx_macrocycle_templates_school ON macrocycle_templates(school);
CREATE INDEX IF NOT EXISTS idx_macrocycle_templates_coach ON macrocycle_templates(coach_id) WHERE coach_id IS NOT NULL;

COMMENT ON TABLE macrocycle_templates IS 'Catálogo de programas · 23 system + N custom del coach. Macrocycle engine los lee desde acá en lugar del PROGRAMS dict hardcoded.';
COMMENT ON COLUMN macrocycle_templates.required_equipment IS 'Tags de equipamiento que el programa necesita (cruzar con box_inventory para validar).';


-- Tabla de sesiones template · cada programa tiene N sesiones reutilizables.
-- Un programa de 12 semanas con 4 sesiones/semana = 48 sesiones generadas
-- a partir de templates con sustitución por % de 1RM.

CREATE TABLE IF NOT EXISTS macrocycle_session_templates (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id         UUID NOT NULL REFERENCES macrocycle_templates(id) ON DELETE CASCADE,
    week_number         INTEGER NOT NULL CHECK (week_number >= 1),
    day_number          INTEGER NOT NULL CHECK (day_number BETWEEN 1 AND 7),
    slot                VARCHAR(8) NOT NULL DEFAULT 'full' CHECK (slot IN ('am', 'pm', 'full')),
    focus               VARCHAR(32) NOT NULL CHECK (focus IN (
                          'technique', 'strength', 'olympic', 'accessory', 'metcon', 'recovery'
                        )),
    intensity_pct       DECIMAL(4,3),                -- 0.000 - 1.100
    volume_target       INTEGER,                     -- reps × sets aproximado
    exercises           JSONB NOT NULL DEFAULT '[]'::jsonb,
                                                       -- [{name, sets, reps, pct, max_key, tempo, rest_sec, notes}]
    notes               TEXT,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (template_id, week_number, day_number, slot)
);

CREATE INDEX IF NOT EXISTS idx_session_templates_template ON macrocycle_session_templates(template_id);

COMMENT ON TABLE macrocycle_session_templates IS 'Sesiones de cada programa · macrocycle_engine.generate_week_sessions() las traduce a sesiones reales sustituyendo % por kg del atleta.';
