-- Holy Oly - Database Schema
-- PostgreSQL + Drizzle ORM + pgvector
-- Version: 1.0.0

-- ============== ENUMS ==============

CREATE TYPE user_role AS ENUM ('coach', 'athlete', 'admin');
CREATE TYPE subscription_tier AS ENUM ('free', 'elite', 'premium');
CREATE TYPE session_status AS ENUM ('pending', 'completed', 'skipped', 'modified');
CREATE TYPE risk_zone AS ENUM ('green', 'yellow', 'orange', 'red');
CREATE TYPE operating_mode AS ENUM ('zero_friction', 'semi', 'pro');
CREATE TYPE wearable_provider AS ENUM ('apple_health', 'google_fit', 'whoop', 'garmin', 'oura');

-- ============== USERS ==============

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'athlete',
    
    -- Profile
    avatar_url VARCHAR(500),
    bio TEXT,
    
    -- Athletic
    gender CHAR(1) CHECK (gender IN ('M', 'F')),
    birth_date DATE,
    
    -- Coach specific
    coach_id UUID REFERENCES users(id),
    athletes_count INTEGER DEFAULT 0,
    
    -- Subscription
    tier subscription_tier DEFAULT 'free',
    trial_ends_at TIMESTAMPTZ,
    subscribed_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    
    -- 1RM maxes (normalized)
    snatch_1rm DECIMAL(5,1),
    clean_1rm DECIMAL(5,1),
    jerk_1rm DECIMAL(5,1),
    back_squat_1rm DECIMAL(5,1),
    front_squat_1rm DECIMAL(5,1),
    body_weight DECIMAL(5,1),
    
    -- Settings
    operating_mode operating_mode DEFAULT 'zero_friction',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_coach ON users(coach_id);
CREATE INDEX idx_users_tier ON users(tier);

-- ============== EXERCISES ==============

CREATE TABLE exercises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    
    family VARCHAR(50),  -- snatch, clean_jerk, squat, pull, press, accessory
    position VARCHAR(50), -- competition, power, hang, blocks, from_floor
    
    complexity INTEGER CHECK (complexity BETWEEN 1 AND 10),
    cns_demand INTEGER CHECK (cns_demand BETWEEN 1 AND 10),
    
    description TEXT,
    instructions TEXT,
    video_url VARCHAR(500),
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_exercises_family ON exercises(family);
CREATE INDEX idx_exercises_complexity ON exercises(complexity);

-- ============== SUBSTITUTION CHAINS ==============

CREATE TABLE substitution_chains (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exercise_id UUID REFERENCES exercises(id),
    
    chain_order INTEGER,  -- 1=safest, higher=more complex
    substitute_id UUID REFERENCES exercises(id),
    degradation_level INTEGER CHECK (degradation_level BETWEEN 0 AND 3),
    
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============== MACROCYCLES ==============

CREATE TABLE macrocycles (
    id VARCHAR(50) PRIMARY KEY,  -- e.g., 'russian_classic'
    name VARCHAR(255) NOT NULL,
    school VARCHAR(50),
    duration_weeks INTEGER NOT NULL,
    focus_type VARCHAR(50),  -- hypertrophy, strength, power, peaking
    difficulty_level INTEGER CHECK (difficulty_level BETWEEN 1 AND 5),
    description TEXT,
    sessions_per_week INTEGER DEFAULT 5,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE macrocycle_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    macrocycle_id VARCHAR(50) REFERENCES macrocycles(id),
    
    week INTEGER NOT NULL,
    day_of_week VARCHAR(20) NOT NULL,  -- Monday, Tuesday, etc.
    session_theme VARCHAR(255),
    session_order INTEGER,
    
    estimated_duration INTEGER,  -- minutes
    notes TEXT
);

CREATE TABLE macrocycle_session_exercises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES macrocycle_sessions(id),
    exercise_id UUID REFERENCES exercises(id),
    
    sets INTEGER NOT NULL,
    reps INTEGER NOT NULL,
    intensity_pct DECIMAL(5,2),  -- % of 1RM, 0 for bodyweight
    rpe DECIMAL(3,1),
    exercise_order INTEGER,
    
    notes TEXT
);

-- ============== ATHLETE ASSIGNMENTS ==============

CREATE TABLE athlete_macrocycles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    athlete_id UUID REFERENCES users(id),
    macrocycle_id VARCHAR(50) REFERENCES macrocycles(id),
    
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    start_date DATE NOT NULL,
    end_date DATE,
    current_week INTEGER DEFAULT 1,
    
    status VARCHAR(20) DEFAULT 'active',  -- active, paused, completed
    completed_at TIMESTAMPTZ
);

