use crate::adapters::db::models::conversation_file::ConversationFile;
use chrono::{DateTime, Utc};
use sqlx::{Row, SqlitePool};

/// Finds a conversation file by conversation_message_id and workspace_file_id
/// Returns None if no matching record is found
pub async fn find_by_message_and_file(
    pool: &SqlitePool,
    message_id: &str,
    workspace_file_id: &str,
) -> Result<Option<ConversationFile>, String> {
    let row = sqlx::query(
        "SELECT id, workspace_file_id, conversation_id, conversation_message_id, metadata, is_attachment, created_at
         FROM ai_agent_conversation_files
         WHERE conversation_message_id = ? AND workspace_file_id = ?",
    )
    .bind(message_id)
    .bind(workspace_file_id)
    .fetch_optional(pool)
    .await
    .map_err(|e| format!("Failed to find conversation file by message and file: {}", e))?;

    Ok(row.map(|r| ConversationFile {
        id: r.get("id"),
        workspace_file_id: r.get("workspace_file_id"),
        conversation_id: r.get("conversation_id"),
        conversation_message_id: r.get("conversation_message_id"),
        metadata: r.get("metadata"),
        is_attachment: r.get("is_attachment"),
        created_at: r.get::<DateTime<Utc>, _>("created_at"),
    }))
}

#[cfg(test)]
mod tests {
    use super::*;
    use sqlx::SqlitePool;
    use tempfile::TempDir;
    use uuid::Uuid;

    async fn setup_test_db() -> (SqlitePool, TempDir) {
        let temp_dir = TempDir::new().expect("Failed to create temp directory");
        let db_path = temp_dir.path().join("test.db");
        let db_url = format!("sqlite://{}?mode=rwc", db_path.display());

        let pool = SqlitePool::connect(&db_url)
            .await
            .expect("Failed to create test database pool");

        // Run migrations
        sqlx::migrate!("./migrations")
            .run(&pool)
            .await
            .expect("Failed to run migrations");

        (pool, temp_dir)
    }

    #[tokio::test]
    async fn test_find_by_message_and_file_found() {
        let (pool, _temp_dir) = setup_test_db().await;
        let workspace_id = Uuid::new_v4().to_string();
        let conversation_id = Uuid::new_v4().to_string();
        let message_id = Uuid::new_v4().to_string();
        let file_id = Uuid::new_v4().to_string();
        let workspace_file_id = Uuid::new_v4().to_string();

        // Create workspace
        sqlx::query(
            "INSERT INTO workspaces (id, name, created_at, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)"
        )
        .bind(&workspace_id)
        .bind("Test Workspace")
        .execute(&pool)
        .await
        .expect("Failed to create workspace");

        // Create workspace file
        sqlx::query(
            "INSERT INTO workspace_files (id, workspace_id, file_path, file_name, added_at, last_accessed_at, is_visible, is_read_only)
             VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 1, 1)"
        )
        .bind(&workspace_file_id)
        .bind(&workspace_id)
        .bind("/test/file.pdf")
        .bind("file.pdf")
        .execute(&pool)
        .await
        .expect("Failed to create workspace file");

        // Create conversation
        sqlx::query(
            "INSERT INTO ai_agent_conversations (id, workspace_id, title, provider, model, created_at, updated_at) VALUES (?, ?, ?, 'gemini', 'gemini-2.5-flash', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)"
        )
        .bind(&conversation_id)
        .bind(&workspace_id)
        .bind("Test Conversation")
        .execute(&pool)
        .await
        .expect("Failed to create conversation");

        // Create message
        sqlx::query(
            "INSERT INTO ai_agent_conversation_messages (id, conversation_id, role, content, sequence_number, created_at) VALUES (?, ?, ?, ?, 0, CURRENT_TIMESTAMP)"
        )
        .bind(&message_id)
        .bind(&conversation_id)
        .bind("user")
        .bind("Test message")
        .execute(&pool)
        .await
        .expect("Failed to create message");

