-- Create AI Agent Conversation Files table
-- Tracks which workspace files were attached to conversation messages
-- Does NOT store file content, only references and metadata
CREATE TABLE IF NOT EXISTS ai_agent_conversation_files (
    id TEXT PRIMARY KEY NOT NULL,
    workspace_file_id TEXT,
    conversation_id TEXT NOT NULL,
    conversation_message_id TEXT NOT NULL,
    metadata TEXT NOT NULL,
    is_attachment BOOLEAN NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (workspace_file_id)
        REFERENCES workspace_files(id) ON DELETE SET NULL,
    FOREIGN KEY (conversation_id)
        REFERENCES ai_agent_conversations(id) ON DELETE CASCADE,
    FOREIGN KEY (conversation_message_id)
        REFERENCES ai_agent_conversation_messages(id) ON DELETE CASCADE
);

-- Create indexes for efficient queries
CREATE INDEX idx_conversation_files_conversation_id
    ON ai_agent_conversation_files(conversation_id);

CREATE INDEX idx_conversation_files_message_id
    ON ai_agent_conversation_files(conversation_message_id);

CREATE INDEX idx_conversation_files_workspace_file_id
    ON ai_agent_conversation_files(workspace_file_id);
