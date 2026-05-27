-- Migration: Create workspace_file_bookmarks table
-- This table stores bookmarks for PDF pages within workspace files

CREATE TABLE IF NOT EXISTS workspace_file_bookmarks (
    id TEXT PRIMARY KEY NOT NULL,
    workspace_id TEXT NOT NULL,
    workspace_file_id TEXT NOT NULL,
    bookmark_page INTEGER NOT NULL,
    bookmark_description TEXT CHECK(length(bookmark_description) <= 50),
    date_created TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    metadata TEXT,
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
    FOREIGN KEY (workspace_file_id) REFERENCES workspace_files(id) ON DELETE CASCADE
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_bookmarks_workspace_id ON workspace_file_bookmarks(workspace_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_file_id ON workspace_file_bookmarks(workspace_file_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_created ON workspace_file_bookmarks(date_created DESC);
