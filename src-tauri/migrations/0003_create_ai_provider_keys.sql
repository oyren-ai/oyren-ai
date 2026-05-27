-- Create ai_providers table to store supported providers
CREATE TABLE IF NOT EXISTS ai_providers (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL UNIQUE CHECK(name IN ('openrouter', 'gemini', 'deepseek')),
    created_at TEXT NOT NULL
);

-- Insert the supported providers with RFC3339 format
INSERT INTO ai_providers (id, name, created_at) VALUES
    ('openrouter', 'openrouter', strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
    ('gemini', 'gemini', strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
    ('deepseek', 'deepseek', strftime('%Y-%m-%dT%H:%M:%SZ', 'now'));

-- Create ai_provider_keys table
CREATE TABLE IF NOT EXISTS ai_provider_keys (
    id TEXT PRIMARY KEY NOT NULL,
    provider_id TEXT NOT NULL,
    key TEXT NOT NULL,
    date_added TEXT NOT NULL,
    name TEXT,
    last_used_date TEXT,
    FOREIGN KEY (provider_id) REFERENCES ai_providers(id) ON DELETE CASCADE
);

-- Create index on provider_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_ai_provider_keys_provider_id ON ai_provider_keys(provider_id);