CREATE INDEX idx_athlete_macrocycles_athlete ON athlete_macrocycles(athlete_id);

-- ============== SESSIONS ==============

CREATE TABLE athlete_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    athlete_id UUID REFERENCES users(id),
    assignment_id UUID REFERENCES athlete_macrocycles(id),
    
    macrocycle_session_id UUID REFERENCES macrocycle_sessions(id),
    scheduled_date DATE NOT NULL,
    status session_status DEFAULT 'pending',
    
    -- Pre-check data
    coordination_score INTEGER CHECK (coordination_score BETWEEN 1 AND 5),
    fatigue_level INTEGER CHECK (fatigue_level BETWEEN 1 AND 5),
    soreness_level INTEGER CHECK (soreness_level BETWEEN 1 AND 5),
    mental_focus INTEGER CHECK (mental_focus BETWEEN 1 AND 5),
    sleep_hours DECIMAL(3,1),
    
    -- Risk calculation
    risk_score INTEGER,
    risk_zone risk_zone,
    recommended_action TEXT,
    
    -- Results
    completed_at TIMESTAMPTZ,
    rpe_reported DECIMAL(3,1),
    actual_weight JSONB,  -- {exercise_id: weight}
    notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_athlete_sessions_athlete ON athlete_sessions(athlete_id);
CREATE INDEX idx_athlete_sessions_date ON athlete_sessions(scheduled_date);
CREATE INDEX idx_athlete_sessions_status ON athlete_sessions(status);

-- ============== READINESS CACHE ==============

CREATE TABLE readiness_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    athlete_id UUID REFERENCES users(id),
    calculated_date DATE NOT NULL,
    
    fitness DECIMAL(6,2),
    fatigue DECIMAL(6,2),
    readiness DECIMAL(5,2),
    readiness_category VARCHAR(20),
    
    -- CNS
    cns_score DECIMAL(5,2),
    cns_zone VARCHAR(20),
    
    -- Modifiers
    sleep_mod INTEGER DEFAULT 0,
    rpe_divergence_mod INTEGER DEFAULT 0,
    compliance_mod INTEGER DEFAULT 0,
    
    -- Meta
    session_load DECIMAL(8,2),
    data_source VARCHAR(50),  -- 'calculated', 'manual', 'estimated'
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(athlete_id, calculated_date)
);

CREATE INDEX idx_readiness_cache_athlete ON readiness_cache(athlete_id);

-- ============== DAILY METRICS ==============

CREATE TABLE daily_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    athlete_id UUID REFERENCES users(id),
    metric_date DATE NOT NULL,
    
    -- Sleep
    sleep_hours DECIMAL(3,1),
    sleep_quality INTEGER CHECK (sleep_quality BETWEEN 1 AND 10),
    
    -- Biometrics
    hrv DECIMAL(5,2),
    resting_hr DECIMAL(5,2),
    resting_hr_weekly_avg DECIMAL(5,2),
    
    -- Subjective
    soreness INTEGER CHECK (soreness BETWEEN 1 AND 10),
    motivation INTEGER CHECK (motivation BETWEEN 1 AND 10),
    life_stress INTEGER CHECK (life_stress BETWEEN 1 AND 10),
    
    -- Lifestyle
    alcohol_consumed BOOLEAN DEFAULT FALSE,
    work_hours INTEGER,
    stress_level INTEGER CHECK (stress_level BETWEEN 1 AND 10),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(athlete_id, metric_date)
);

-- ============== WARNINGS ==============

CREATE TABLE warnings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    athlete_id UUID REFERENCES users(id),
    
    type VARCHAR(50) NOT NULL,  -- 'overtraining', 'underrecovery', 'injury_risk', etc.
    severity VARCHAR(20) NOT NULL,  -- 'green', 'yellow', 'orange', 'red'
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    
    acknowledged_at TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_warnings_athlete ON warnings(athlete_id);
CREATE INDEX idx_warnings_severity ON warnings(severity);

-- ============== SESSION OVERRIDES ==============

CREATE TABLE session_overrides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    athlete_session_id UUID REFERENCES athlete_sessions(id),
    
    exercise_id UUID REFERENCES exercises(id),
    original_sets INTEGER,
    original_reps INTEGER,
    original_weight_pct DECIMAL(5,2),
    
    new_sets INTEGER,
    new_reps INTEGER,
    new_weight_pct DECIMAL(5,2),
    
    reason TEXT,
    modified_by UUID REFERENCES users(id),
    modified_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============== ADJUSTMENTS LOG ==============

