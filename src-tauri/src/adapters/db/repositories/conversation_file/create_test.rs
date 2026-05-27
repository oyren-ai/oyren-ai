#[cfg(test)]
mod tests {
    use crate::adapters::db::models::conversation_file::{
        ConversationFileMetadata, CreateConversationFileRequest,
    };
    use crate::adapters::db::repositories::conversation_file::create_conversation_file;
    use chrono::Utc;
    use sqlx::SqlitePool;

    async fn setup_test_data(pool: &SqlitePool) {
        let now = Utc::now();

        // Create workspace
        sqlx::query(
            "INSERT OR IGNORE INTO workspaces (id, name, created_at, updated_at, last_accessed_at, is_active)
             VALUES (?, ?, ?, ?, ?, ?)",
        )
        .bind("workspace-1")
        .bind("Test Workspace")
        .bind(&now)
        .bind(&now)
        .bind(&now)
        .bind(true)
        .execute(pool)
        .await
        .ok();

        // Create conversation
        sqlx::query(
            "INSERT OR IGNORE INTO ai_agent_conversations
             (id, workspace_id, title, provider, model, created_at, updated_at, last_accessed_at, is_pinned, is_archived, is_active)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        )
        .bind("conv-1")
        .bind("workspace-1")
        .bind("Test Conversation")
        .bind("gemini")
        .bind("gemini-2.5-flash")
        .bind(&now)
        .bind(&now)
        .bind(&now)
        .bind(false)
        .bind(false)
        .bind(true)
        .execute(pool)
        .await
        .ok();

        // Create message
        sqlx::query(
            "INSERT OR IGNORE INTO ai_agent_conversation_messages
             (id, conversation_id, role, content, created_at, sequence_number)
             VALUES (?, ?, ?, ?, ?, ?)",
        )
        .bind("msg-1")
        .bind("conv-1")
        .bind("user")
        .bind("Test message")
        .bind(&now)
        .bind(0)
        .execute(pool)
        .await
        .ok();

        // Create workspace file
        sqlx::query(
            "INSERT OR IGNORE INTO workspace_files
             (id, workspace_id, file_name, file_path, added_at, last_accessed_at, is_visible, is_read_only)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        )
        .bind("file-1")
        .bind("workspace-1")
        .bind("test.pdf")
        .bind("/path/to/test.pdf")
        .bind(&now)
        .bind(&now)
        .bind(true)
        .bind(true)
        .execute(pool)
        .await
        .ok();
    }

    #[tokio::test]
    async fn test_create_conversation_file_success() {
        let (pool, _temp_dir) = crate::adapters::db::test_utils::setup_test_db().await;
        setup_test_data(&pool).await;

        let request = CreateConversationFileRequest {
            workspace_file_id: Some("file-1".to_string()),
            conversation_id: "conv-1".to_string(),
            conversation_message_id: "msg-1".to_string(),
            filename: "test.pdf".to_string(),
            is_attachment: true,
        };

        let result = create_conversation_file(&pool, request).await;

        assert!(result.is_ok());
        let file = result.unwrap();
        assert_eq!(file.conversation_id, "conv-1");
        assert_eq!(file.conversation_message_id, "msg-1");
        assert_eq!(file.workspace_file_id, Some("file-1".to_string()));
        assert!(file.is_attachment);

        // Verify metadata JSON
        let metadata: ConversationFileMetadata = serde_json::from_str(&file.metadata).unwrap();
        assert_eq!(metadata.filename, "test.pdf");
    }

    #[tokio::test]
    async fn test_create_file_without_workspace_file_id() {
        let (pool, _temp_dir) = crate::adapters::db::test_utils::setup_test_db().await;
        setup_test_data(&pool).await;

        let request = CreateConversationFileRequest {
            workspace_file_id: None,
            conversation_id: "conv-1".to_string(),
            conversation_message_id: "msg-1".to_string(),
            filename: "external.pdf".to_string(),
            is_attachment: false,
        };

        let result = create_conversation_file(&pool, request).await;

        assert!(result.is_ok());
        let file = result.unwrap();
        assert_eq!(file.workspace_file_id, None);
        assert!(!file.is_attachment);
    }

    #[tokio::test]
    async fn test_create_file_metadata_serialization() {
        let (pool, _temp_dir) = crate::adapters::db::test_utils::setup_test_db().await;
        setup_test_data(&pool).await;

        let request = CreateConversationFileRequest {
            workspace_file_id: Some("file-1".to_string()),
            conversation_id: "conv-1".to_string(),
            conversation_message_id: "msg-1".to_string(),
            filename: "document.pdf".to_string(),
            is_attachment: true,
        };

        let result = create_conversation_file(&pool, request).await;
        assert!(result.is_ok());

        let file = result.unwrap();

        // Verify JSON structure
        assert!(file.metadata.contains("\"filename\""));
        assert!(file.metadata.contains("\"document.pdf\""));

        // Verify deserialization
        let metadata: ConversationFileMetadata = serde_json::from_str(&file.metadata).unwrap();
        assert_eq!(metadata.filename, "document.pdf");
    }
}
