CREATE TABLE IF NOT EXISTS pgn_games (
    id                  BIGSERIAL PRIMARY KEY,
    pgn_text            TEXT,
    event               VARCHAR(255),
    site                VARCHAR(255),
    date                DATE,
    round               VARCHAR(50),
    white               VARCHAR(255),
    black               VARCHAR(255),
    result              VARCHAR(10),
    eco                 VARCHAR(10),
    created_by_user_id  INTEGER    REFERENCES users(id) ON DELETE CASCADE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pgn_games_created_by_user_id ON pgn_games(created_by_user_id);
CREATE INDEX IF NOT EXISTS idx_pgn_games_eco ON pgn_games(eco);
