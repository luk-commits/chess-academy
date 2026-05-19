CREATE TABLE IF NOT EXISTS user_task_progress (
    id               SERIAL       PRIMARY KEY,
    user_id          INTEGER      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    task_id          INTEGER      NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    status           VARCHAR(20)  NOT NULL DEFAULT 'new',
    current_stage_id INTEGER      REFERENCES task_stages(id) ON DELETE SET NULL,
    started_at       TIMESTAMPTZ,
    last_activity_at TIMESTAMPTZ,
    interrupted_at   TIMESTAMPTZ,
    completed_at     TIMESTAMPTZ,
    archived_at      TIMESTAMPTZ,
    total_time_ms    BIGINT       NOT NULL DEFAULT 0,
    attempts_total   INTEGER      NOT NULL DEFAULT 0,
    errors_total     INTEGER      NOT NULL DEFAULT 0,
    created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_user_task_progress_status CHECK (status IN ('new', 'in_progress', 'interrupted', 'completed', 'archived')),
    CONSTRAINT uq_user_task_progress UNIQUE (user_id, task_id)
);

CREATE INDEX IF NOT EXISTS idx_user_task_progress_user_status
    ON user_task_progress(user_id, status);
CREATE INDEX IF NOT EXISTS idx_user_task_progress_task_id
    ON user_task_progress(task_id);

CREATE TABLE IF NOT EXISTS user_task_stage_progress (
    id                  SERIAL       PRIMARY KEY,
    user_id             INTEGER      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    task_id             INTEGER      NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    task_stage_id       INTEGER      NOT NULL REFERENCES task_stages(id) ON DELETE CASCADE,
    status              VARCHAR(20)  NOT NULL DEFAULT 'new',
    attempts_total      INTEGER      NOT NULL DEFAULT 0,
    errors_total        INTEGER      NOT NULL DEFAULT 0,
    wrong_moves         JSONB        NOT NULL DEFAULT '[]'::jsonb,
    thinking_time_ms    BIGINT       NOT NULL DEFAULT 0,
    avg_move_time_ms    INTEGER      NOT NULL DEFAULT 0,
    longest_move_time_ms INTEGER     NOT NULL DEFAULT 0,
    first_error_at_ply  INTEGER,
    completed_at        TIMESTAMPTZ,
    in_repetition       BOOLEAN      NOT NULL DEFAULT FALSE,
    added_to_repetition_at TIMESTAMPTZ,
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_user_task_stage_progress_status CHECK (status IN ('new', 'in_progress', 'completed')),
    CONSTRAINT uq_user_task_stage_progress UNIQUE (user_id, task_stage_id)
);

CREATE INDEX IF NOT EXISTS idx_user_task_stage_progress_user_task
    ON user_task_stage_progress(user_id, task_id);
CREATE INDEX IF NOT EXISTS idx_user_task_stage_progress_repetition
    ON user_task_stage_progress(user_id, in_repetition);
CREATE INDEX IF NOT EXISTS idx_user_task_stage_progress_stage_id
    ON user_task_stage_progress(task_stage_id);

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'user_task_progress_touch_updated_at') THEN
        CREATE TRIGGER user_task_progress_touch_updated_at
            BEFORE UPDATE ON user_task_progress
            FOR EACH ROW
            EXECUTE FUNCTION touch_updated_at();
    END IF;
END
$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'user_task_stage_progress_touch_updated_at') THEN
        CREATE TRIGGER user_task_stage_progress_touch_updated_at
            BEFORE UPDATE ON user_task_stage_progress
            FOR EACH ROW
            EXECUTE FUNCTION touch_updated_at();
    END IF;
END
$$;
