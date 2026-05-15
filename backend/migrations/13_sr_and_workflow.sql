UPDATE tasks SET status = 'published' WHERE status = 'active';

ALTER TABLE tasks
    ALTER COLUMN status SET DEFAULT 'draft';

ALTER TABLE tasks
    DROP CONSTRAINT IF EXISTS chk_tasks_status;

ALTER TABLE tasks
    ADD CONSTRAINT chk_tasks_status CHECK (status IN ('draft','published','archived'));

CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);

ALTER TABLE task_stages
    ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'draft';

ALTER TABLE task_stages
    ADD COLUMN IF NOT EXISTS solution_pgn TEXT;

ALTER TABLE task_stages
    DROP CONSTRAINT IF EXISTS chk_task_stages_status;

ALTER TABLE task_stages
    ADD CONSTRAINT chk_task_stages_status CHECK (status IN ('draft','in_progress','published'));

CREATE INDEX IF NOT EXISTS idx_task_stages_status ON task_stages(status);

CREATE TABLE IF NOT EXISTS user_stage_progress (
    id                SERIAL       PRIMARY KEY,
    user_id           INTEGER      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    task_stage_id     INTEGER      NOT NULL REFERENCES task_stages(id) ON DELETE CASCADE,
    repetitions       INTEGER      NOT NULL DEFAULT 0,
    interval_days     INTEGER      NOT NULL DEFAULT 0,
    last_result       VARCHAR(10),
    last_reviewed_at  TIMESTAMPTZ,
    next_review_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    attempts_total    INTEGER      NOT NULL DEFAULT 0,
    created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_user_stage_progress UNIQUE (user_id, task_stage_id),
    CONSTRAINT chk_user_stage_progress_result CHECK (last_result IN ('pass','fail') OR last_result IS NULL)
);

CREATE INDEX IF NOT EXISTS idx_user_stage_progress_due
    ON user_stage_progress(user_id, next_review_at);

CREATE INDEX IF NOT EXISTS idx_user_stage_progress_task_stage_id
    ON user_stage_progress(task_stage_id);

DROP TRIGGER IF EXISTS user_stage_progress_touch_updated_at ON user_stage_progress;

CREATE TRIGGER user_stage_progress_touch_updated_at
    BEFORE UPDATE ON user_stage_progress
    FOR EACH ROW
    EXECUTE FUNCTION touch_updated_at();
