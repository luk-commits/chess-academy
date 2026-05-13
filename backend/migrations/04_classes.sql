CREATE TABLE IF NOT EXISTS classes (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(255) NOT NULL,
    coach_id    INTEGER      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_classes_coach_id ON classes(coach_id);

CREATE TABLE IF NOT EXISTS class_players (
    class_id    INTEGER     NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    player_id   INTEGER     NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (class_id, player_id)
);

CREATE INDEX idx_class_players_player_id ON class_players(player_id);
