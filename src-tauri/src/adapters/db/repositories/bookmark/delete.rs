use sqlx::SqlitePool;

pub async fn delete_bookmark(pool: &SqlitePool, id: &str) -> Result<(), String> {
    sqlx::query("DELETE FROM workspace_file_bookmarks WHERE id = ?")
        .bind(id)
        .execute(pool)
        .await
        .map_err(|e| format!("Failed to delete bookmark: {}", e))?;

    Ok(())
}