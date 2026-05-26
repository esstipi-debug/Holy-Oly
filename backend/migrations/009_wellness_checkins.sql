-- Migration 009: wellness daily check-ins
-- Atleta registra su estado wellness del día: sueño, soreness, motivación,
-- life stress, cafeína, hidratación, HRV. Feeds el stress engine y el
-- Wise Score. Múltiples check-ins por día permitidos (último gana en /today).

CREATE TABLE IF NOT EXISTS wellness_checkins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    sleep_hours DECIMAL(3,1),
    sleep_quality INTEGER,
    soreness INTEGER,
    motivation INTEGER,
    life_stress INTEGER,
    caffeine_mg INTEGER DEFAULT 0,
    hydration_liters DECIMAL(3,1) DEFAULT 0,
    hrv INTEGER,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wellness_user_date
    ON wellness_checkins(user_id, created_at DESC);
