use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AiModel {
    pub id: String,
    pub name: String,
    pub provider: String,
    pub enabled: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct AiProvider {
    pub id: String,
    pub name: String,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AiProviderKey {
    pub id: String,
    pub ai_provider: AiProvider,
    pub name: String,
    pub key: String,
    pub date_added: DateTime<Utc>,
    pub last_used_date: Option<DateTime<Utc>>,
    #[serde(default)]
    pub is_local: bool,
    pub models: Vec<AiModel>,
}

#[derive(Debug, Deserialize)]
pub struct CreateAiProviderKeyRequest {
    pub provider_id: String,
    pub name: String,
    pub key: String,
}

#[derive(Debug, Deserialize)]
pub struct UpdateAiProviderKeyRequest {
    pub name: String,
}
