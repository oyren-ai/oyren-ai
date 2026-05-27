use crate::adapters::db::sqlite;

/// Soft-delete: mark file as 'local_deleted' (preserves DB row for sync tracking).
/// The caller is responsible for removing the physical file from disk.
pub async fn soft_delete_file(file_id: &str) -> Result<(), String> {
    let pool = sqlite::get_db_pool()?;

    sqlx::query(
        r#"
        UPDATE workspace_files
        SET local_status = 'local_deleted'
        WHERE id = ?
        "#,
    )
    .bind(file_id)
    .execute(pool)
    .await
    .map_err(|e| format!("Failed to soft-delete file: {}", e))?;

    Ok(())
}

/// Restore a soft-deleted file back to active status.
pub async fn restore_file(file_id: &str) -> Result<(), String> {
    let pool = sqlite::get_db_pool()?;

    let result = sqlx::query(
        r#"
        UPDATE workspace_files
        SET local_status = 'active'
        WHERE id = ? AND local_status = 'local_deleted'
        "#,
    )
    .bind(file_id)
    .execute(pool)
    .await
    .map_err(|e| format!("Failed to restore file: {}", e))?;

    if result.rows_affected() == 0 {
        return Err("File not found or not in deleted state".to_string());
    }

    Ok(())
}

/// Restore a soft-deleted file and update its file path (after re-downloading from cloud).
pub async fn restore_file_with_path(file_id: &str, new_file_path: &str) -> Result<(), String> {
    let pool = sqlite::get_db_pool()?;

    let result = sqlx::query(
        r#"
        UPDATE workspace_files
        SET local_status = 'active', file_path = ?
        WHERE id = ? AND local_status = 'local_deleted'
        "#,
    )
    .bind(new_file_path)
    .bind(file_id)
    .execute(pool)
    .await
    .map_err(|e| format!("Failed to restore file: {}", e))?;

    if result.rows_affected() == 0 {
        return Err("File not found or not in deleted state".to_string());
    }

    Ok(())
}
