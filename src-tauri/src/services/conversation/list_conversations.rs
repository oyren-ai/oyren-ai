use crate::adapters::db::{models::workspace_chats::Conversation, repositories, sqlite};

pub async fn list_conversations_by_workspace_id(
    workspace_id: String,
) -> Result<Vec<Conversation>, String> {
    let pool = sqlite::get_db_pool()?;
    repositories::conversation::list_conversations_by_workspace(pool, &workspace_id).await
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::adapters::db::models::workspace_chats::CreateConversationRequest;
    use chrono::Utc;
    use sqlx::SqlitePool;

    async fn setup_test_workspace(pool: &SqlitePool, workspace_id: &str) {
        let now = Utc::now();

        sqlx::query(
            "INSERT INTO workspaces (id, name, created_at, updated_at, last_accessed_at, is_active)
             VALUES (?, ?, ?, ?, ?, ?)",
        )
        .bind(workspace_id)
        .bind("Test Workspace")
        .bind(&now)
        .bind(&now)
        .bind(&now)
        .bind(true)
        .execute(pool)
        .await
        .expect("Failed to create workspace");
    }

    #[tokio::test]
    async fn test_list_conversations_success() {
        let (pool, _temp_dir) = crate::adapters::db::test_utils::setup_test_db().await;
        let workspace_id = "workspace-list-1";

        setup_test_workspace(&pool, workspace_id).await;

        // Create multiple conversations
        let request1 = CreateConversationRequest {
            workspace_id: workspace_id.to_string(),
            title: "Conversation 1".to_string(),
            provider: "gemini".to_string(),
            model: "gemini-2.5-flash".to_string(),
        };
        repositories::conversation::create_conversation(&pool, request1).await.unwrap();

        let request2 = CreateConversationRequest {
            workspace_id: workspace_id.to_string(),
            title: "Conversation 2".to_string(),
            provider: "deepseek".to_string(),
            model: "deepseek-chat".to_string(),
        };
        repositories::conversation::create_conversation(&pool, request2).await.unwrap();

        let conversations = repositories::conversation::list_conversations_by_workspace(&pool, workspace_id).await.unwrap();

        assert_eq!(conversations.len(), 2);
    }

    #[tokio::test]
    async fn test_list_conversations_empty() {
        let (pool, _temp_dir) = crate::adapters::db::test_utils::setup_test_db().await;
        let workspace_id = "workspace-list-empty";

        setup_test_workspace(&pool, workspace_id).await;

        let conversations = repositories::conversation::list_conversations_by_workspace(&pool, workspace_id).await.unwrap();

        assert_eq!(conversations.len(), 0);
    }

    #[tokio::test]
    async fn test_list_conversations_filters_by_workspace() {
        let (pool, _temp_dir) = crate::adapters::db::test_utils::setup_test_db().await;
        let workspace_id_1 = "workspace-list-filter-1";
        let workspace_id_2 = "workspace-list-filter-2";

        setup_test_workspace(&pool, workspace_id_1).await;
        setup_test_workspace(&pool, workspace_id_2).await;

        let request1 = CreateConversationRequest {
            workspace_id: workspace_id_1.to_string(),
            title: "Conv 1".to_string(),
            provider: "gemini".to_string(),
            model: "gemini-2.5-flash".to_string(),
        };
        repositories::conversation::create_conversation(&pool, request1).await.unwrap();

        let request2 = CreateConversationRequest {
            workspace_id: workspace_id_2.to_string(),
            title: "Conv 2".to_string(),
            provider: "gemini".to_string(),
            model: "gemini-2.5-flash".to_string(),
        };
        repositories::conversation::create_conversation(&pool, request2).await.unwrap();

        let conversations1 = repositories::conversation::list_conversations_by_workspace(&pool, workspace_id_1).await.unwrap();
        let conversations2 = repositories::conversation::list_conversations_by_workspace(&pool, workspace_id_2).await.unwrap();

        assert_eq!(conversations1.len(), 1);
        assert_eq!(conversations2.len(), 1);
        assert_eq!(conversations1[0].workspace_id, workspace_id_1);
        assert_eq!(conversations2[0].workspace_id, workspace_id_2);
    }
}