CREATE TABLE adjustments_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    athlete_id UUID REFERENCES users(id),
    macrocycle_id VARCHAR(50),
    
    week INTEGER,
    adjustment_type VARCHAR(50),  -- 'volume', 'intensity', 'exercise_sub', 'rest_day'
    description TEXT,
    
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============== AI INTERACTIONS (for training) ==============

CREATE TABLE ai_interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    user_role VARCHAR(20),
    
    input_type VARCHAR(50),  -- 'check_in', 'coach_query', 'session_note'
    input_text TEXT,
    output_text TEXT,
    model_used VARCHAR(50),
    
    latency_ms INTEGER,
    feedback VARCHAR(20),  -- 'helpful', 'not_helpful'
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============== EMBEDDINGS (for RAG) ==============

CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_type VARCHAR(50),  -- 'session', 'note', 'pill', 'report'
    source_id UUID,
    
    content TEXT NOT NULL,
    embedding VECTOR(1536),
    metadata JSONB,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_embeddings_embedding ON embeddings USING hnsw (embedding vector_cosine_ops);

-- ============== PILDORAS (tips) ==============

CREATE TABLE pildoras (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    
    category VARCHAR(50),  -- 'recovery', 'technique', 'nutrition', 'mental'
    target_readiness VARCHAR(20),  -- 'high', 'moderate', 'low'
    target_gender VARCHAR(10),  -- 'M', 'F', 'all'
    min_experience_level INTEGER,  -- 1-5
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE
);

-- ============== GAMIFICATION ==============

CREATE TABLE xp (
    user_id UUID PRIMARY KEY REFERENCES users(id),
    total_xp INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    last_session_date DATE,
    
    total_sessions INTEGER DEFAULT 0,
    total_volume DECIMAL(10,2) DEFAULT 0,
    
    belts_earned INTEGER DEFAULT 0,  -- Number of belts
    current_belt VARCHAR(20),  -- white, yellow, orange, green, blue, purple, brown, black
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============== TABLES SEED DATA ==============

-- Exercises (49 canonical)
INSERT INTO exercises (id, name, family, position, complexity, cns_demand, description) VALUES
('e-snatch', 'Snatch', 'snatch', 'competition', 9, 10, 'Olympic snatch - single movement'),
('e-power-snatch', 'Power Snatch', 'snatch', 'power', 8, 9, 'Power snatch - above parallel'),
('e-hang-snatch', 'Hang Snatch', 'snatch', 'hang', 7, 8, 'Hang snatch - from hang'),
('e-snatch-pull', 'Snatch Pull', 'pull', 'competition', 5, 7, 'Snatch pull - no catch'),
('e-clean', 'Clean', 'clean_jerk', 'competition', 8, 9, 'Clean - to rack'),
('e-power-clean', 'Power Clean', 'clean_jerk', 'power', 7, 8, 'Power clean'),
('e-hang-clean', 'Hang Clean', 'clean_jerk', 'hang', 6, 7, 'Hang clean'),
('e-jerk', 'Jerk', 'clean_jerk', 'competition', 8, 9, 'Jerk - split or squat'),
('e-power-jerk', 'Power Jerk', 'clean_jerk', 'power', 7, 8, 'Power jerk'),
('e-clean-jerk', 'Clean & Jerk', 'clean_jerk', 'competition', 9, 10, 'Full clean and jerk'),
('e-back-squat', 'Back Squat', 'squat', 'competition', 6, 7, 'Back squat'),
('e-front-squat', 'Front Squat', 'squat', 'competition', 7, 8, 'Front squat'),
('e-ohs', 'Overhead Squat', 'squat', 'overhead', 8, 9, 'Overhead squat'),
('e-leg-press', 'Leg Press', 'squat', 'machine', 2, 3, 'Leg press machine'),
('e-deadlift', 'Deadlift', 'pull', 'competition', 3, 5, 'Conventional deadlift'),
('e-rdl', 'Romanian Deadlift', 'pull', 'gastroc', 3, 4, 'RDL - hamstring focus'),
('e-bench', 'Bench Press', 'press', 'competition', 4, 5, 'Bench press'),
('e-push-press', 'Push Press', 'press', 'standing', 3, 4, 'Push press'),
('e-snatch-balance', 'Snatch Balance', 'snatch', 'balance', 9, 9, 'Snatch balance - most complex'),
('e-snatch-press', 'Snatch Press', 'snatch', 'press', 6, 6, 'Snatch press - strict')
ON CONFLICT (id) DO NOTHING;

-- Macrocycles (23 programs)
INSERT INTO macrocycles (id, name, school, duration_weeks, focus_type, difficulty_level, sessions_per_week) VALUES
('bulgarian_hf', 'High Frequency Pure Oly', 'Bulgarian', 8, 'Power', 5, 6),
('bulgarian_heavy', 'Bulgarian Heavy', 'Bulgarian', 12, 'Strength', 5, 6),
('bulgarian_strength', 'Bulgarian Strength Block', 'Bulgarian', 6, 'Strength', 4, 4),
('russian_classic', 'Russian Classic Periodization', 'Russian', 12, 'Strength', 4, 5),
('russian_speed', 'Russian Strength-Speed Block', 'Russian', 8, 'Power', 4, 5),
('russian_chains', 'Russian Heavy Chains', 'Russian', 10, 'Strength', 4, 5),
('russian_comp', 'Russian Competition Prep', 'Russian', 4, 'Peaking', 5, 3),
('chinese_extensive', 'Chinese Extensive', 'Chinese', 16, 'Hypertrophy', 3, 5),
('chinese_comp', 'Chinese Competition Phase', 'Chinese', 6, 'Peaking', 4, 4),
('chinese_youth', 'Chinese Youth Development', 'Chinese', 12, 'Technical', 2, 4),
('american_hybrid', 'American Hybrid Complex', 'American', 10, 'Power', 3, 4),
('american_strength', 'American Strength Bias', 'American', 8, 'Strength', 3, 4),
('iranian_volume', 'Iranian High Volume', 'Iranian', 14, 'Hypertrophy', 4, 5),
('iranian_comp', 'Iranian Competition Block', 'Iranian', 5, 'Peaking', 5, 4),
('european_tech', 'European Technical Focus', 'European', 10, 'Technical', 3, 4),
('european_waves', 'European Periodized Waves', 'European', 12, 'Power', 4, 4),
('european_enduro', 'European Endurance-Strength Hybrid', 'European', 9, 'Strength', 3, 5),
('japanese_precision', 'Japanese Precision OLY', 'Japanese', 10, 'Technical', 4, 4),
('japanese_enduro', 'Japanese Strength Endurance', 'Japanese', 12, 'Strength', 3, 4),
('ukrainian_freq', 'Ukrainian Extreme Frequency', 'Ukrainian', 6, 'Power', 5, 10),
('ukrainian_strength', 'Ukrainian Strength Block', 'Ukrainian', 8, 'Strength', 4, 3),
('turkish_volume', 'Turkish Volume Progression', 'Turkish', 14, 'Hypertrophy', 3, 4),
('turkish_speed', 'Turkish Speed-Strength', 'Turkish', 7, 'Power', 4, 4)
ON CONFLICT (id) DO NOTHING;

-- ============== LIFESTYLE LOGS ==============

CREATE TABLE sleep_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    athlete_id UUID NOT NULL REFERENCES users(id),
    logged_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    hours DECIMAL(3,1) NOT NULL CHECK (hours BETWEEN 0 AND 24),
    quality INTEGER CHECK (quality BETWEEN 1 AND 100),
    rem_sleep_mins INTEGER,
    deep_sleep_mins INTEGER,
    notes TEXT,
    source VARCHAR(50) DEFAULT 'manual' -- 'apple_health', 'google_fit', 'manual'
);

