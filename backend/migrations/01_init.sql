CREATE TYPE user_role AS ENUM ('COACH', 'PLAYER');

CREATE TABLE IF NOT EXISTS users (
    id            SERIAL PRIMARY KEY,
    email         VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name     VARCHAR(255) NOT NULL,
    role          user_role    NOT NULL DEFAULT 'PLAYER',
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_role ON users(role);

CREATE OR REPLACE FUNCTION touch_updated_at() RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_touch_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION touch_updated_at();

INSERT INTO users (email, password_hash, full_name, role) VALUES
    ('coach@chess.local', '$2y$12$6gUcyuHt02xpzgINZu/wHu0vjrbOB.f1f2uLSfl6MtUzEOBnlP5VS', 'Demo Coach', 'COACH'),
    ('player@chess.local', '$2y$12$6gUcyuHt02xpzgINZu/wHu0vjrbOB.f1f2uLSfl6MtUzEOBnlP5VS', 'Demo Player', 'PLAYER');
