use crate::adapters::db::{
    models::workspace_chats::{Conversation, CreateConversationRequest},
    repositories, sqlite,
};

pub async fn create_conversation(
    workspace_id: String,
    title: String,
    provider: String,
    model: String,
) -> Result<Conversation, String> {
    let pool = sqlite::get_db_pool()?;

    let request = CreateConversationRequest {
        workspace_id,
        title,
        provider,
        model,
    };

    repositories::conversation::create_conversation(pool, request).await
}

#[cfg(test)]
mod tests {
    use super::*;
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
    async fn test_create_conversation_success() {
        let (pool, _temp_dir) = crate::adapters::db::test_utils::setup_test_db().await;
        let workspace_id = "workspace-create-1";

        setup_test_workspace(&pool, workspace_id).await;

        let request = CreateConversationRequest {
            workspace_id: workspace_id.to_string(),
            title: "My Conversation".to_string(),
            provider: "gemini".to_string(),
            model: "gemini-2.5-flash".to_string(),
        };

        let result = repositories::conversation::create_conversation(&pool, request).await;

        assert!(result.is_ok());
        let conversation = result.unwrap();
        assert_eq!(conversation.workspace_id, workspace_id);
        assert_eq!(conversation.title, "My Conversation");
        assert_eq!(conversation.provider, "gemini");
        assert_eq!(conversation.model, "gemini-2.5-flash");
        assert!(!conversation.is_pinned);
        assert!(!conversation.is_archived);
        assert!(conversation.is_active);
    }

    #[tokio::test]
    async fn test_create_conversation_with_different_providers() {
        let (pool, _temp_dir) = crate::adapters::db::test_utils::setup_test_db().await;
        let workspace_id = "workspace-create-2";

        setup_test_workspace(&pool, workspace_id).await;

        let request = CreateConversationRequest {
            workspace_id: workspace_id.to_string(),
            title: "DeepSeek Chat".to_string(),
            provider: "deepseek".to_string(),
            model: "deepseek-chat".to_string(),
        };

        let result = repositories::conversation::create_conversation(&pool, request).await;

        assert!(result.is_ok());
        let conversation = result.unwrap();
        assert_eq!(conversation.provider, "deepseek");
        assert_eq!(conversation.model, "deepseek-chat");
    }

    #[tokio::test]
    async fn test_create_conversation_nonexistent_workspace() {
        let (pool, _temp_dir) = crate::adapters::db::test_utils::setup_test_db().await;

        let request = CreateConversationRequest {
            workspace_id: "nonexistent-workspace".to_string(),
            title: "Test".to_string(),
            provider: "gemini".to_string(),
            model: "gemini-2.5-flash".to_string(),
        };

        let result = repositories::conversation::create_conversation(&pool, request).await;

        assert!(result.is_err());
    }

    #[tokio::test]
    async fn test_create_multiple_conversations() {
        let (pool, _temp_dir) = crate::adapters::db::test_utils::setup_test_db().await;
        let workspace_id = "workspace-create-multi";

        setup_test_workspace(&pool, workspace_id).await;

        let request1 = CreateConversationRequest {
            workspace_id: workspace_id.to_string(),
            title: "Conversation 1".to_string(),
            provider: "gemini".to_string(),
            model: "gemini-2.5-flash".to_string(),
        };

        let result1 = repositories::conversation::create_conversation(&pool, request1).await;
        assert!(result1.is_ok());

        let request2 = CreateConversationRequest {
            workspace_id: workspace_id.to_string(),
            title: "Conversation 2".to_string(),
            provider: "deepseek".to_string(),
            model: "deepseek-chat".to_string(),
        };

        let result2 = repositories::conversation::create_conversation(&pool, request2).await;
        assert!(result2.is_ok());

        assert_ne!(result1.unwrap().id, result2.unwrap().id);
    }
}