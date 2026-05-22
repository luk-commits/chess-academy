-- Remove orphaned tasks without group assignment before adding NOT NULL
DELETE FROM tasks WHERE group_id IS NULL;

ALTER TABLE tasks ALTER COLUMN group_id SET NOT NULL;
