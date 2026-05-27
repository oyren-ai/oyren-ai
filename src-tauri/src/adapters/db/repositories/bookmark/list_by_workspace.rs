use crate::adapters::db::models::WorkspaceFileBookmark;
use sqlx::SqlitePool;

pub async fn list_bookmarks_by_workspace(
    pool: &SqlitePool,
    workspace_id: &str,
) -> Result<Vec<WorkspaceFileBookmark>, String> {
    sqlx::query_as::<_, WorkspaceFileBookmark>(
        r#"
        SELECT * FROM workspace_file_bookmarks
        WHERE workspace_id = ?
        ORDER BY date_created DESC
        "#,
    )
    .bind(workspace_id)
    .fetch_all(pool)
    .await
    .map_err(|e| format!("Failed to list bookmarks for workspace: {}", e))
}