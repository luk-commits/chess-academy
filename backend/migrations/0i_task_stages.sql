CREATE TABLE IF NOT EXISTS task_stages (
    id            SERIAL PRIMARY KEY,
    task_id       INTEGER      NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    title         VARCHAR(255) NOT NULL,
    description   TEXT,
    sort_order    INTEGER      NOT NULL DEFAULT 0,
    position_id   BIGINT       REFERENCES positions(id) ON DELETE CASCADE,
    status        VARCHAR(20)  NOT NULL DEFAULT 'draft',
    solution_pgn  TEXT,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_task_stages_status CHECK (status IN ('draft', 'in_progress', 'published'))
);

CREATE INDEX IF NOT EXISTS idx_task_stages_task_id ON task_stages(task_id);
CREATE INDEX IF NOT EXISTS idx_task_stages_position_id ON task_stages(position_id);
CREATE INDEX IF NOT EXISTS idx_task_stages_status ON task_stages(status);
