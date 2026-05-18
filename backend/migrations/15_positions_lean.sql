-- 15_positions_lean.sql
--
-- This file is a REFERENCE SCHEMA for a fresh import of the `positions` table.
-- It is NOT executed by the migrator on the existing dev database because
-- CREATE TABLE IF NOT EXISTS would be a no-op on an already-existing table.
--
-- Use this schema when doing a fresh import on production (or a new dev DB):
--   1. DROP the old positions table (or use a new schema)
--   2. CREATE TABLE via this file
--   3. Run the importer with `php cli.php import positions --execute`
--
-- Changes vs 03_positions.sql:
--   - Removed 19 columns never written or read by the application:
--     description, pieces, type, evaluation_mate, material_balance,
--     source_pgn_id, is_study_position, is_opening_position,
--     is_endgame_position, popularity_score, times_solved, success_rate,
--     created_by_user_id, board_orientation, prev_move, rating,
--     game_phase, king_safety_score, space_advantage, initiative_side.
--   - Optimised column order (8B → 4B → 2B → 1B → variable) for alignment.
--   - Narrowed types: difficulty SMALLINT, popularity SMALLINT,
--     times_seen INTEGER.
--   - Removed unused indexes:
--     idx_positions_source_pgn_id, idx_positions_created_by_user_id,
--     idx_positions_is_puzzle, idx_positions_opening (btree — covered by trgm),
--     idx_positions_type, idx_positions_rating, idx_positions_game_phase,
--     idx_positions_other_game_id.
--   - Replaced btree opening index with GIN trgm for ILIKE searches.

CREATE TABLE IF NOT EXISTS positions (
    id                 BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    created_at         TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at         TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    times_seen         INTEGER     NOT NULL DEFAULT 0,
    difficulty         SMALLINT,
    popularity         SMALLINT    NOT NULL DEFAULT 0,
    is_puzzle          BOOLEAN     NOT NULL DEFAULT TRUE,
    fen                TEXT        NOT NULL,
    opening            TEXT,
    other_id           TEXT,
    other_game_id      TEXT,
    theme_tags         JSONB,
    engine_top_lines   JSONB,
    CONSTRAINT uq_positions_fen UNIQUE (fen)
);

CREATE INDEX idx_positions_difficulty    ON positions (difficulty);
CREATE INDEX idx_positions_popularity_id ON positions (popularity DESC, id DESC);
CREATE INDEX idx_positions_theme_tags    ON positions USING GIN (theme_tags);
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX idx_positions_opening_trgm  ON positions USING GIN (opening gin_trgm_ops);
