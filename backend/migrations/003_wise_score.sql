-- Migration 003 — Wise Score Tables
-- Volta CrossFit — Cloud SQL Postgres
-- 2026-04-24

-- ============== ENUMS ==============

CREATE TYPE cf_nivel AS ENUM ('scaled', 'rx', 'competitor');
CREATE TYPE cf_track AS ENUM ('oly', 'crossfit');
CREATE TYPE tipo_sesion AS ENUM ('tecnica', 'skill', 'wod', 'competencia');
CREATE TYPE forma_semaforo AS ENUM ('verde', 'amarillo', 'rojo');

-- ============== WISE SCORE SNAPSHOT ==============
-- Un registro por atleta por fecha de cálculo

CREATE TABLE wise_score_snapshots (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    athlete_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Score final
    wise_score      DECIMAL(4,1) NOT NULL CHECK (wise_score BETWEEN 0 AND 99),
    nivel           cf_nivel NOT NULL,

    -- Sub-índices
    strength_index          DECIMAL(5,1),
    engine_score            DECIMAL(5,1),
    gymnastics_index        DECIMAL(5,1),
    benchmark_percentile    DECIMAL(5,1),
    consistency_score       DECIMAL(5,1),

    -- Contexto del atleta al momento del cálculo
    bw_kg           DECIMAL(5,1),
    edad            INTEGER,
    sexo            CHAR(1),

    calculated_at   TIMESTAMPTZ DEFAULT NOW(),
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_wise_snapshots_athlete ON wise_score_snapshots(athlete_id);
CREATE INDEX idx_wise_snapshots_date    ON wise_score_snapshots(calculated_at DESC);

-- ============== STRENGTH LIFTS ==============
-- 1RM / 3RM registrados por atleta

CREATE TABLE cf_strength_lifts (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    athlete_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    track           cf_track NOT NULL,

    -- Movimientos Oly track
    back_squat_3rm      DECIMAL(5,1),
    clean_1rm           DECIMAL(5,1),
    press_overhead_1rm  DECIMAL(5,1),

    -- Movimientos CrossFit track
    deadlift_1rm        DECIMAL(5,1),
    shoulder_press_1rm  DECIMAL(5,1),
    -- back_squat_3rm compartido

    recorded_at     TIMESTAMPTZ DEFAULT NOW(),
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_cf_lifts_athlete ON cf_strength_lifts(athlete_id);

-- ============== ENGINE TESTS ==============
-- Resultados de tests aeróbicos

CREATE TABLE cf_engine_tests (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    athlete_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Tests base
    fran_seconds        INTEGER,   -- NULL si no tiene resultado
    row_2k_seconds      INTEGER,
    amrap_12_rounds     DECIMAL(4,1),  -- puede incluir fracciones

    -- Tests custom del box
    custom_test_name    VARCHAR(100),
    custom_test_value   DECIMAL(8,2),
    custom_test_unidad  VARCHAR(50),   -- 'seg', 'rounds', 'reps', 'kg'

    -- Pesos configurables (coach/atleta, deben sumar 1.0)
    w_potencia_corta    DECIMAL(4,3) DEFAULT 0.333,
    w_capacidad_media   DECIMAL(4,3) DEFAULT 0.333,
    w_capacidad_larga   DECIMAL(4,3) DEFAULT 0.334,

    recorded_at     TIMESTAMPTZ DEFAULT NOW(),
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_cf_engine_athlete ON cf_engine_tests(athlete_id);

-- ============== ENGINE SCORE CONFIG (por box) ==============
-- Override de tablas de referencia por box

CREATE TABLE cf_engine_reference_override (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    box_id          UUID NOT NULL REFERENCES users(id),  -- coach = box owner
    benchmark       VARCHAR(50) NOT NULL,   -- 'fran', 'row_2k', 'amrap_12', custom

    nivel           cf_nivel NOT NULL,
    valor_min       DECIMAL(8,2),
    valor_max       DECIMAL(8,2),
    score_lo        DECIMAL(5,1),
    score_hi        DECIMAL(5,1),
    invert          BOOLEAN DEFAULT TRUE,   -- TRUE para tiempos (menor=mejor)

    created_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (box_id, benchmark, nivel)
);

-- ============== GYMNASTICS EVALUATIONS ==============
-- Evaluaciones del coach por movimiento por atleta

CREATE TABLE cf_gymnastics_evals (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    athlete_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    coach_id        UUID REFERENCES users(id),

    movimiento      VARCHAR(50) NOT NULL,  -- 'mu_anillas', 'mu_barra', etc.
    es_scaled       BOOLEAN DEFAULT FALSE,
    scaled_version  VARCHAR(100),          -- nombre de la versión escalada

    -- 3 preguntas del coach
    ejecuta_bien    INTEGER CHECK (ejecuta_bien BETWEEN 1 AND 5),
    reps_unbroken   INTEGER DEFAULT 0,
    usa_en_wods     INTEGER CHECK (usa_en_wods BETWEEN 1 AND 3),  -- 1=no, 2=a veces, 3=sí

    -- Historial de progresión
    nivel_previo    INTEGER,
    nivel_actual    INTEGER,
    nota_coach      TEXT,

    evaluated_at    TIMESTAMPTZ DEFAULT NOW(),
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_cf_gymnastics_athlete   ON cf_gymnastics_evals(athlete_id);
CREATE INDEX idx_cf_gymnastics_coach     ON cf_gymnastics_evals(coach_id);
CREATE INDEX idx_cf_gymnastics_mov       ON cf_gymnastics_evals(movimiento);

-- ============== BENCHMARK RESULTS ==============
-- Resultados de benchmarks (Fran, Murph, etc. + custom)

CREATE TABLE cf_benchmark_results (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    athlete_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    box_id          UUID REFERENCES users(id),

    benchmark       VARCHAR(100) NOT NULL,  -- 'fran', 'murph', o nombre custom
    resultado       DECIMAL(10,2) NOT NULL,
    unidad          VARCHAR(20) NOT NULL,   -- 'seg', 'rounds', 'reps', 'kg'
    nivel           cf_nivel NOT NULL,

    -- Si el box tiene referencia custom
    ref_override    DECIMAL(10,2),

    -- Flags
    es_custom       BOOLEAN DEFAULT FALSE,
    activo          BOOLEAN DEFAULT TRUE,   -- atleta/coach puede desactivar del cálculo

    recorded_at     TIMESTAMPTZ DEFAULT NOW(),
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_cf_benchmarks_athlete   ON cf_benchmark_results(athlete_id);
CREATE INDEX idx_cf_benchmarks_name      ON cf_benchmark_results(benchmark);
CREATE INDEX idx_cf_benchmarks_active    ON cf_benchmark_results(activo);

-- ============== SESIONES CROSSFIT ==============
-- Para Consistency Score

CREATE TABLE cf_sessions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    athlete_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    fecha           DATE NOT NULL,
    tipo            tipo_sesion NOT NULL DEFAULT 'wod',
    planificada     BOOLEAN DEFAULT TRUE,
    completada      BOOLEAN DEFAULT FALSE,

    -- Datos de carga (V-Stress Engine)
    rpe             DECIMAL(3,1) CHECK (rpe BETWEEN 0 AND 10),
    duracion_min    INTEGER,

    -- HR opcional
    hr_promedio     INTEGER,
    hr_zona_1_min   INTEGER DEFAULT 0,
    hr_zona_2_min   INTEGER DEFAULT 0,
    hr_zona_3_min   INTEGER DEFAULT 0,
    hr_zona_4_min   INTEGER DEFAULT 0,
    hr_zona_5_min   INTEGER DEFAULT 0,

    -- Impulso calculado (V-Stress)
    impulso         DECIMAL(8,2),

    notas           TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_cf_sessions_athlete ON cf_sessions(athlete_id);
CREATE INDEX idx_cf_sessions_fecha   ON cf_sessions(fecha DESC);

-- ============== V-STRESS DIARIO ==============
-- Estado Banister por atleta por día

CREATE TABLE cf_stress_diario (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    athlete_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    fecha           DATE NOT NULL,
    impulso         DECIMAL(8,2) DEFAULT 0,
    fitness         DECIMAL(8,2) DEFAULT 0,
    fatiga          DECIMAL(8,2) DEFAULT 0,
    forma           DECIMAL(8,2) DEFAULT 0,
    semaforo        forma_semaforo,
    alerta_sobrecarga BOOLEAN DEFAULT FALSE,

    calculated_at   TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE (athlete_id, fecha)
);

CREATE INDEX idx_cf_stress_athlete ON cf_stress_diario(athlete_id);
CREATE INDEX idx_cf_stress_fecha   ON cf_stress_diario(fecha DESC);

-- ============== CONSISTENCY CONFIG (por coach/box) ==============

CREATE TABLE cf_consistency_config (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coach_id        UUID NOT NULL REFERENCES users(id),
    athlete_id      UUID REFERENCES users(id),  -- NULL = aplica a todos los atletas del box

    ventana_dias    INTEGER DEFAULT 28,
    peso_completadas DECIMAL(3,2) DEFAULT 0.5,
    peso_racha       DECIMAL(3,2) DEFAULT 0.5,

    created_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (coach_id, athlete_id)
);
