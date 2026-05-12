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

INSERT INTO users (id, email, password_hash, full_name, role) VALUES
    (1, 'lichess@chess.local', '$2y$12$import.system.lichess.placeholder', 'Lichess Import', 'COACH'),
    (2, 'chess.com@chess.local', '$2y$12$import.system.chesscom.placeholder', 'Chesscom Import', 'COACH'),
    (3, 'coach@chess.local', '$2y$12$6gUcyuHt02xpzgINZu/wHu0vjrbOB.f1f2uLSfl6MtUzEOBnlP5VS', 'Demo Coach', 'COACH'),
    (4, 'player@chess.local', '$2y$12$6gUcyuHt02xpzgINZu/wHu0vjrbOB.f1f2uLSfl6MtUzEOBnlP5VS', 'Demo Player', 'PLAYER');

SELECT setval(pg_get_serial_sequence('users', 'id'), 4);
