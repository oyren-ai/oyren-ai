use crate::adapters::db::{
    models::{CreateBookmarkRequest, WorkspaceFileBookmark},
    repositories, sqlite,
};

pub async fn create_bookmark(
    workspace_id: String,
    workspace_file_id: String,
    bookmark_page: i32,
    bookmark_description: String,
    metadata: Option<String>,
) -> Result<WorkspaceFileBookmark, String> {
    if bookmark_description.len() > 50 {
        return Err("Bookmark description must be 50 characters or less".to_string());
    }

    let pool = sqlite::get_db_pool()?;

    let request = CreateBookmarkRequest {
        workspace_id,
        workspace_file_id,
        bookmark_page,
        bookmark_description,
        metadata,
    };

    repositories::bookmark::create_bookmark(pool, request).await
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::adapters::db::test_utils::init_test_db;
    use chrono::Utc;

    async fn setup_test_workspace_and_file(workspace_id: &str, file_id: &str) {
        init_test_db().await;
        let pool = sqlite::get_db_pool().unwrap();
        let now = Utc::now();

        // Insert workspace
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

        // Insert workspace_file
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
    async fn test_create_bookmark_success() {
        setup_test_workspace_and_file("ws-create-1", "file-create-1").await;

        let result = create_bookmark(
            "ws-create-1".to_string(),
            "file-create-1".to_string(),
            42,
            "Important passage".to_string(),
            None,
        )
        .await;

        assert!(result.is_ok());
        let bookmark = result.unwrap();
        assert_eq!(bookmark.workspace_id, "ws-create-1");
        assert_eq!(bookmark.workspace_file_id, "file-create-1");
        assert_eq!(bookmark.bookmark_page, 42);
        assert_eq!(bookmark.bookmark_description, "Important passage");
        assert!(bookmark.metadata.is_none());
    }

    #[tokio::test]
    async fn test_create_bookmark_with_metadata() {
        setup_test_workspace_and_file("ws-create-2", "file-create-2").await;

        let metadata_json = r##"{"isPinned": true, "color": "#FFFF00"}"##;

        let result = create_bookmark(
            "ws-create-2".to_string(),
            "file-create-2".to_string(),
            10,
            "Key concept".to_string(),
            Some(metadata_json.to_string()),
        )
        .await;

        assert!(result.is_ok());
        let bookmark = result.unwrap();
        assert_eq!(bookmark.workspace_id, "ws-create-2");
        assert_eq!(bookmark.bookmark_page, 10);
        assert!(bookmark.metadata.is_some());
        assert_eq!(bookmark.metadata.unwrap(), metadata_json);
    }

    #[tokio::test]
    async fn test_create_bookmark_description_too_long() {
        setup_test_workspace_and_file("ws-create-3", "file-create-3").await;

        let long_description = "a".repeat(51);

        let result = create_bookmark(
            "ws-create-3".to_string(),
            "file-create-3".to_string(),
            5,
            long_description,
            None,
        )
        .await;

        assert!(result.is_err());
        assert_eq!(
            result.unwrap_err(),
            "Bookmark description must be 50 characters or less"
        );
    }

    #[tokio::test]
    async fn test_create_bookmark_description_exactly_50_chars() {
        setup_test_workspace_and_file("ws-create-4", "file-create-4").await;

        let exact_50_chars = "a".repeat(50);

        let result = create_bookmark(
            "ws-create-4".to_string(),
            "file-create-4".to_string(),
            25,
            exact_50_chars.clone(),
            None,
        )
        .await;

        assert!(result.is_ok());
        let bookmark = result.unwrap();
        assert_eq!(bookmark.bookmark_description, exact_50_chars);
    }

    #[tokio::test]
    async fn test_create_bookmark_multiple_for_same_file() {
        setup_test_workspace_and_file("ws-create-5", "file-create-5").await;

        let result1 = create_bookmark(
            "ws-create-5".to_string(),
            "file-create-5".to_string(),
            1,
            "First bookmark".to_string(),
            None,
        )
        .await;

        let result2 = create_bookmark(
            "ws-create-5".to_string(),
            "file-create-5".to_string(),
            10,
            "Second bookmark".to_string(),
            None,
        )
        .await;

        assert!(result1.is_ok());
        assert!(result2.is_ok());

        let bookmark1 = result1.unwrap();
        let bookmark2 = result2.unwrap();
        assert_ne!(bookmark1.id, bookmark2.id);
        assert_eq!(bookmark1.workspace_file_id, bookmark2.workspace_file_id);
    }

    #[tokio::test]
    async fn test_create_bookmark_empty_description() {
        setup_test_workspace_and_file("ws-create-6", "file-create-6").await;

        let result = create_bookmark(
            "ws-create-6".to_string(),
            "file-create-6".to_string(),
            1,
            "".to_string(),
            None,
        )
        .await;

        assert!(result.is_ok());
        let bookmark = result.unwrap();
        assert_eq!(bookmark.bookmark_description, "");
    }
}