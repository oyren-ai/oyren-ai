use crate::adapters::db::models::workspace_chats::Conversation;
use sqlx::{Row, SqlitePool};

pub async fn list_conversations_by_workspace(
    pool: &SqlitePool,
    workspace_id: &str,
) -> Result<Vec<Conversation>, String> {
    let rows = sqlx::query(
        "SELECT id, workspace_id, title, provider, model,
                created_at, updated_at, last_accessed_at,
                is_pinned, is_archived, is_active
         FROM ai_agent_conversations
         WHERE workspace_id = ? AND is_active = 1
         ORDER BY is_pinned DESC, updated_at DESC",
    )
    .bind(workspace_id)
    .fetch_all(pool)
    .await
    .map_err(|e| format!("Failed to list conversations: {}", e))?;

    Ok(rows
        .iter()
        .map(|row| Conversation {
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
        .collect())
}

#[cfg(test)]
mod tests {
    use super::*;
    use sqlx::{sqlite::SqlitePoolOptions, SqlitePool};
    use tempfile::TempDir;
    use chrono::{Duration, Utc};

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

    async fn create_test_conversation(
        pool: &SqlitePool,
        id: &str,
        workspace_id: &str,
        title: &str,
        is_pinned: bool,
        is_active: bool,
        minutes_ago: i64,
    ) {
        let now = Utc::now();
        let updated_at = now - Duration::minutes(minutes_ago);
        sqlx::query(
            "INSERT INTO ai_agent_conversations
             (id, workspace_id, title, provider, model, created_at, updated_at, last_accessed_at, is_pinned, is_archived, is_active)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        )
        .bind(id)
        .bind(workspace_id)
        .bind(title)
        .bind("gemini")
        .bind("gemini-2.5-flash")
        .bind(&now)
        .bind(&updated_at)
        .bind(&now)
        .bind(is_pinned)
        .bind(false)
        .bind(is_active)
        .execute(pool)
        .await
        .expect("Failed to create test conversation");
    }

    #[tokio::test]
    async fn test_list_conversations_empty() {
        let (pool, _temp_dir) = setup_test_db().await;

        let result = list_conversations_by_workspace(&pool, "workspace-1").await;

        assert!(result.is_ok());
        let conversations = result.unwrap();
        assert_eq!(conversations.len(), 0);
    }

    #[tokio::test]
    async fn test_list_conversations_single() {
        let (pool, _temp_dir) = setup_test_db().await;

        create_test_conversation(&pool, "conv-1", "workspace-1", "Chat 1", false, true, 0).await;

        let result = list_conversations_by_workspace(&pool, "workspace-1").await;

        assert!(result.is_ok());
        let conversations = result.unwrap();
        assert_eq!(conversations.len(), 1);
        assert_eq!(conversations[0].title, "Chat 1");
    }

    #[tokio::test]
    async fn test_list_conversations_multiple() {
        let (pool, _temp_dir) = setup_test_db().await;

        create_test_conversation(&pool, "conv-1", "workspace-1", "Chat 1", false, true, 10).await;
        create_test_conversation(&pool, "conv-2", "workspace-1", "Chat 2", false, true, 5).await;
        create_test_conversation(&pool, "conv-3", "workspace-1", "Chat 3", false, true, 0).await;

        let result = list_conversations_by_workspace(&pool, "workspace-1").await;

        assert!(result.is_ok());
        let conversations = result.unwrap();
        assert_eq!(conversations.len(), 3);
    }

    #[tokio::test]
    async fn test_list_conversations_filters_by_workspace() {
        let (pool, _temp_dir) = setup_test_db().await;

        create_test_conversation(&pool, "conv-1", "workspace-1", "Chat 1", false, true, 0).await;
        create_test_conversation(&pool, "conv-2", "workspace-2", "Chat 2", false, true, 0).await;
        create_test_conversation(&pool, "conv-3", "workspace-1", "Chat 3", false, true, 0).await;

        let result = list_conversations_by_workspace(&pool, "workspace-1").await;

        assert!(result.is_ok());
        let conversations = result.unwrap();
        assert_eq!(conversations.len(), 2);
        assert!(conversations.iter().all(|c| c.workspace_id == "workspace-1"));
    }

    #[tokio::test]
    async fn test_list_conversations_excludes_inactive() {
        let (pool, _temp_dir) = setup_test_db().await;

        create_test_conversation(&pool, "conv-1", "workspace-1", "Active", false, true, 0).await;
        create_test_conversation(&pool, "conv-2", "workspace-1", "Deleted", false, false, 0).await;

        let result = list_conversations_by_workspace(&pool, "workspace-1").await;

        assert!(result.is_ok());
        let conversations = result.unwrap();
        assert_eq!(conversations.len(), 1);
        assert_eq!(conversations[0].title, "Active");
    }

    #[tokio::test]
    async fn test_list_conversations_order_pinned_first() {
        let (pool, _temp_dir) = setup_test_db().await;

        create_test_conversation(&pool, "conv-1", "workspace-1", "Normal", false, true, 0).await;
        create_test_conversation(&pool, "conv-2", "workspace-1", "Pinned", true, true, 10).await;

        let result = list_conversations_by_workspace(&pool, "workspace-1").await;

        assert!(result.is_ok());
        let conversations = result.unwrap();
        assert_eq!(conversations.len(), 2);
        // Pinned should come first
        assert_eq!(conversations[0].title, "Pinned");
        assert_eq!(conversations[1].title, "Normal");
    }

    #[tokio::test]
    async fn test_list_conversations_order_by_updated_at() {
        let (pool, _temp_dir) = setup_test_db().await;

        create_test_conversation(&pool, "conv-1", "workspace-1", "Oldest", false, true, 20).await;
        create_test_conversation(&pool, "conv-2", "workspace-1", "Middle", false, true, 10).await;
        create_test_conversation(&pool, "conv-3", "workspace-1", "Newest", false, true, 0).await;

        let result = list_conversations_by_workspace(&pool, "workspace-1").await;

        assert!(result.is_ok());
        let conversations = result.unwrap();
        assert_eq!(conversations.len(), 3);
        // Should be ordered by updated_at DESC
        assert_eq!(conversations[0].title, "Newest");
        assert_eq!(conversations[1].title, "Middle");
        assert_eq!(conversations[2].title, "Oldest");
    }
}
