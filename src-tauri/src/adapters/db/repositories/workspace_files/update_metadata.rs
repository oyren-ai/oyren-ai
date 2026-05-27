use sqlx::SqlitePool;

/// Updates the metadata JSON field for a workspace file
pub async fn update_metadata(
    pool: &SqlitePool,
    file_id: &str,
    metadata: Option<String>,
) -> Result<(), String> {
    sqlx::query(
        r#"
        UPDATE workspace_files
        SET metadata = ?
        WHERE id = ?
        "#,
    )
    .bind(&metadata)
    .bind(file_id)
    .execute(pool)
    .await
    .map_err(|e| format!("Failed to update file metadata: {}", e))?;

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::adapters::db::repositories::workspace_files;
    use crate::adapters::db::test_utils::init_test_db;

    #[tokio::test]
    async fn test_update_metadata_success() {
        init_test_db().await;
        let pool = crate::adapters::db::sqlite::get_db_pool().unwrap();

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

        let file = workspace_files::add_file_to_workspace(
            workspace_id.clone(),
            "/path/to/file.pdf".to_string(),
            "file.pdf".to_string(),
        )
        .await
        .unwrap();

        assert!(file.metadata.is_none());

        let new_metadata = r#"{"category": "scan", "page_count": 5}"#;
        let result = update_metadata(pool, &file.id, Some(new_metadata.to_string())).await;
        assert!(result.is_ok());

        let updated = workspace_files::get_workspace_file(pool, &file.id)
            .await
            .unwrap();
        assert_eq!(updated.metadata, Some(new_metadata.to_string()));
    }

    #[tokio::test]
    async fn test_update_metadata_to_none() {
        init_test_db().await;
        let pool = crate::adapters::db::sqlite::get_db_pool().unwrap();

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

        let file = workspace_files::add_file_to_workspace_with_metadata(
            workspace_id.clone(),
            "/path/to/file2.pdf".to_string(),
            "file2.pdf".to_string(),
            Some(r#"{"old": true}"#.to_string()),
        )
        .await
        .unwrap();

        assert!(file.metadata.is_some());

        let result = update_metadata(pool, &file.id, None).await;
        assert!(result.is_ok());

        let updated = workspace_files::get_workspace_file(pool, &file.id)
            .await
            .unwrap();
        assert!(updated.metadata.is_none());
    }
}
