CREATE TABLE IF NOT EXISTS task_groups (
    task_id     INTEGER     NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    group_id    INTEGER     NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (task_id, group_id)
);

CREATE INDEX IF NOT EXISTS idx_task_groups_group_id ON task_groups(group_id);
