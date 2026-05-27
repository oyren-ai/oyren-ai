use crate::adapters::db::models::WorkspaceFileBookmark;
use sqlx::SqlitePool;

pub async fn list_bookmarks_by_file(
    pool: &SqlitePool,
    workspace_file_id: &str,
) -> Result<Vec<WorkspaceFileBookmark>, String> {
    sqlx::query_as::<_, WorkspaceFileBookmark>(
        r#"
        SELECT * FROM workspace_file_bookmarks
        WHERE workspace_file_id = ?
        ORDER BY bookmark_page ASC
        "#,
    )
    .bind(workspace_file_id)
    .fetch_all(pool)
    .await
    .map_err(|e| format!("Failed to list bookmarks for file: {}", e))
}