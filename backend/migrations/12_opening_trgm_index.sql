CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_positions_opening_trgm
    ON positions USING GIN (opening gin_trgm_ops);
