use sqlx::{Row, SqlitePool};

pub async fn count_conversations_by_workspace(
    pool: &SqlitePool,
    workspace_id: &str,
) -> Result<i32, String> {
    let row = sqlx::query(
        "SELECT COUNT(*) as count
         FROM ai_agent_conversations
         WHERE workspace_id = ? AND is_active = 1",
    )
    .bind(workspace_id)
    .fetch_one(pool)
    .await
    .map_err(|e| format!("Failed to count conversations: {}", e))?;

    let count: i64 = row.get("count");
    Ok(count as i32)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::adapters::db::repositories::conversation::create_conversation;
    use crate::adapters::db::test_utils::init_test_db;
    use crate::adapters::db::sqlite::DB_POOL;

    #[tokio::test]
    async fn test_count_conversations_empty() {
        init_test_db().await;
        let pool = DB_POOL.get().unwrap();

        let count = count_conversations_by_workspace(pool, "nonexistent-workspace")
            .await
            .unwrap();

        assert_eq!(count, 0);
    }

    #[tokio::test]
    async fn test_count_conversations_multiple() {
        init_test_db().await;
        let pool = DB_POOL.get().unwrap();
        let workspace_id = "test-workspace-count";

        // Create workspace first
        let now = chrono::Utc::now();
        sqlx::query(
            r#"INSERT INTO workspaces (id, name, created_at, updated_at, last_accessed_at)
               VALUES (?, ?, ?, ?, ?)"#,
        )
        .bind(workspace_id)
        .bind("Test Workspace")
        .bind(now)
        .bind(now)
        .bind(now)
        .execute(pool)
        .await
        .unwrap();

        // Create 3 conversations
        for i in 1..=3 {
            use crate::adapters::db::models::workspace_chats::CreateConversationRequest;
            let request = CreateConversationRequest {
                workspace_id: workspace_id.to_string(),
                title: format!("Chat {}", i),
                provider: "gemini".to_string(),
                model: "gemini-2.5-flash".to_string(),
            };
            create_conversation(pool, request)
                .await
                .unwrap();
        }

        let count = count_conversations_by_workspace(pool, workspace_id)
            .await
            .unwrap();

        assert_eq!(count, 3);
    }
}
