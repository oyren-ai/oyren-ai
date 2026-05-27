use crate::adapters::db::{models::WorkspaceFileBookmark, repositories, sqlite};

pub async fn list_bookmarks_by_file(
    workspace_file_id: String,
) -> Result<Vec<WorkspaceFileBookmark>, String> {
    let pool = sqlite::get_db_pool()?;
    repositories::bookmark::list_bookmarks_by_file(pool, &workspace_file_id).await
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
    async fn test_list_bookmarks_by_file_empty() {
        setup_test_workspace_and_file("ws-list-file-1", "file-list-file-1").await;

        let result = list_bookmarks_by_file("file-list-file-1".to_string()).await;
        assert!(result.is_ok());
        assert_eq!(result.unwrap().len(), 0);
    }

    #[tokio::test]
    async fn test_list_bookmarks_by_file_single() {
        setup_test_workspace_and_file("ws-list-file-2", "file-list-file-2").await;

        create_bookmark(
            "ws-list-file-2".to_string(),
            "file-list-file-2".to_string(),
            5,
            "Single bookmark".to_string(),
            None,
        )
        .await
        .unwrap();

        let result = list_bookmarks_by_file("file-list-file-2".to_string()).await;
        assert!(result.is_ok());
        let bookmarks = result.unwrap();
        assert_eq!(bookmarks.len(), 1);
        assert_eq!(bookmarks[0].bookmark_description, "Single bookmark");
    }

    #[tokio::test]
    async fn test_list_bookmarks_by_file_multiple_ordered_by_page() {
        setup_test_workspace_and_file("ws-list-file-3", "file-list-file-3").await;

        create_bookmark(
            "ws-list-file-3".to_string(),
            "file-list-file-3".to_string(),
            50,
            "Page 50".to_string(),
            None,
        )
        .await
        .unwrap();

        create_bookmark(
            "ws-list-file-3".to_string(),
            "file-list-file-3".to_string(),
            10,
            "Page 10".to_string(),
            None,
        )
        .await
        .unwrap();

        create_bookmark(
            "ws-list-file-3".to_string(),
            "file-list-file-3".to_string(),
            30,
            "Page 30".to_string(),
            None,
        )
        .await
        .unwrap();

        let result = list_bookmarks_by_file("file-list-file-3".to_string()).await;
        assert!(result.is_ok());
        let bookmarks = result.unwrap();
        assert_eq!(bookmarks.len(), 3);
        assert_eq!(bookmarks[0].bookmark_page, 10);
        assert_eq!(bookmarks[1].bookmark_page, 30);
        assert_eq!(bookmarks[2].bookmark_page, 50);
    }

    #[tokio::test]
    async fn test_list_bookmarks_by_file_nonexistent_file() {
        init_test_db().await;

        let result = list_bookmarks_by_file("nonexistent-file".to_string()).await;
        assert!(result.is_ok());
        assert_eq!(result.unwrap().len(), 0);
    }
}