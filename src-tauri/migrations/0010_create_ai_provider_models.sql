CREATE TABLE IF NOT EXISTS ai_provider_models (
    id TEXT PRIMARY KEY NOT NULL,
    provider_id TEXT NOT NULL,
    model_name TEXT NOT NULL,
    is_multimodal BOOLEAN NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT 1,
    metadata TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (provider_id) REFERENCES ai_providers(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_ai_provider_models_provider_id ON ai_provider_models(provider_id);