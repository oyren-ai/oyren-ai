CREATE TABLE IF NOT EXISTS workspace_files (
    id TEXT PRIMARY KEY NOT NULL,
    workspace_id TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_name TEXT NOT NULL,
    added_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_accessed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_visible BOOLEAN NOT NULL DEFAULT 1,
    is_read_only BOOLEAN NOT NULL DEFAULT 1,
    metadata TEXT,
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_workspace_files_workspace_id ON workspace_files(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspace_files_is_visible ON workspace_files(is_visible);