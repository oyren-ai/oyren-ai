use chrono::Utc;
use sqlx::SqlitePool;

pub async fn update_conversation_last_accessed(
    pool: &SqlitePool,
    id: &str,
) -> Result<(), String> {
    let now = Utc::now();

    sqlx::query(
        "UPDATE ai_agent_conversations
         SET last_accessed_at = ?
         WHERE id = ? AND is_active = 1",
    )
    .bind(now)
    .bind(id)
    .execute(pool)
    .await
    .map_err(|e| format!("Failed to update last accessed: {}", e))?;

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use chrono::{Duration, Utc};
    use sqlx::{Row, SqlitePool};
    use tempfile::TempDir;

    async fn create_test_conversation(pool: &SqlitePool, id: &str, is_active: bool) {
        let now = Utc::now();

        // Create workspace first
        sqlx::query(
            "INSERT INTO workspaces (id, name, created_at, updated_at, last_accessed_at, is_active)
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
        .ok(); // Ignore error if workspace already exists

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
        .bind(is_active)
        .execute(pool)
        .await
        .expect("Failed to create test conversation");
    }

    #[tokio::test]
    async fn test_update_last_accessed_success() {
        let (pool, _temp_dir) = crate::adapters::db::test_utils::setup_test_db().await;
        let conversation_id = "conv-access-1";

        create_test_conversation(&pool, conversation_id, true).await;

        // Wait a bit to ensure timestamp difference
        tokio::time::sleep(tokio::time::Duration::from_millis(10)).await;

        let before_update = Utc::now();
        let result = update_conversation_last_accessed(&pool, conversation_id).await;
        assert!(result.is_ok());

        // Verify timestamp updated
        let row = sqlx::query("SELECT last_accessed_at FROM ai_agent_conversations WHERE id = ?")
            .bind(conversation_id)
            .fetch_one(&pool)
            .await
            .expect("Failed to query conversation");

        let last_accessed: chrono::DateTime<Utc> = row.get("last_accessed_at");
        assert!(last_accessed >= before_update);
    }

    #[tokio::test]
    async fn test_update_last_accessed_nonexistent_conversation() {
        let (pool, _temp_dir) = crate::adapters::db::test_utils::setup_test_db().await;

        let result = update_conversation_last_accessed(&pool, "nonexistent-id").await;
        // Should succeed (idempotent operation)
        assert!(result.is_ok());
    }

    #[tokio::test]
    async fn test_update_last_accessed_inactive_conversation() {
        let (pool, _temp_dir) = crate::adapters::db::test_utils::setup_test_db().await;
        let conversation_id = "conv-access-inactive";

        create_test_conversation(&pool, conversation_id, false).await;

        // Get original timestamp
        let original_row = sqlx::query("SELECT last_accessed_at FROM ai_agent_conversations WHERE id = ?")
            .bind(conversation_id)
            .fetch_one(&pool)
            .await
            .expect("Failed to query conversation");
        let original_time: chrono::DateTime<Utc> = original_row.get("last_accessed_at");

        tokio::time::sleep(tokio::time::Duration::from_millis(10)).await;

        let result = update_conversation_last_accessed(&pool, conversation_id).await;
        assert!(result.is_ok());

        // Verify NOT updated (should not update inactive conversations)
        let row = sqlx::query("SELECT last_accessed_at FROM ai_agent_conversations WHERE id = ?")
            .bind(conversation_id)
            .fetch_one(&pool)
            .await
            .expect("Failed to query conversation");

        let last_accessed: chrono::DateTime<Utc> = row.get("last_accessed_at");
        assert_eq!(last_accessed, original_time);
    }

    #[tokio::test]
    async fn test_update_last_accessed_multiple_times() {
        let (pool, _temp_dir) = crate::adapters::db::test_utils::setup_test_db().await;
        let conversation_id = "conv-access-multi";

        create_test_conversation(&pool, conversation_id, true).await;

        // First update
        tokio::time::sleep(tokio::time::Duration::from_millis(10)).await;
        update_conversation_last_accessed(&pool, conversation_id).await.unwrap();

        let row1 = sqlx::query("SELECT last_accessed_at FROM ai_agent_conversations WHERE id = ?")
            .bind(conversation_id)
            .fetch_one(&pool)
            .await
            .expect("Failed to query conversation");
        let time1: chrono::DateTime<Utc> = row1.get("last_accessed_at");

        // Second update
        tokio::time::sleep(tokio::time::Duration::from_millis(10)).await;
        update_conversation_last_accessed(&pool, conversation_id).await.unwrap();

        let row2 = sqlx::query("SELECT last_accessed_at FROM ai_agent_conversations WHERE id = ?")
            .bind(conversation_id)
            .fetch_one(&pool)
            .await
            .expect("Failed to query conversation");
        let time2: chrono::DateTime<Utc> = row2.get("last_accessed_at");

        // Second update should be later
        assert!(time2 >= time1);
    }
}
