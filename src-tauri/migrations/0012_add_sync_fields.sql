-- Add sync fields for bidirectional desktop ↔ cloud sync.
-- sync_id     : stable logical identity shared with the cloud workspace file uuid
-- cloud_file_uuid : the cloud oyrenai_workspace_files.uuid this file maps to
-- content_hash    : SHA-256 of local file content at last sync (for change detection)
-- last_synced_at  : ISO-8601 timestamp of the last successful sync for this file

ALTER TABLE workspace_files ADD COLUMN sync_id TEXT;
ALTER TABLE workspace_files ADD COLUMN cloud_file_uuid TEXT;
ALTER TABLE workspace_files ADD COLUMN content_hash TEXT;
ALTER TABLE workspace_files ADD COLUMN last_synced_at TEXT;

CREATE INDEX IF NOT EXISTS idx_workspace_files_sync_id ON workspace_files(sync_id);
