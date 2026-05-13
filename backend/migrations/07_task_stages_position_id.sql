ALTER TABLE task_stages ADD COLUMN IF NOT EXISTS position_id BIGINT REFERENCES positions(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_task_stages_position_id ON task_stages(position_id);
