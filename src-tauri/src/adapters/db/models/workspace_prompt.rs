use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct WorkspacePrompt {
    pub id: String,
    pub workspace_id: String,
    pub title: String,
    pub blocks: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}
