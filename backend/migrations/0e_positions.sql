CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE IF NOT EXISTS positions (
    id                 BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    created_at         TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at         TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    times_seen         INTEGER     NOT NULL DEFAULT 0,
    difficulty         SMALLINT,
    popularity         SMALLINT    NOT NULL DEFAULT 0,
    is_puzzle          BOOLEAN     NOT NULL DEFAULT TRUE,
    fen                TEXT        NOT NULL,
    opening            TEXT,
    other_id           TEXT,
    other_game_id      TEXT,
    theme_tags         JSONB,
    engine_top_lines   JSONB,
    CONSTRAINT uq_positions_fen UNIQUE (fen)
);

CREATE INDEX IF NOT EXISTS idx_positions_difficulty    ON positions (difficulty);
CREATE INDEX IF NOT EXISTS idx_positions_popularity_id ON positions (popularity DESC, id DESC);
CREATE INDEX IF NOT EXISTS idx_positions_theme_tags    ON positions USING GIN (theme_tags);
CREATE INDEX IF NOT EXISTS idx_positions_opening_trgm  ON positions USING GIN (opening gin_trgm_ops);
