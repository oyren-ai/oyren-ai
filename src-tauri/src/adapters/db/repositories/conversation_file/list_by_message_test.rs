#[cfg(test)]
mod tests {
    use crate::adapters::db::models::conversation_file::CreateConversationFileRequest;
    use crate::adapters::db::repositories::conversation_file::{
        create_conversation_file, list_files_by_message,
    };
    use chrono::Utc;
    use sqlx::SqlitePool;

    async fn setup_test_data(pool: &SqlitePool) {
        let now = Utc::now();

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
    }

    #[tokio::test]
    async fn test_list_files_by_message_success() {
        let (pool, _temp_dir) = crate::adapters::db::test_utils::setup_test_db().await;
        setup_test_data(&pool).await;

        // Create 2 files for the same message
        let request1 = CreateConversationFileRequest {
            workspace_file_id: None,
            conversation_id: "conv-1".to_string(),
            conversation_message_id: "msg-1".to_string(),
            filename: "file1.pdf".to_string(),
            is_attachment: true,
        };
        create_conversation_file(&pool, request1).await.unwrap();

        let request2 = CreateConversationFileRequest {
            workspace_file_id: None,
            conversation_id: "conv-1".to_string(),
            conversation_message_id: "msg-1".to_string(),
            filename: "file2.pdf".to_string(),
            is_attachment: true,
        };
        create_conversation_file(&pool, request2).await.unwrap();

        let result = list_files_by_message(&pool, "msg-1").await;

        assert!(result.is_ok());
        let files = result.unwrap();
        assert_eq!(files.len(), 2);

        // Check filenames
        let filenames: Vec<String> = files
            .iter()
            .map(|f| {
                let metadata: serde_json::Value = serde_json::from_str(&f.metadata).unwrap();
                metadata["filename"].as_str().unwrap().to_string()
            })
            .collect();
        assert!(filenames.contains(&"file1.pdf".to_string()));
        assert!(filenames.contains(&"file2.pdf".to_string()));
    }

    #[tokio::test]
    async fn test_list_files_empty_message() {
        let (pool, _temp_dir) = crate::adapters::db::test_utils::setup_test_db().await;
        setup_test_data(&pool).await;

        let result = list_files_by_message(&pool, "msg-1").await;

        assert!(result.is_ok());
        let files = result.unwrap();
        assert_eq!(files.len(), 0);
    }

    #[tokio::test]
    async fn test_list_files_preserves_metadata() {
        let (pool, _temp_dir) = crate::adapters::db::test_utils::setup_test_db().await;
        setup_test_data(&pool).await;

        let request = CreateConversationFileRequest {
            workspace_file_id: None,
            conversation_id: "conv-1".to_string(),
            conversation_message_id: "msg-1".to_string(),
            filename: "test.pdf".to_string(),
            is_attachment: true,
        };
        create_conversation_file(&pool, request).await.unwrap();

        let result = list_files_by_message(&pool, "msg-1").await;
        assert!(result.is_ok());

        let files = result.unwrap();
        assert_eq!(files.len(), 1);

        let file = &files[0];
        let metadata: serde_json::Value = serde_json::from_str(&file.metadata).unwrap();
        assert_eq!(metadata["filename"].as_str().unwrap(), "test.pdf");
    }
}
