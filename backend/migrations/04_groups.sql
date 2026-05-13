-- Rename existing tables (idempotent — safe for both fresh and existing installs)
ALTER TABLE IF EXISTS classes RENAME TO groups;
ALTER TABLE IF EXISTS class_players RENAME TO group_players;

-- Rename columns (idempotent)
ALTER TABLE IF EXISTS group_players RENAME COLUMN IF EXISTS class_id TO group_id;

-- Rename indexes (idempotent)
ALTER INDEX IF EXISTS idx_classes_coach_id RENAME TO idx_groups_coach_id;
ALTER INDEX IF EXISTS idx_class_players_player_id RENAME TO idx_group_players_player_id;

-- Create tables if they don't exist yet (fresh installs)
CREATE TABLE IF NOT EXISTS groups (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(255) NOT NULL,
    coach_id    INTEGER      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_groups_coach_id ON groups(coach_id);

CREATE TABLE IF NOT EXISTS group_players (
    group_id    INTEGER     NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    player_id   INTEGER     NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (group_id, player_id)
);

CREATE INDEX IF NOT EXISTS idx_group_players_player_id ON group_players(player_id);

INSERT INTO groups (id, name, coach_id) VALUES
    (1, 'Demo Group', 3)
ON CONFLICT (id) DO NOTHING;

INSERT INTO group_players (group_id, player_id) VALUES
    (1, 4)
ON CONFLICT (group_id, player_id) DO NOTHING;

SELECT setval(pg_get_serial_sequence('groups', 'id'), 1);
