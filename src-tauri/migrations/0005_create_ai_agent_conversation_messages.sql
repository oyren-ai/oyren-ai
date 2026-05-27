-- Create AI Agent Conversation Messages table
CREATE TABLE IF NOT EXISTS ai_agent_conversation_messages (
    id TEXT PRIMARY KEY NOT NULL,
    conversation_id TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    images TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    sequence_number INTEGER NOT NULL,
    FOREIGN KEY (conversation_id) REFERENCES ai_agent_conversations(id) ON DELETE CASCADE
);

-- Create indexes for efficient queries
CREATE INDEX idx_messages_conversation_id ON ai_agent_conversation_messages(conversation_id);
CREATE INDEX idx_messages_sequence ON ai_agent_conversation_messages(conversation_id, sequence_number);
