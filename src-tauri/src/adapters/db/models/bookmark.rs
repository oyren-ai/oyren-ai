use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct WorkspaceFileBookmark {
    pub id: String,
    pub workspace_id: String,
    pub workspace_file_id: String,
    pub bookmark_page: i32,
    pub bookmark_description: String,
    pub date_created: DateTime<Utc>,
    pub metadata: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct CreateBookmarkRequest {
    pub workspace_id: String,
    pub workspace_file_id: String,
    pub bookmark_page: i32,
    pub bookmark_description: String,
    pub metadata: Option<String>,
}