use sqlx::SqlitePool;

pub async fn delete_file(pool: &SqlitePool, file_id: &str) -> Result<(), String> {
    sqlx::query(
        r#"
        DELETE FROM workspace_files
        WHERE id = ?
        "#,
    )
    .bind(file_id)
    .execute(pool)
    .await
    .map_err(|e| format!("Failed to delete file: {}", e))?;

    Ok(())
}
