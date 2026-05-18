CREATE TABLE IF NOT EXISTS group_players (
    group_id   INTEGER     NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    player_id  INTEGER     NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (group_id, player_id)
);

CREATE INDEX IF NOT EXISTS idx_group_players_player_id ON group_players(player_id);

INSERT INTO group_players (group_id, player_id) VALUES
    (1, 4)
ON CONFLICT (group_id, player_id) DO NOTHING;
