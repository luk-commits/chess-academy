CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_positions_theme_tags
    ON positions USING GIN (theme_tags);
