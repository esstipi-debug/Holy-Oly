-- Habilitar RLS en tablas críticas
-- Nota: La aplicación debe ejecutar 'SET LOCAL app.current_user_id = <ID>' 
-- al inicio de cada transacción o conexión.

-- 1. Athlete Sessions
ALTER TABLE athlete_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY athlete_sessions_rls ON athlete_sessions
    USING (
        athlete_id = current_setting('app.current_user_id', true)::uuid
        OR
        athlete_id IN (SELECT id FROM users WHERE coach_id = current_setting('app.current_user_id', true)::uuid)
    );

-- 2. Daily Metrics
ALTER TABLE daily_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY daily_metrics_rls ON daily_metrics
    USING (
        athlete_id = current_setting('app.current_user_id', true)::uuid
        OR
        athlete_id IN (SELECT id FROM users WHERE coach_id = current_setting('app.current_user_id', true)::uuid)
    );

-- 3. Sleep Logs
ALTER TABLE sleep_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY sleep_logs_rls ON sleep_logs
    USING (
        athlete_id = current_setting('app.current_user_id', true)::uuid
        OR
        athlete_id IN (SELECT id FROM users WHERE coach_id = current_setting('app.current_user_id', true)::uuid)
    );
