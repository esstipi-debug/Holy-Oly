-- Migration 005: GitHub OAuth support
-- Adds github_id, github_login fields to users table
-- Makes password_hash nullable (GitHub users won't have a password)

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS github_id BIGINT UNIQUE,
    ADD COLUMN IF NOT EXISTS github_login VARCHAR(255),
    ADD COLUMN IF NOT EXISTS product VARCHAR(20) DEFAULT 'holy-oly'
        CHECK (product IN ('holy-oly', 'volta'));

-- Allow null password for OAuth-only users
ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;

-- Constraint: a user must have either password_hash OR github_id
ALTER TABLE users ADD CONSTRAINT users_auth_method_check
    CHECK (password_hash IS NOT NULL OR github_id IS NOT NULL);

CREATE INDEX IF NOT EXISTS idx_users_github_id ON users(github_id);
CREATE INDEX IF NOT EXISTS idx_users_product ON users(product);

COMMENT ON COLUMN users.github_id IS 'GitHub user numeric ID for OAuth users';
COMMENT ON COLUMN users.github_login IS 'GitHub username/login handle';
COMMENT ON COLUMN users.product IS 'Active product: holy-oly (weightlifting) or volta (crossfit)';
