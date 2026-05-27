use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct AiProviderModel {
    pub id: String,
    pub provider_id: String,
    pub model_name: String,
    pub is_multimodal: bool,
    pub is_active: bool,
    pub metadata: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}
