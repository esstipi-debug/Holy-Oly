-- Migration 007: push notification subscriptions
-- Stores PushSubscription objects from Web Push API per user/device.
-- Sender backend (services/push_sender.py) lee de aquí y manda via VAPID.

CREATE TABLE IF NOT EXISTS push_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    user_agent VARCHAR(500),
    created_at TIMESTAMP DEFAULT NOW(),
    last_used_at TIMESTAMP,
    UNIQUE(user_id, endpoint)
);

CREATE INDEX IF NOT EXISTS idx_push_user ON push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_push_endpoint ON push_subscriptions(endpoint);
