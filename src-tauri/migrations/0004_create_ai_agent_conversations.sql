-- Create AI Agent Conversations table
CREATE TABLE IF NOT EXISTS ai_agent_conversations (
    id TEXT PRIMARY KEY NOT NULL,
    workspace_id TEXT NOT NULL,
    title TEXT NOT NULL,
    provider TEXT NOT NULL,
    model TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_accessed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_pinned BOOLEAN NOT NULL DEFAULT 0,
    is_archived BOOLEAN NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT 1,
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
);

-- Create indexes for efficient queries
CREATE INDEX idx_conversations_workspace_id ON ai_agent_conversations(workspace_id);
CREATE INDEX idx_conversations_created_at ON ai_agent_conversations(created_at DESC);
