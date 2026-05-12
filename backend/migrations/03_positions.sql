CREATE TABLE IF NOT EXISTS pgn_games (
    id              BIGSERIAL PRIMARY KEY,
    pgn_text        TEXT,
    event           VARCHAR(255),
    site            VARCHAR(255),
    date            DATE,
    round           VARCHAR(50),
    white           VARCHAR(255),
    black           VARCHAR(255),
    result          VARCHAR(10),
    eco             VARCHAR(10),
    created_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_pgn_games_created_by_user_id ON pgn_games(created_by_user_id);
CREATE INDEX idx_pgn_games_eco ON pgn_games(eco);

CREATE TABLE IF NOT EXISTS positions (
    id                  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    fen                 VARCHAR(255) NOT NULL,
    description         TEXT,
    opening_eco         VARCHAR(10),
    pieces              JSONB,
    type                VARCHAR(50),
    difficulty          INTEGER,
    evaluation_mate     INTEGER,
    theme_tags          JSONB,
    material_balance    INTEGER,
    source_type         VARCHAR(50),
    source_pgn_id       BIGINT REFERENCES pgn_games(id) ON DELETE SET NULL,
    is_puzzle           BOOLEAN DEFAULT FALSE,
    is_study_position   BOOLEAN DEFAULT FALSE,
    is_opening_position BOOLEAN DEFAULT FALSE,
    is_endgame_position BOOLEAN DEFAULT FALSE,
    popularity_score    INTEGER DEFAULT 0,
    times_seen          INTEGER DEFAULT 0,
    times_solved        INTEGER DEFAULT 0,
    success_rate        NUMERIC(5,2) DEFAULT 0.00,
    created_by_user_id  INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at          TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    board_orientation   VARCHAR(5),
    prev_move        VARCHAR(10),
    popularity          INTEGER DEFAULT 0,
    rating              INTEGER,
    lichess_study_id    VARCHAR(50),
    chesscom_game_id    VARCHAR(50),
    game_phase          VARCHAR(20),
    king_safety_score   INTEGER,
    space_advantage     INTEGER,
    initiative_side     VARCHAR(5),
    engine_top_lines    JSONB
);

CREATE INDEX idx_positions_fen ON positions(fen);
CREATE INDEX idx_positions_source_pgn_id ON positions(source_pgn_id);
CREATE INDEX idx_positions_created_by_user_id ON positions(created_by_user_id);
CREATE INDEX idx_positions_is_puzzle ON positions(is_puzzle);
CREATE INDEX idx_positions_opening_eco ON positions(opening_eco);
CREATE INDEX idx_positions_type ON positions(type);
CREATE INDEX idx_positions_difficulty ON positions(difficulty);
CREATE INDEX idx_positions_rating ON positions(rating);
CREATE INDEX idx_positions_game_phase ON positions(game_phase);
CREATE INDEX idx_positions_lichess_study_id ON positions(lichess_study_id);
CREATE INDEX idx_positions_chesscom_game_id ON positions(chesscom_game_id);
