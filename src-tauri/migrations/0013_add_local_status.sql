-- Add local_status column for unified sync behavior.
-- 'active'        = file is present locally (default for all existing rows)
-- 'local_deleted' = synced file was deleted locally; cloud copy preserved for restore
ALTER TABLE workspace_files ADD COLUMN local_status TEXT NOT NULL DEFAULT 'active';
