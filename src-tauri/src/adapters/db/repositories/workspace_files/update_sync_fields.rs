use crate::adapters::db::models::WorkspaceFile;
use crate::adapters::db::sqlite;

/// Update sync-related fields on a workspace file after a successful sync operation.
pub async fn update_sync_fields(
    file_id: &str,
    sync_id: &str,
    cloud_file_uuid: &str,
    content_hash: &str,
    last_synced_at: &str,
) -> Result<(), String> {
    let pool = sqlite::get_db_pool()?;
    sqlx::query(
        r#"
        UPDATE workspace_files
        SET sync_id = ?, cloud_file_uuid = ?, content_hash = ?, last_synced_at = ?
        WHERE id = ?
        "#,
    )
    .bind(sync_id)
    .bind(cloud_file_uuid)
    .bind(content_hash)
    .bind(last_synced_at)
    .bind(file_id)
    .execute(pool)
    .await
    .map_err(|e| format!("Failed to update sync fields: {}", e))?;
    Ok(())
}

/// Find a workspace file by its sync_id within a workspace.
pub async fn find_by_sync_id(
    workspace_id: &str,
    sync_id: &str,
) -> Result<Option<WorkspaceFile>, String> {
    let pool = sqlite::get_db_pool()?;
    let row = sqlx::query_as::<_, WorkspaceFile>(
        r#"
        SELECT id, workspace_id, file_path, file_name, added_at, last_accessed_at,
               is_visible, is_read_only, metadata,
               sync_id, cloud_file_uuid, content_hash, last_synced_at,
               local_status
        FROM workspace_files
        WHERE workspace_id = ? AND sync_id = ?
        LIMIT 1
        "#,
    )
    .bind(workspace_id)
    .bind(sync_id)
    .fetch_optional(pool)
    .await
    .map_err(|e| format!("Failed to find file by sync_id: {}", e))?;
    Ok(row)
}
