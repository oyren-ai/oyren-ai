-- Migration 0009: Add UNIQUE constraints to prevent duplicate file entries
-- This migration cleans existing duplicates and adds constraints to prevent future duplicates

-- Step 1: Clean existing duplicate entries in workspace_files
-- Keep only the oldest entry (by added_at timestamp) for each (workspace_id, file_path) combination
DELETE FROM workspace_files
WHERE id NOT IN (
    SELECT MIN(id)
    FROM workspace_files
    GROUP BY workspace_id, file_path
);

-- Step 2: Clean existing duplicate entries in ai_agent_conversation_files
-- Keep only the oldest entry (by created_at timestamp) for each (conversation_message_id, workspace_file_id) combination
DELETE FROM ai_agent_conversation_files
WHERE id NOT IN (
    SELECT MIN(id)
    FROM ai_agent_conversation_files
    GROUP BY conversation_message_id, workspace_file_id
);

-- Step 3: Add UNIQUE constraint to workspace_files
-- Ensures each file path appears only once per workspace
CREATE UNIQUE INDEX idx_workspace_files_unique_path
    ON workspace_files(workspace_id, file_path);

-- Step 4: Add UNIQUE constraint to ai_agent_conversation_files
-- Ensures each workspace file is attached only once to a specific conversation message
CREATE UNIQUE INDEX idx_conversation_files_unique_attachment
    ON ai_agent_conversation_files(conversation_message_id, workspace_file_id);
