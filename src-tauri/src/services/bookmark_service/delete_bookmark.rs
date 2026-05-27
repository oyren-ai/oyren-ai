use crate::adapters::db::{repositories, sqlite};

pub async fn delete_bookmark(id: String) -> Result<(), String> {
    let pool = sqlite::get_db_pool()?;
    repositories::bookmark::delete_bookmark(pool, &id).await
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::adapters::db::test_utils::init_test_db;
    use crate::services::bookmark_service::create_bookmark;
    use chrono::Utc;

    async fn setup_test_workspace_and_file(workspace_id: &str, file_id: &str) {
        init_test_db().await;
        let pool = sqlite::get_db_pool().unwrap();
        let now = Utc::now();

        sqlx::query(
            r#"
            INSERT INTO workspaces (id, name, description, created_at, updated_at, last_accessed_at, is_pinned, is_archived, is_favourite, is_active)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            "#,
        )
        .bind(workspace_id)
        .bind("Test Workspace")
        .bind("Test Description")
        .bind(&now)
        .bind(&now)
        .bind(&now)
        .bind(false)
        .bind(false)
        .bind(false)
        .bind(true)
        .execute(pool)
        .await
        .ok();

        sqlx::query(
            r#"
            INSERT INTO workspace_files (id, workspace_id, file_path, file_name, added_at, last_accessed_at, is_visible, is_read_only)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            "#,
        )
        .bind(file_id)
        .bind(workspace_id)
        .bind("/path/to/document.pdf")
        .bind("document.pdf")
        .bind(&now)
        .bind(&now)
        .bind(true)
        .bind(true)
        .execute(pool)
        .await
        .ok();
    }

    #[tokio::test]
    async fn test_delete_bookmark_success() {
        setup_test_workspace_and_file("ws-delete-1", "file-delete-1").await;

        let bookmark = create_bookmark(
            "ws-delete-1".to_string(),
            "file-delete-1".to_string(),
            10,
            "To be deleted".to_string(),
            None,
        )
        .await
        .unwrap();

        let result = delete_bookmark(bookmark.id.clone()).await;
        assert!(result.is_ok());

        let pool = sqlite::get_db_pool().unwrap();
        let count: i32 = sqlx::query_scalar("SELECT COUNT(*) FROM workspace_file_bookmarks WHERE id = ?")
            .bind(&bookmark.id)
            .fetch_one(pool)
            .await
            .unwrap();

        assert_eq!(count, 0);
    }

    #[tokio::test]
    async fn test_delete_bookmark_nonexistent() {
        init_test_db().await;

        let result = delete_bookmark("nonexistent-id".to_string()).await;
        assert!(result.is_ok());
    }

    #[tokio::test]
    async fn test_delete_bookmark_idempotent() {
        setup_test_workspace_and_file("ws-delete-2", "file-delete-2").await;

        let bookmark = create_bookmark(
            "ws-delete-2".to_string(),
            "file-delete-2".to_string(),
            5,
            "Delete twice".to_string(),
            None,
        )
        .await
        .unwrap();

        let result1 = delete_bookmark(bookmark.id.clone()).await;
        assert!(result1.is_ok());

        let result2 = delete_bookmark(bookmark.id).await;
        assert!(result2.is_ok());
    }
}