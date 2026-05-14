-- Change all ON DELETE SET NULL foreign keys to ON DELETE CASCADE

ALTER TABLE pgn_games
    DROP CONSTRAINT IF EXISTS pgn_games_created_by_user_id_fkey;
ALTER TABLE pgn_games
    ADD CONSTRAINT pgn_games_created_by_user_id_fkey
    FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE positions
    DROP CONSTRAINT IF EXISTS positions_source_pgn_id_fkey;
ALTER TABLE positions
    ADD CONSTRAINT positions_source_pgn_id_fkey
    FOREIGN KEY (source_pgn_id) REFERENCES pgn_games(id) ON DELETE CASCADE;

ALTER TABLE positions
    DROP CONSTRAINT IF EXISTS positions_created_by_user_id_fkey;
ALTER TABLE positions
    ADD CONSTRAINT positions_created_by_user_id_fkey
    FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE task_stages
    DROP CONSTRAINT IF EXISTS task_stages_position_id_fkey;
ALTER TABLE task_stages
    ADD CONSTRAINT task_stages_position_id_fkey
    FOREIGN KEY (position_id) REFERENCES positions(id) ON DELETE CASCADE;

ALTER TABLE tasks
    DROP CONSTRAINT IF EXISTS tasks_group_id_fkey;
ALTER TABLE tasks
    ADD CONSTRAINT tasks_group_id_fkey
    FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE;
