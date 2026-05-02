-- ==========================================
-- Motor 25 — Agentic AI Database Schema
-- 20 tablas para los 5 agentes de Peak Qual
-- ==========================================

-- AGENT CORE (tablas compartidas)
CREATE TABLE IF NOT EXISTS agent_decisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_name VARCHAR(50) NOT NULL,
    decision_type VARCHAR(50) NOT NULL,
    action_taken VARCHAR(20),
    risk_level VARCHAR(20) DEFAULT 'low',
    context JSONB NOT NULL,
    recommendation JSONB,
    confidence DECIMAL(3,2),
    human_override BOOLEAN DEFAULT FALSE,
    override_reason TEXT,
    outcome JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- RESPONSE AGENT: leads multi-canal
CREATE TABLE IF NOT EXISTS leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel VARCHAR(20) NOT NULL,
    channel_user_id VARCHAR(100),
    name VARCHAR(100),
    email VARCHAR(255),
    phone VARCHAR(20),
    intent VARCHAR(50),
    intent_confidence DECIMAL(3,2),
    lead_score INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'new',
    product_interest VARCHAR(20),
    user_role VARCHAR(20),
    first_contact_at TIMESTAMP DEFAULT NOW(),
    last_contact_at TIMESTAMP,
    converted_at TIMESTAMP,
    converted_to_user_id UUID,
    notes TEXT
);

CREATE TABLE IF NOT EXISTS agent_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
    channel VARCHAR(20) NOT NULL,
    direction VARCHAR(10) NOT NULL,
    content TEXT NOT NULL,
    gemini_model VARCHAR(50),
    tokens_used INTEGER,
    response_time_ms INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);

-- GROWTH AGENT
CREATE TABLE IF NOT EXISTS growth_experiments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    experiment_type VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'draft',
    variants JSONB NOT NULL,
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS growth_user_experiments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    experiment_id UUID REFERENCES growth_experiments(id),
    variant_name VARCHAR(50) NOT NULL,
    assigned_at TIMESTAMP DEFAULT NOW(),
    converted BOOLEAN DEFAULT FALSE,
    UNIQUE(user_id, experiment_id)
);

CREATE TABLE IF NOT EXISTS user_engagement_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    score DECIMAL(5,2) NOT NULL,
    components JSONB NOT NULL,
    calculated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS churn_predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    churn_probability DECIMAL(5,4) NOT NULL,
    risk_level VARCHAR(20),
    contributing_factors JSONB,
    intervention_suggested JSONB,
    intervention_sent BOOLEAN DEFAULT FALSE,
    predicted_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS email_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    lead_id UUID REFERENCES leads(id),
    campaign_type VARCHAR(50) NOT NULL,
    email_address VARCHAR(255) NOT NULL,
    subject VARCHAR(255),
    sent_at TIMESTAMP DEFAULT NOW(),
    opened_at TIMESTAMP,
    clicked_at TIMESTAMP,
    status VARCHAR(20) DEFAULT 'sent'
);

CREATE TABLE IF NOT EXISTS referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    referred_email VARCHAR(255),
    referred_user_id UUID REFERENCES users(id),
    referral_code VARCHAR(20) NOT NULL UNIQUE,
    status VARCHAR(20) DEFAULT 'pending',
    reward_type VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW()
);

-- SECURITY AGENT
CREATE TABLE IF NOT EXISTS security_scans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scan_type VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'running',
    findings JSONB,
    vulnerabilities_found INTEGER DEFAULT 0,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS security_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scan_id UUID REFERENCES security_scans(id),
    severity VARCHAR(20) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    affected_endpoint VARCHAR(255),
    suggested_fix TEXT,
    resolved BOOLEAN DEFAULT FALSE,
    resolved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- TEST AGENT
CREATE TABLE IF NOT EXISTS test_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deploy_id VARCHAR(100),
    status VARCHAR(20) DEFAULT 'running',
    total_tests INTEGER,
    passed_tests INTEGER,
    failed_tests INTEGER,
    auto_fixes_applied INTEGER DEFAULT 0,
    duration_seconds INTEGER,
    report JSONB,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS test_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_run_id UUID REFERENCES test_runs(id),
    test_name VARCHAR(255) NOT NULL,
    status VARCHAR(20) NOT NULL,
    error_message TEXT,
    response_time_ms INTEGER,
    details JSONB
);

-- CONTENT AGENT
CREATE TABLE IF NOT EXISTS content_schedule (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent VARCHAR(50) DEFAULT 'content',
    content_type VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'draft',
    content JSONB NOT NULL,
    scheduled_for TIMESTAMP,
    published_at TIMESTAMP,
    channel VARCHAR(50),
    engagement_metrics JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_agent_decisions_agent ON agent_decisions(agent_name);
CREATE INDEX IF NOT EXISTS idx_agent_decisions_date ON agent_decisions(created_at);
CREATE INDEX IF NOT EXISTS idx_leads_channel ON leads(channel);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_score ON leads(lead_score DESC);
CREATE INDEX IF NOT EXISTS idx_agent_conversations_lead ON agent_conversations(lead_id);
CREATE INDEX IF NOT EXISTS idx_churn_predictions_risk ON churn_predictions(risk_level);
CREATE INDEX IF NOT EXISTS idx_security_alerts_severity ON security_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_security_alerts_resolved ON security_alerts(resolved);
CREATE INDEX IF NOT EXISTS idx_test_runs_deploy ON test_runs(deploy_id);
CREATE INDEX IF NOT EXISTS idx_test_results_run ON test_results(test_run_id);
CREATE INDEX IF NOT EXISTS idx_content_schedule_status ON content_schedule(status);
CREATE INDEX IF NOT EXISTS idx_content_schedule_date ON content_schedule(scheduled_for);
