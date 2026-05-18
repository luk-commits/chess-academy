CREATE TABLE IF NOT EXISTS user_stage_progress (
    id               SERIAL       PRIMARY KEY,
    user_id          INTEGER      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    task_stage_id    INTEGER      NOT NULL REFERENCES task_stages(id) ON DELETE CASCADE,
    repetitions      INTEGER      NOT NULL DEFAULT 0,
    interval_days    INTEGER      NOT NULL DEFAULT 0,
    last_result      VARCHAR(10),
    last_reviewed_at TIMESTAMPTZ,
    next_review_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    attempts_total   INTEGER      NOT NULL DEFAULT 0,
    created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_user_stage_progress UNIQUE (user_id, task_stage_id),
    CONSTRAINT chk_user_stage_progress_result CHECK (last_result IN ('pass', 'fail') OR last_result IS NULL)
);

CREATE INDEX IF NOT EXISTS idx_user_stage_progress_due
    ON user_stage_progress(user_id, next_review_at);

CREATE INDEX IF NOT EXISTS idx_user_stage_progress_task_stage_id
    ON user_stage_progress(task_stage_id);

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'user_stage_progress_touch_updated_at') THEN
        CREATE TRIGGER user_stage_progress_touch_updated_at
            BEFORE UPDATE ON user_stage_progress
            FOR EACH ROW
            EXECUTE FUNCTION touch_updated_at();
    END IF;
END
$$;
