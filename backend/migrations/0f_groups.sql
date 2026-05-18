CREATE TABLE IF NOT EXISTS groups (
    id             SERIAL PRIMARY KEY,
    name           VARCHAR(255) NOT NULL,
    coach_id       INTEGER      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    is_individual  BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_groups_coach_id ON groups(coach_id);

INSERT INTO groups (id, name, coach_id) VALUES
    (1, 'Demo Group', 3)
ON CONFLICT (id) DO NOTHING;

SELECT setval(pg_get_serial_sequence('groups', 'id'), GREATEST(1, COALESCE((SELECT MAX(id) FROM groups), 1)));
