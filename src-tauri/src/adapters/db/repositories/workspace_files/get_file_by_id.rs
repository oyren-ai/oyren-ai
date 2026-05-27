use crate::adapters::db::models::WorkspaceFile;
use sqlx::SqlitePool;

pub async fn get_workspace_file(pool: &SqlitePool, file_id: &str) -> Result<WorkspaceFile, String> {
    sqlx::query_as::<_, WorkspaceFile>(
        r#"
        SELECT id, workspace_id, file_path, file_name, added_at,
               last_accessed_at, is_visible, is_read_only, metadata,
               sync_id, cloud_file_uuid, content_hash, last_synced_at,
               local_status
        FROM workspace_files
        WHERE id = ?
        "#,
    )
    .bind(file_id)
    .fetch_one(pool)
    .await
    .map_err(|e| format!("Failed to get file by id: {}", e))
}
