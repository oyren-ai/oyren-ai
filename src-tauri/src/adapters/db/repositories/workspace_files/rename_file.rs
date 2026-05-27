use sqlx::SqlitePool;

/// Renames a workspace file in the database
pub async fn rename_file(
    pool: &SqlitePool,
    file_id: &str,
    new_file_path: &str,
    new_file_name: &str,
) -> Result<(), String> {
    sqlx::query(
        r#"
        UPDATE workspace_files
        SET file_path = ?, file_name = ?
        WHERE id = ?
        "#,
    )
    .bind(new_file_path)
    .bind(new_file_name)
    .bind(file_id)
    .execute(pool)
    .await
    .map_err(|e| format!("Failed to rename file in database: {}", e))?;

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::adapters::db::repositories::workspace_files;
    use crate::adapters::db::test_utils::init_test_db;

    #[tokio::test]
    async fn test_rename_file_success() {
        init_test_db().await;
        let pool = crate::adapters::db::sqlite::get_db_pool().unwrap();

        // Create workspace
        let workspace_id = uuid::Uuid::new_v4().to_string();
        let now = chrono::Utc::now();
        sqlx::query(
            r#"INSERT INTO workspaces (id, name, created_at, updated_at, last_accessed_at)
               VALUES (?, ?, ?, ?, ?)"#,
        )
        .bind(&workspace_id)
        .bind("Test Workspace")
        .bind(now)
        .bind(now)
        .bind(now)
        .execute(pool)
        .await
        .unwrap();

        // Add file
        let file = workspace_files::add_file_to_workspace(
            workspace_id.clone(),
            "/path/to/old.pdf".to_string(),
            "old.pdf".to_string(),
        )
        .await
        .unwrap();

        // Rename file
        let result = rename_file(pool, &file.id, "/path/to/new.pdf", "new.pdf").await;

        assert!(result.is_ok());

        // Verify update
        let updated = workspace_files::get_workspace_file(pool, &file.id)
            .await
            .unwrap();
        assert_eq!(updated.file_path, "/path/to/new.pdf");
        assert_eq!(updated.file_name, "new.pdf");
    }
}
