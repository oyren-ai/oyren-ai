use crate::adapters::db::models::workspace_chats::Conversation;
use sqlx::{Row, SqlitePool};

pub async fn get_conversation_by_id(
    pool: &SqlitePool,
    id: &str,
) -> Result<Conversation, String> {
    let row = sqlx::query(
        "SELECT id, workspace_id, title, provider, model,
                created_at, updated_at, last_accessed_at,
                is_pinned, is_archived, is_active
         FROM ai_agent_conversations
         WHERE id = ? AND is_active = 1",
    )
    .bind(id)
    .fetch_one(pool)
    .await
    .map_err(|e| format!("Failed to get conversation: {}", e))?;

    Ok(Conversation {
        id: row.get("id"),
        workspace_id: row.get("workspace_id"),
        title: row.get("title"),
        provider: row.get("provider"),
        model: row.get("model"),
        created_at: row.get("created_at"),
        updated_at: row.get("updated_at"),
        last_accessed_at: row.get("last_accessed_at"),
        is_pinned: row.get("is_pinned"),
        is_archived: row.get("is_archived"),
        is_active: row.get("is_active"),
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use sqlx::{sqlite::SqlitePoolOptions, SqlitePool};
    use tempfile::TempDir;
    use chrono::Utc;

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

    async fn create_test_conversation(pool: &SqlitePool, id: &str, title: &str, is_active: bool) {
        let now = Utc::now();
        sqlx::query(
            "INSERT INTO ai_agent_conversations
             (id, workspace_id, title, provider, model, created_at, updated_at, last_accessed_at, is_pinned, is_archived, is_active)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        )
        .bind(id)
        .bind("workspace-1")
        .bind(title)
        .bind("gemini")
        .bind("gemini-2.5-flash")
        .bind(&now)
        .bind(&now)
        .bind(&now)
        .bind(false)
        .bind(false)
        .bind(is_active)
        .execute(pool)
        .await
        .expect("Failed to create test conversation");
    }

    #[tokio::test]
    async fn test_get_conversation_by_id_success() {
        let (pool, _temp_dir) = setup_test_db().await;
        let conversation_id = "conv-123";

        create_test_conversation(&pool, conversation_id, "Test Chat", true).await;

        let result = get_conversation_by_id(&pool, conversation_id).await;

        assert!(result.is_ok());
        let conversation = result.unwrap();
        assert_eq!(conversation.id, conversation_id);
        assert_eq!(conversation.title, "Test Chat");
        assert_eq!(conversation.provider, "gemini");
        assert_eq!(conversation.model, "gemini-2.5-flash");
        assert!(conversation.is_active);
    }

    #[tokio::test]
    async fn test_get_conversation_by_id_not_found() {
        let (pool, _temp_dir) = setup_test_db().await;

        let result = get_conversation_by_id(&pool, "nonexistent-id").await;

        assert!(result.is_err());
        assert!(result.unwrap_err().contains("Failed to get conversation"));
    }

    #[tokio::test]
    async fn test_get_conversation_by_id_inactive() {
        let (pool, _temp_dir) = setup_test_db().await;
        let conversation_id = "conv-inactive";

        // Create inactive conversation
        create_test_conversation(&pool, conversation_id, "Deleted Chat", false).await;

        let result = get_conversation_by_id(&pool, conversation_id).await;

        // Should not find inactive conversations
        assert!(result.is_err());
    }

    #[tokio::test]
    async fn test_get_conversation_preserves_all_fields() {
        let (pool, _temp_dir) = setup_test_db().await;
        let conversation_id = "conv-full";

        create_test_conversation(&pool, conversation_id, "Full Details", true).await;

        let result = get_conversation_by_id(&pool, conversation_id).await;

        assert!(result.is_ok());
        let conversation = result.unwrap();
        assert_eq!(conversation.workspace_id, "workspace-1");
        assert!(!conversation.is_pinned);
        assert!(!conversation.is_archived);
    }
}
