-- Migration 019 · Smart Coach Alerts (Engine 14)
-- Sprint B · Health Orchestrator
-- 2026-05-27
--
-- Persiste alertas convergentes generadas por Engine 14 (Smart Coach).
-- Orquesta múltiples engines (Stress + Lifestyle + Balance + Hormonal + Macrocycle)
-- y emite alertas cuando >=2 factores convergen.

CREATE TABLE IF NOT EXISTS smart_alerts (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    athlete_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    coach_id        UUID REFERENCES users(id) ON DELETE SET NULL,

    -- Clasificación
    code            VARCHAR(64) NOT NULL,
                    -- 'injury_risk' · 'overtraining' · 'hormonal_dip' · 'plateau' · 'low_inputs'
    severity        VARCHAR(16) NOT NULL CHECK (severity IN ('critical', 'warning', 'info')),
    title           VARCHAR(160) NOT NULL,
    description     TEXT,

    -- Razones convergentes (lista de factores detectados)
    factors         JSONB NOT NULL DEFAULT '[]'::jsonb,
                    -- [{"engine":"stress","metric":"fatigue","value":78,"threshold":70}, ...]

    -- Recomendación
    suggested_action JSONB DEFAULT '{}'::jsonb,
                    -- {"type":"deload","duration_days":5,"intensity_pct":0.7}

    -- Estado vida-ciclo
    status          VARCHAR(16) NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active', 'acknowledged', 'resolved', 'dismissed', 'expired')),
    acknowledged_at TIMESTAMPTZ,
    acknowledged_by UUID REFERENCES users(id) ON DELETE SET NULL,
    resolved_at     TIMESTAMPTZ,
    resolution_notes TEXT,

    -- Auditoría
    detected_at     TIMESTAMPTZ DEFAULT NOW(),
    expires_at      TIMESTAMPTZ,         -- auto-expira si nadie actúa (varía por severity)
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_smart_alerts_athlete ON smart_alerts(athlete_id, status, detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_smart_alerts_coach ON smart_alerts(coach_id, status, detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_smart_alerts_severity ON smart_alerts(severity, status);

COMMENT ON TABLE smart_alerts IS 'Alertas convergentes del Engine 14 Smart Coach · combinan múltiples engines · usadas en coach inbox + athlete control de daños.';
COMMENT ON COLUMN smart_alerts.factors IS 'Factores detectados que dispararon la alerta · cada uno con engine fuente + métrica + valor + threshold.';


-- ============================================================================
-- Control de Daños · acciones del atleta tras una mala decisión
-- ============================================================================

CREATE TABLE IF NOT EXISTS damage_control_actions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    athlete_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    triggered_by_alert UUID REFERENCES smart_alerts(id) ON DELETE SET NULL,

    -- Tipo de decisión que dispara el flujo
    decision_type   VARCHAR(32) NOT NULL CHECK (decision_type IN (
                      'override_wod',     -- entrenó pesado cuando engine recomendaba reducir
                      'skipped_rest',     -- saltó día de descanso planificado
                      'trained_with_pain',-- reportó dolor >6 y entrenó igual
                      'forced_pr',        -- forzó PR sin recovery
                      'low_sleep',        -- entrenó con <5h sueño
                      'high_stress',      -- entrenó con life_stress >8
                      'missed_inputs'     -- sin check-in 3+ días
                    )),

    -- Estado del flujo de acompañamiento
    accepted_plan   BOOLEAN DEFAULT FALSE,
    plan_summary    JSONB DEFAULT '{}'::jsonb,
                    -- {"sessions_adjusted":3, "intensity_reduction":0.3, "recovery_focus":true}

    -- Mensaje empático generado por IA (Mistral)
    ai_message      TEXT,
    ai_explanation  TEXT,         -- "¿por qué?" expandido

    detected_at     TIMESTAMPTZ DEFAULT NOW(),
    accepted_at     TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_damage_control_athlete ON damage_control_actions(athlete_id, detected_at DESC);

COMMENT ON TABLE damage_control_actions IS 'Acompañamiento sin culpa · cuando el atleta tomó decisión desalineada con salud · el sistema NO penaliza · propone plan recuperación.';
