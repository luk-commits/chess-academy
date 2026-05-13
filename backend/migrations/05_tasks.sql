ALTER TABLE groups ADD COLUMN IF NOT EXISTS is_individual BOOLEAN NOT NULL DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS tasks (
    id          SERIAL PRIMARY KEY,
    title       VARCHAR(255) NOT NULL,
    description TEXT,
    coach_id    INTEGER     NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status      VARCHAR(50) NOT NULL DEFAULT 'active',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tasks_coach_id ON tasks(coach_id);

CREATE TABLE IF NOT EXISTS task_stages (
    id          SERIAL PRIMARY KEY,
    task_id     INTEGER      NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    title       VARCHAR(255) NOT NULL,
    description TEXT,
    sort_order  INTEGER      NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_task_stages_task_id ON task_stages(task_id);

CREATE TABLE IF NOT EXISTS task_stage_positions (
    task_stage_id INTEGER    NOT NULL REFERENCES task_stages(id) ON DELETE CASCADE,
    position_id   BIGINT     NOT NULL REFERENCES positions(id) ON DELETE CASCADE,
    sort_order    INTEGER    NOT NULL DEFAULT 0,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (task_stage_id, position_id)
);

CREATE INDEX IF NOT EXISTS idx_task_stage_positions_position_id ON task_stage_positions(position_id);
