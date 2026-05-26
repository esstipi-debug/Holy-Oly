-- Migration 012: Volta competitor profiles
-- Tier "Competidor" para atletas Volta · personalización extra para
-- CrossFit Open / Quarterfinals / Semifinals / Games.
--
-- Banner del coach + open rank tracking + target event + weekly volume target.
-- El flag is_competitor habilita visualmente la UX competidora en VoltaDashboard.

CREATE TABLE IF NOT EXISTS volta_competitor_profiles (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    is_competitor BOOLEAN DEFAULT FALSE,
    open_rank_worldwide INTEGER,
    open_rank_regional INTEGER,
    open_year INTEGER,
    category VARCHAR(32) DEFAULT 'RX',  -- RX | Scaled | Masters | Teens
    target_event VARCHAR(64),  -- 'Open 2026' | 'Semifinals' | 'Games'
    weekly_volume_target_kg INTEGER,
    weekly_sessions_target INTEGER DEFAULT 12,
    coach_notes TEXT,
    last_updated TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_competitor_is
    ON volta_competitor_profiles(is_competitor) WHERE is_competitor = TRUE;
