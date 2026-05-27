use sqlx::SqlitePool;

pub async fn toggle_archive_conversation(
    pool: &SqlitePool,
    id: &str,
    archive: bool,
) -> Result<(), String> {
    sqlx::query(
        "UPDATE ai_agent_conversations
         SET is_archived = ?
         WHERE id = ? AND is_active = 1",
    )
    .bind(archive)
    .bind(id)
    .execute(pool)
    .await
    .map_err(|e| format!("Failed to toggle archive conversation: {}", e))?;

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use chrono::Utc;
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
    async fn test_toggle_archive_to_true() {
        let (pool, _temp_dir) = crate::adapters::db::test_utils::setup_test_db().await;
        let conversation_id = "conv-archive-1";

        create_test_conversation(&pool, conversation_id, true).await;

        let result = toggle_archive_conversation(&pool, conversation_id, true).await;
        assert!(result.is_ok());

        // Verify archived
        let row = sqlx::query("SELECT is_archived FROM ai_agent_conversations WHERE id = ?")
            .bind(conversation_id)
            .fetch_one(&pool)
            .await
            .expect("Failed to query conversation");

        let is_archived: bool = row.get("is_archived");
        assert!(is_archived);
    }

    #[tokio::test]
    async fn test_toggle_archive_to_false() {
        let (pool, _temp_dir) = crate::adapters::db::test_utils::setup_test_db().await;
        let conversation_id = "conv-archive-2";

        create_test_conversation(&pool, conversation_id, true).await;

        // First archive it
        toggle_archive_conversation(&pool, conversation_id, true).await.unwrap();

        // Then unarchive it
        let result = toggle_archive_conversation(&pool, conversation_id, false).await;
        assert!(result.is_ok());

        // Verify not archived
        let row = sqlx::query("SELECT is_archived FROM ai_agent_conversations WHERE id = ?")
            .bind(conversation_id)
            .fetch_one(&pool)
            .await
            .expect("Failed to query conversation");

        let is_archived: bool = row.get("is_archived");
        assert!(!is_archived);
    }

    #[tokio::test]
    async fn test_toggle_archive_nonexistent_conversation() {
        let (pool, _temp_dir) = crate::adapters::db::test_utils::setup_test_db().await;

        let result = toggle_archive_conversation(&pool, "nonexistent-id", true).await;
        // Should succeed (idempotent operation)
        assert!(result.is_ok());
    }

    #[tokio::test]
    async fn test_toggle_archive_inactive_conversation() {
        let (pool, _temp_dir) = crate::adapters::db::test_utils::setup_test_db().await;
        let conversation_id = "conv-archive-inactive";

        create_test_conversation(&pool, conversation_id, false).await;

        let result = toggle_archive_conversation(&pool, conversation_id, true).await;
        assert!(result.is_ok());

        // Verify NOT archived (should not update inactive conversations)
        let row = sqlx::query("SELECT is_archived FROM ai_agent_conversations WHERE id = ?")
            .bind(conversation_id)
            .fetch_one(&pool)
            .await
            .expect("Failed to query conversation");

        let is_archived: bool = row.get("is_archived");
        assert!(!is_archived);
    }
}
