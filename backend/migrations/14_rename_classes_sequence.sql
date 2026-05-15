DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'classes_id_seq' AND relkind = 'S') THEN
        EXECUTE 'ALTER SEQUENCE classes_id_seq RENAME TO groups_id_seq';
    END IF;
END
$$;
