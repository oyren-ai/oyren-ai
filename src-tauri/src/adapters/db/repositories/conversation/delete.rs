use sqlx::SqlitePool;

pub async fn delete_conversation(pool: &SqlitePool, id: &str) -> Result<(), String> {
    sqlx::query(
        "UPDATE ai_agent_conversations
         SET is_active = 0
         WHERE id = ?",
    )
    .bind(id)
    .execute(pool)
    .await
    .map_err(|e| format!("Failed to delete conversation: {}", e))?;

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use sqlx::{sqlite::SqlitePoolOptions, Row, SqlitePool};
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

    async fn create_test_conversation(pool: &SqlitePool, id: &str) {
        let now = Utc::now();
        sqlx::query(
            "INSERT INTO ai_agent_conversations
             (id, workspace_id, title, provider, model, created_at, updated_at, last_accessed_at, is_pinned, is_archived, is_active)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        )
        .bind(id)
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
        .expect("Failed to create test conversation");
    }

    #[tokio::test]
    async fn test_delete_conversation_success() {
        let (pool, _temp_dir) = setup_test_db().await;
        let conversation_id = "conv-123";

        create_test_conversation(&pool, conversation_id).await;

        let result = delete_conversation(&pool, conversation_id).await;
        assert!(result.is_ok());

        // Verify conversation is soft deleted
        let row = sqlx::query("SELECT is_active FROM ai_agent_conversations WHERE id = ?")
            .bind(conversation_id)
            .fetch_one(&pool)
            .await
            .expect("Failed to query conversation");

        let is_active: bool = row.get("is_active");
        assert!(!is_active);
    }

    #[tokio::test]
    async fn test_delete_nonexistent_conversation() {
        let (pool, _temp_dir) = setup_test_db().await;

        let result = delete_conversation(&pool, "nonexistent-id").await;
        // Should succeed (idempotent operation)
        assert!(result.is_ok());
    }

    #[tokio::test]
    async fn test_delete_already_deleted_conversation() {
        let (pool, _temp_dir) = setup_test_db().await;
        let conversation_id = "conv-456";

        create_test_conversation(&pool, conversation_id).await;

        // Delete once
        let result1 = delete_conversation(&pool, conversation_id).await;
        assert!(result1.is_ok());

        // Delete again (idempotent)
        let result2 = delete_conversation(&pool, conversation_id).await;
        assert!(result2.is_ok());

        // Verify still deleted
        let row = sqlx::query("SELECT is_active FROM ai_agent_conversations WHERE id = ?")
            .bind(conversation_id)
            .fetch_one(&pool)
            .await
            .expect("Failed to query conversation");

        let is_active: bool = row.get("is_active");
        assert!(!is_active);
    }
}
