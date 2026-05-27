use crate::adapters::db::{
    models::conversation_file::CreateConversationFileRequest,
    models::workspace_chats::{ConversationMessage, CreateMessageRequest, ImageData},
    repositories, sqlite,
};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MessageFileData {
    pub id: String,           // workspace_file_id
    pub name: String,         // filename
    pub path: String,         // file path (not used for DB)
}

pub async fn add_message_to_conversation(
    conversation_id: String,
    role: String,
    content: String,
    images: Option<Vec<ImageData>>,
    files: Option<Vec<MessageFileData>>,
    provider: Option<String>,
    model: Option<String>,
    input_tokens: Option<i32>,
    output_tokens: Option<i32>,
) -> Result<ConversationMessage, String> {
    let pool = sqlite::get_db_pool()?;

    // 1. Create the message
    let request = CreateMessageRequest {
        conversation_id: conversation_id.clone(),
        role,
        content,
        images,
        provider,
        model,
        input_tokens,
        output_tokens,
    };

    let message = repositories::conversation_message::create_message(pool, request).await?;

    // 2. Create file records if files are provided (deduplicated by workspace_file_id)
    if let Some(file_list) = files {
        let mut seen_ids = std::collections::HashSet::new();
        let unique_files: Vec<_> = file_list
            .into_iter()
            .filter(|f| seen_ids.insert(f.id.clone()))
            .collect();

        for file_data in unique_files {
            let file_request = CreateConversationFileRequest {
                workspace_file_id: Some(file_data.id),
                conversation_id: conversation_id.clone(),
                conversation_message_id: message.id.clone(),
                filename: file_data.name,
                is_attachment: true,
            };

            repositories::conversation_file::create_conversation_file(pool, file_request).await?;
        }
    }

    // 3. Fetch the message with attached files
    let messages = repositories::conversation_message::list_messages_by_conversation(
        pool,
        &message.conversation_id,
    )
    .await?;

    messages
        .into_iter()
        .find(|m| m.id == message.id)
        .ok_or_else(|| "Message not found after creation".to_string())
}

#[cfg(test)]
mod tests {
    use super::*;
    use chrono::Utc;
    use sqlx::SqlitePool;

    async fn setup_test_db_and_conversation(
        pool: &SqlitePool,
        conversation_id: &str,
    ) {
        let now = Utc::now();

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
        .ok();

        sqlx::query(
            "INSERT INTO ai_agent_conversations
             (id, workspace_id, title, provider, model, created_at, updated_at, last_accessed_at, is_pinned, is_archived, is_active)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        )
        .bind(conversation_id)
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
        .expect("Failed to create conversation");
    }

    #[tokio::test]
    async fn test_add_message_success() {
        let (pool, _temp_dir) = crate::adapters::db::test_utils::setup_test_db().await;
        let conversation_id = "conv-add-msg-1";

        setup_test_db_and_conversation(&pool, conversation_id).await;

        let request = CreateMessageRequest {
            conversation_id: conversation_id.to_string(),
            role: "user".to_string(),
            content: "Hello, world!".to_string(),
            images: None,
            provider: None,
            model: None,
            input_tokens: None,
            output_tokens: None,
        };

        let result = repositories::conversation_message::create_message(&pool, request).await;

        assert!(result.is_ok());
        let message = result.unwrap();
        assert_eq!(message.conversation_id, conversation_id);
        assert_eq!(message.role, "user");
        assert_eq!(message.content, "Hello, world!");
        assert_eq!(message.sequence_number, 0);
    }

    #[tokio::test]
    async fn test_add_message_with_images() {
        let (pool, _temp_dir) = crate::adapters::db::test_utils::setup_test_db().await;
        let conversation_id = "conv-add-msg-images";

        setup_test_db_and_conversation(&pool, conversation_id).await;

        let images = vec![ImageData {
            data: "base64data".to_string(),
            mime_type: "image/png".to_string(),
        }];

        let request = CreateMessageRequest {
            conversation_id: conversation_id.to_string(),
            role: "user".to_string(),
            content: "Check this image".to_string(),
            images: Some(images),
            provider: None,
            model: None,
            input_tokens: None,
            output_tokens: None,
        };

        let result = repositories::conversation_message::create_message(&pool, request).await;

        assert!(result.is_ok());
        let message = result.unwrap();
        assert!(message.images.is_some());
    }

    #[tokio::test]
    async fn test_add_message_with_provider_and_model() {
        let (pool, _temp_dir) = crate::adapters::db::test_utils::setup_test_db().await;
        let conversation_id = "conv-add-msg-provider";

        setup_test_db_and_conversation(&pool, conversation_id).await;

        let request = CreateMessageRequest {
            conversation_id: conversation_id.to_string(),
            role: "assistant".to_string(),
            content: "Response".to_string(),
            images: None,
            provider: Some("gemini".to_string()),
            model: Some("gemini-2.5-flash".to_string()),
            input_tokens: Some(10),
            output_tokens: Some(20),
        };

        let result = repositories::conversation_message::create_message(&pool, request).await;

        assert!(result.is_ok());
        let message = result.unwrap();
        assert_eq!(message.provider, Some("gemini".to_string()));
        assert_eq!(message.model, Some("gemini-2.5-flash".to_string()));
        assert_eq!(message.input_tokens, Some(10));
        assert_eq!(message.output_tokens, Some(20));
    }

    #[tokio::test]
    async fn test_add_message_nonexistent_conversation() {
        let (pool, _temp_dir) = crate::adapters::db::test_utils::setup_test_db().await;

        let request = CreateMessageRequest {
            conversation_id: "nonexistent-conv".to_string(),
            role: "user".to_string(),
            content: "Test".to_string(),
            images: None,
            provider: None,
            model: None,
            input_tokens: None,
            output_tokens: None,
        };

        let result = repositories::conversation_message::create_message(&pool, request).await;

        assert!(result.is_err());
    }
}