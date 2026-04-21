-- ==============================================
-- HOLY OLY - MOBILITY MVP SCHEMA (Supabase)
-- ==============================================

-- 1. Catálogo de Ejercicios de Movilidad
CREATE TABLE IF NOT EXISTS mobility_exercises (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    target_zone VARCHAR(50) NOT NULL, -- ej. 'Hombros', 'Tobillos', 'Cadera', 'Torácica', 'Cadena Posterior'
    phase_type VARCHAR(50) NOT NULL, -- 'Pre-WOD' (Dinámico), 'Post-WOD' (Estático), 'Mantenimiento'
    equipment_needed VARCHAR(100), -- 'Foam Roller', 'Banda', 'Lacrosse', 'Ninguno'
    duration_seconds INTEGER DEFAULT 120, -- Duración estándar (ej. 2 minutos)
    video_url VARCHAR(255) NULL, -- URL referencial (vacio en el MVP gráfico)
    ai_tags TEXT[], -- Para uso futuro con el motor de RAG
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Perfil de Movilidad del Atleta (Resultados del Test)
CREATE TABLE IF NOT EXISTS user_mobility_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL, -- FK a la tabla de usuarios
    measured_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    -- Puntuaciones de 0 a 100 o Pasa/No pasa (1/0)
    score_shoulders INTEGER DEFAULT 100,
    score_hips INTEGER DEFAULT 100,
    score_ankles INTEGER DEFAULT 100,
    score_thoracic INTEGER DEFAULT 100,
    score_posterior_chain INTEGER DEFAULT 100,
    overall_score INTEGER GENERATED ALWAYS AS ((score_shoulders + score_hips + score_ankles + score_thoracic + score_posterior_chain) / 5) STORED,
    notes TEXT
);

-- 3. Registro de Rutinas Completadas (Para gamificación y rachas)
CREATE TABLE IF NOT EXISTS mobility_sessions_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    session_type VARCHAR(50), -- 'Pre-WOD', 'Post-WOD', 'Daily'
    duration_completed_seconds INTEGER,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indices para rendimiento
CREATE INDEX idx_mobility_exercises_zone ON mobility_exercises(target_zone);
CREATE INDEX idx_mobility_exercises_phase ON mobility_exercises(phase_type);
CREATE INDEX idx_user_mobility_profiles_current ON user_mobility_profiles(user_id, measured_at DESC);
