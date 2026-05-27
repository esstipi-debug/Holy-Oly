-- Migration 022 · Mayhem Scaling System (Volta only)
-- Fuente: COMPTRAIN_MASTER.md (líneas 2136-2528)
-- 2026-05-27

-- Catálogo de movimientos CrossFit con tier requerido
CREATE TABLE IF NOT EXISTS volta_movements (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug            VARCHAR(64) UNIQUE NOT NULL,
    name            VARCHAR(120) NOT NULL,
    category        VARCHAR(32) NOT NULL CHECK (category IN (
                      'olympic', 'powerlifting', 'gymnastics',
                      'engine', 'monostructural', 'odd_object', 'mobility'
                    )),
    domain          INTEGER CHECK (domain BETWEEN 1 AND 7), -- 7 CompTrain domains
    rx_load_male    VARCHAR(32),
    rx_load_female  VARCHAR(32),
    rx_unit         VARCHAR(16),
    skill_keystone  BOOLEAN DEFAULT FALSE,
    tier_required   INTEGER DEFAULT 1 CHECK (tier_required BETWEEN 0 AND 4),
    equipment_tags  JSONB DEFAULT '[]'::jsonb,
    teaching_progression JSONB DEFAULT '[]'::jsonb,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_volta_movements_category ON volta_movements(category);
CREATE INDEX IF NOT EXISTS idx_volta_movements_domain ON volta_movements(domain);


-- Mayhem scaling substitutions
CREATE TABLE IF NOT EXISTS mayhem_scaling_rules (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    movement_slug   VARCHAR(64) NOT NULL,
    rx_qty          VARCHAR(32),
    sub_options     JSONB NOT NULL DEFAULT '[]'::jsonb,
                    -- [{label, qty, equipment, tier_min}]
    sub_for_load    BOOLEAN DEFAULT TRUE,
    sub_for_skill   BOOLEAN DEFAULT TRUE,
    sub_for_equipment BOOLEAN DEFAULT FALSE,
    notes           TEXT,
    UNIQUE (movement_slug)
);

CREATE INDEX IF NOT EXISTS idx_mayhem_movement ON mayhem_scaling_rules(movement_slug);


-- Cardio conversion chart (run ↔ row ↔ bike erg ↔ ski ↔ assault ↔ echo)
CREATE TABLE IF NOT EXISTS cardio_conversions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    from_modality   VARCHAR(32) NOT NULL,
    to_modality     VARCHAR(32) NOT NULL,
    from_qty_m      DECIMAL(8,2) NOT NULL,
    from_unit       VARCHAR(8) NOT NULL DEFAULT 'm',  -- m · cal · ft
    to_qty_m        DECIMAL(8,2) NOT NULL,
    to_unit         VARCHAR(8) NOT NULL DEFAULT 'm',
    gender          VARCHAR(4) DEFAULT 'any' CHECK (gender IN ('male', 'female', 'any')),
    UNIQUE (from_modality, to_modality, from_qty_m, gender)
);


-- Atleta skill tree tiers (Volta-specific · expandido vs movement_progression)
CREATE TABLE IF NOT EXISTS athlete_skill_tiers (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    athlete_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    movement_slug   VARCHAR(64) NOT NULL,
    tier            INTEGER NOT NULL DEFAULT 0 CHECK (tier BETWEEN 0 AND 4),
                    -- 0=cant do · 1=scaled · 2=Rx beginner · 3=Rx solid · 4=Rx+ unbroken
    last_practiced  DATE,
    practice_count  INTEGER DEFAULT 0,
    pr_value        DECIMAL(10,2),
    pr_at           TIMESTAMPTZ,
    coach_eval_score INTEGER CHECK (coach_eval_score BETWEEN 1 AND 5),
    coach_eval_at   TIMESTAMPTZ,
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (athlete_id, movement_slug)
);

CREATE INDEX IF NOT EXISTS idx_skill_tiers_athlete ON athlete_skill_tiers(athlete_id);
CREATE INDEX IF NOT EXISTS idx_skill_tiers_last ON athlete_skill_tiers(athlete_id, last_practiced DESC);


COMMENT ON TABLE volta_movements IS 'Catálogo Volta · 7 domains CompTrain · keystone movements para Belt progression';
COMMENT ON TABLE mayhem_scaling_rules IS 'Sustituciones Mayhem · si atleta tier<required, engine sustituye con sub_options';
COMMENT ON TABLE cardio_conversions IS 'Tabla conversión cardio · run ↔ row ↔ erg ↔ assault ↔ echo';
COMMENT ON TABLE athlete_skill_tiers IS 'Volta SkillTree · tier por movimiento · usado por Belt criteria + Mayhem auto-scale';
