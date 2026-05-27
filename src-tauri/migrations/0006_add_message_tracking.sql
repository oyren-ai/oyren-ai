-- Add provider, model, and token tracking to conversation messages
ALTER TABLE ai_agent_conversation_messages
  ADD COLUMN provider TEXT;

ALTER TABLE ai_agent_conversation_messages
  ADD COLUMN model TEXT;

ALTER TABLE ai_agent_conversation_messages
  ADD COLUMN input_tokens INTEGER;

ALTER TABLE ai_agent_conversation_messages
  ADD COLUMN output_tokens INTEGER;
