use crate::adapters::db::models::WorkspaceFileBookmark;
use sqlx::SqlitePool;

pub async fn get_bookmark_by_id(
    pool: &SqlitePool,
    id: &str,
) -> Result<Option<WorkspaceFileBookmark>, String> {
    sqlx::query_as::<_, WorkspaceFileBookmark>(
        "SELECT * FROM workspace_file_bookmarks WHERE id = ?",
    )
    .bind(id)
    .fetch_optional(pool)
    .await
    .map_err(|e| format!("Failed to get bookmark: {}", e))
}