CREATE TABLE caffeine_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    athlete_id UUID NOT NULL REFERENCES users(id),
    logged_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    mg_amount INTEGER NOT NULL CHECK (mg_amount BETWEEN 0 AND 1000),
    source VARCHAR(50) DEFAULT 'manual', -- 'manual', 'coffee_tracker'
    notes TEXT
);

CREATE TABLE alcohol_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    athlete_id UUID NOT NULL REFERENCES users(id),
    logged_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    units INTEGER NOT NULL CHECK (units BETWEEN 0 AND 20),
    drink_type VARCHAR(100),
    notes TEXT
);

-- Tracking enabled per athlete
CREATE TABLE lifestyle_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    athlete_id UUID NOT NULL REFERENCES users(id) UNIQUE,
    sleep_enabled BOOLEAN DEFAULT TRUE,
    caffeine_enabled BOOLEAN DEFAULT TRUE,
    alcohol_enabled BOOLEAN DEFAULT FALSE,
    stress_enabled BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Wearable connections
CREATE TABLE wearable_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    athlete_id UUID NOT NULL REFERENCES users(id),
    provider VARCHAR(50) NOT NULL, -- 'apple_health', 'google_fit', 'whoop', 'garmin', 'oura'
    connected_at TIMESTAMPTZ DEFAULT NOW(),
    last_sync_at TIMESTAMPTZ,
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'disconnected', 'error'
    access_token_encrypted TEXT,
    refresh_token_encrypted TEXT,
    UNIQUE(athlete_id, provider)
);