        // Create conversation file
        sqlx::query(
            "INSERT INTO ai_agent_conversation_files (id, workspace_file_id, conversation_id, conversation_message_id, metadata, is_attachment, created_at)
             VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)"
        )
        .bind(&file_id)
        .bind(&workspace_file_id)
        .bind(&conversation_id)
        .bind(&message_id)
        .bind(r#"{"filename": "file.pdf"}"#)
        .bind(false)
        .execute(&pool)
        .await
        .expect("Failed to create conversation file");

        // Test finding the file
        let result = find_by_message_and_file(&pool, &message_id, &workspace_file_id)
            .await
            .expect("Query should succeed");

        assert!(result.is_some());
        let found_file = result.unwrap();
        assert_eq!(found_file.id, file_id);
        assert_eq!(found_file.conversation_message_id, message_id);
        assert_eq!(found_file.workspace_file_id, Some(workspace_file_id));
    }

    #[tokio::test]
    async fn test_find_by_message_and_file_not_found() {
        let (pool, _temp_dir) = setup_test_db().await;
        let message_id = Uuid::new_v4().to_string();
        let workspace_file_id = Uuid::new_v4().to_string();

        // Test finding a non-existent conversation file
        let result = find_by_message_and_file(&pool, &message_id, &workspace_file_id)
            .await
            .expect("Query should succeed");

        assert!(result.is_none());
    }

    #[tokio::test]
    async fn test_find_by_message_and_file_wrong_message() {
        let (pool, _temp_dir) = setup_test_db().await;
        let workspace_id = Uuid::new_v4().to_string();
        let conversation_id = Uuid::new_v4().to_string();
        let message_id_1 = Uuid::new_v4().to_string();
        let message_id_2 = Uuid::new_v4().to_string();
        let workspace_file_id = Uuid::new_v4().to_string();

        // Create workspace
        sqlx::query(
            "INSERT INTO workspaces (id, name, created_at, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)"
        )
        .bind(&workspace_id)
        .bind("Test Workspace")
        .execute(&pool)
        .await
        .expect("Failed to create workspace");

        // Create workspace file
        sqlx::query(
            "INSERT INTO workspace_files (id, workspace_id, file_path, file_name, added_at, last_accessed_at, is_visible, is_read_only)
             VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 1, 1)"
        )
        .bind(&workspace_file_id)
        .bind(&workspace_id)
        .bind("/test/file.pdf")
        .bind("file.pdf")
        .execute(&pool)
        .await
        .expect("Failed to create workspace file");

        // Create conversation
        sqlx::query(
            "INSERT INTO ai_agent_conversations (id, workspace_id, title, provider, model, created_at, updated_at) VALUES (?, ?, ?, 'gemini', 'gemini-2.5-flash', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)"
        )
        .bind(&conversation_id)
        .bind(&workspace_id)
        .bind("Test Conversation")
        .execute(&pool)
        .await
        .expect("Failed to create conversation");

        // Create messages
        for msg_id in [&message_id_1, &message_id_2] {
            sqlx::query(
                "INSERT INTO ai_agent_conversation_messages (id, conversation_id, role, content, sequence_number, created_at) VALUES (?, ?, ?, ?, 0, CURRENT_TIMESTAMP)"
            )
            .bind(msg_id)
            .bind(&conversation_id)
            .bind("user")
            .bind("Test message")
            .execute(&pool)
            .await
            .expect("Failed to create message");
        }

        // Create conversation file for message 1
        sqlx::query(
            "INSERT INTO ai_agent_conversation_files (id, workspace_file_id, conversation_id, conversation_message_id, metadata, is_attachment, created_at)
             VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)"
        )
        .bind(Uuid::new_v4().to_string())
        .bind(&workspace_file_id)
        .bind(&conversation_id)
        .bind(&message_id_1)
        .bind(r#"{"filename": "file.pdf"}"#)
        .bind(false)
        .execute(&pool)
        .await
        .expect("Failed to create conversation file");

        // Test finding the file with message 2 (should not find it)
        let result = find_by_message_and_file(&pool, &message_id_2, &workspace_file_id)
            .await
            .expect("Query should succeed");

        assert!(result.is_none());
    }
}
