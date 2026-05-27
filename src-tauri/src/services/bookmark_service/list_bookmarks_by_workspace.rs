use crate::adapters::db::{models::WorkspaceFileBookmark, repositories, sqlite};

pub async fn list_bookmarks_by_workspace(
    workspace_id: String,
) -> Result<Vec<WorkspaceFileBookmark>, String> {
    let pool = sqlite::get_db_pool()?;
    repositories::bookmark::list_bookmarks_by_workspace(pool, &workspace_id).await
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::adapters::db::test_utils::init_test_db;
    use crate::services::bookmark_service::create_bookmark;
    use chrono::Utc;
    use std::thread;
    use std::time::Duration;

    async fn setup_test_workspace_and_files(workspace_id: &str, file_ids: &[&str]) {
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

        for file_id in file_ids {
            sqlx::query(
                r#"
                INSERT INTO workspace_files (id, workspace_id, file_path, file_name, added_at, last_accessed_at, is_visible, is_read_only)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                "#,
            )
            .bind(file_id)
            .bind(workspace_id)
            .bind(format!("/path/to/{}.pdf", file_id))
            .bind(format!("{}.pdf", file_id))
            .bind(&now)
            .bind(&now)
            .bind(true)
            .bind(true)
            .execute(pool)
            .await
            .ok();
        }
    }

    #[tokio::test]
    async fn test_list_bookmarks_by_workspace_empty() {
        setup_test_workspace_and_files("ws-list-ws-1", &["file-1"]).await;

        let result = list_bookmarks_by_workspace("ws-list-ws-1".to_string()).await;
        assert!(result.is_ok());
        assert_eq!(result.unwrap().len(), 0);
    }

    #[tokio::test]
    async fn test_list_bookmarks_by_workspace_single() {
        setup_test_workspace_and_files("ws-list-ws-2", &["file-2"]).await;

        create_bookmark(
            "ws-list-ws-2".to_string(),
            "file-2".to_string(),
            1,
            "Single bookmark".to_string(),
            None,
        )
        .await
        .unwrap();

        let result = list_bookmarks_by_workspace("ws-list-ws-2".to_string()).await;
        assert!(result.is_ok());
        let bookmarks = result.unwrap();
        assert_eq!(bookmarks.len(), 1);
        assert_eq!(bookmarks[0].bookmark_description, "Single bookmark");
    }

    #[tokio::test]
    async fn test_list_bookmarks_by_workspace_multiple_ordered_by_date() {
        setup_test_workspace_and_files("ws-list-ws-3", &["file-3"]).await;

        create_bookmark(
            "ws-list-ws-3".to_string(),
            "file-3".to_string(),
            1,
            "First".to_string(),
            None,
        )
        .await
        .unwrap();

        thread::sleep(Duration::from_millis(10));

        create_bookmark(
            "ws-list-ws-3".to_string(),
            "file-3".to_string(),
            2,
            "Second".to_string(),
            None,
        )
        .await
        .unwrap();

        thread::sleep(Duration::from_millis(10));

        create_bookmark(
            "ws-list-ws-3".to_string(),
            "file-3".to_string(),
            3,
            "Third".to_string(),
            None,
        )
        .await
        .unwrap();

        let result = list_bookmarks_by_workspace("ws-list-ws-3".to_string()).await;
        assert!(result.is_ok());
        let bookmarks = result.unwrap();
        assert_eq!(bookmarks.len(), 3);
        assert_eq!(bookmarks[0].bookmark_description, "Third");
        assert_eq!(bookmarks[1].bookmark_description, "Second");
        assert_eq!(bookmarks[2].bookmark_description, "First");
    }

    #[tokio::test]
    async fn test_list_bookmarks_by_workspace_across_files() {
        setup_test_workspace_and_files("ws-list-ws-4", &["file-4a", "file-4b"]).await;

        create_bookmark(
            "ws-list-ws-4".to_string(),
            "file-4a".to_string(),
            1,
            "From file A".to_string(),
            None,
        )
        .await
        .unwrap();

        create_bookmark(
            "ws-list-ws-4".to_string(),
            "file-4b".to_string(),
            1,
            "From file B".to_string(),
            None,
        )
        .await
        .unwrap();

        let result = list_bookmarks_by_workspace("ws-list-ws-4".to_string()).await;
        assert!(result.is_ok());
        let bookmarks = result.unwrap();
        assert_eq!(bookmarks.len(), 2);
    }

    #[tokio::test]
    async fn test_list_bookmarks_by_workspace_nonexistent() {
        init_test_db().await;

        let result = list_bookmarks_by_workspace("nonexistent-workspace".to_string()).await;
        assert!(result.is_ok());
        assert_eq!(result.unwrap().len(), 0);
    }
}