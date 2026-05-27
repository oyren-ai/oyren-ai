use crate::adapters::db::models::workspace_chats::{Conversation, CreateConversationRequest};
use chrono::Utc;
use sqlx::SqlitePool;
use uuid::Uuid;

pub async fn create_conversation(
    pool: &SqlitePool,
    request: CreateConversationRequest,
) -> Result<Conversation, String> {
    let id = Uuid::new_v4().to_string();
    let now = Utc::now();

    let conversation = Conversation {
        id: id.clone(),
        workspace_id: request.workspace_id,
        title: request.title,
        provider: request.provider,
        model: request.model,
        created_at: now,
        updated_at: now,
        last_accessed_at: now,
        is_pinned: false,
        is_archived: false,
        is_active: true,
    };

    sqlx::query(
        "INSERT INTO ai_agent_conversations
         (id, workspace_id, title, provider, model, created_at, updated_at, last_accessed_at, is_pinned, is_archived, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    )
    .bind(&conversation.id)
    .bind(&conversation.workspace_id)
    .bind(&conversation.title)
    .bind(&conversation.provider)
    .bind(&conversation.model)
    .bind(&conversation.created_at)
    .bind(&conversation.updated_at)
    .bind(&conversation.last_accessed_at)
    .bind(conversation.is_pinned)
    .bind(conversation.is_archived)
    .bind(conversation.is_active)
    .execute(pool)
    .await
    .map_err(|e| format!("Failed to create conversation: {}", e))?;

    Ok(conversation)
}

#[cfg(test)]
mod tests {
    use super::*;
    use sqlx::{sqlite::SqlitePoolOptions, SqlitePool};
    use tempfile::TempDir;

    async fn setup_test_db() -> (SqlitePool, TempDir) {
        let temp_dir = TempDir::new().expect("Failed to create temp directory");
        let db_path = temp_dir.path().join("test.db");
        let db_url = format!("sqlite://{}?mode=rwc", db_path.display());

        let pool = SqlitePoolOptions::new()
            .max_connections(1)
            .connect(&db_url)
            .await
            .expect("Failed to create test database");

        // Create conversations table
        sqlx::query(
            r#"
            CREATE TABLE IF NOT EXISTS ai_agent_conversations (
                id TEXT PRIMARY KEY NOT NULL,
                workspace_id TEXT NOT NULL,
                title TEXT NOT NULL,
                provider TEXT NOT NULL,
                model TEXT NOT NULL,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                last_accessed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                is_pinned BOOLEAN NOT NULL DEFAULT 0,
                is_archived BOOLEAN NOT NULL DEFAULT 0,
                is_active BOOLEAN NOT NULL DEFAULT 1
            )
            "#,
        )
        .execute(&pool)
        .await
        .expect("Failed to create conversations table");

        (pool, temp_dir)
    }

    #[tokio::test]
    async fn test_create_conversation_success() {
        let (pool, _temp_dir) = setup_test_db().await;

        let request = CreateConversationRequest {
            workspace_id: "workspace-123".to_string(),
            title: "Test Conversation".to_string(),
            provider: "gemini".to_string(),
            model: "gemini-2.5-flash".to_string(),
        };

        let result = create_conversation(&pool, request.clone()).await;

        assert!(result.is_ok());
        let conversation = result.unwrap();
        assert_eq!(conversation.workspace_id, "workspace-123");
        assert_eq!(conversation.title, "Test Conversation");
        assert_eq!(conversation.provider, "gemini");
        assert_eq!(conversation.model, "gemini-2.5-flash");
        assert!(!conversation.is_pinned);
        assert!(!conversation.is_archived);
        assert!(conversation.is_active);
    }

    #[tokio::test]
    async fn test_create_conversation_with_different_providers() {
        let (pool, _temp_dir) = setup_test_db().await;

        let request = CreateConversationRequest {
            workspace_id: "workspace-456".to_string(),
            title: "DeepSeek Chat".to_string(),
            provider: "deepseek".to_string(),
            model: "deepseek-chat".to_string(),
        };

        let result = create_conversation(&pool, request).await;

        assert!(result.is_ok());
        let conversation = result.unwrap();
        assert_eq!(conversation.provider, "deepseek");
        assert_eq!(conversation.model, "deepseek-chat");
    }

    #[tokio::test]
    async fn test_create_multiple_conversations() {
        let (pool, _temp_dir) = setup_test_db().await;

        let request1 = CreateConversationRequest {
            workspace_id: "workspace-1".to_string(),
            title: "First Chat".to_string(),
            provider: "gemini".to_string(),
            model: "gemini-2.5-flash".to_string(),
        };

        let request2 = CreateConversationRequest {
            workspace_id: "workspace-1".to_string(),
            title: "Second Chat".to_string(),
            provider: "deepseek".to_string(),
            model: "deepseek-chat".to_string(),
        };

        let result1 = create_conversation(&pool, request1).await;
        let result2 = create_conversation(&pool, request2).await;

        assert!(result1.is_ok());
        assert!(result2.is_ok());

        let conv1 = result1.unwrap();
        let conv2 = result2.unwrap();

        // Ensure they have different IDs
        assert_ne!(conv1.id, conv2.id);
    }
}
