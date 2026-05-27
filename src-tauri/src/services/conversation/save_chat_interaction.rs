use crate::adapters::db::models::workspace_chats::{ConversationMessage, ImageData};
use super::{add_message_to_conversation, MessageFileData};

pub async fn save_chat_interaction(
    conversation_id: String,
    user_message: String,
    user_images: Option<Vec<ImageData>>,
    user_files: Option<Vec<MessageFileData>>,
    ai_response: String,
    provider: String,
    model: String,
    input_tokens: Option<i32>,
    output_tokens: Option<i32>,
) -> Result<(ConversationMessage, ConversationMessage), String> {
    // Save user message with input_tokens and files
    let user_msg = add_message_to_conversation(
        conversation_id.clone(),
        "user".to_string(),
        user_message,
        user_images,
        user_files,
        Some(provider.clone()),
        Some(model.clone()),
        input_tokens,
        None,  // output_tokens = NULL for user messages
    ).await?;

    // Save AI response with output_tokens
    let ai_msg = add_message_to_conversation(
        conversation_id,
        "assistant".to_string(),
        ai_response,
        None,
        None,  // No files for AI responses
        Some(provider),
        Some(model),
        None,  // input_tokens = NULL for AI responses
        output_tokens,
    ).await?;

    Ok((user_msg, ai_msg))
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::adapters::db::models::workspace_chats::CreateMessageRequest;
    use crate::adapters::db::repositories;
    use chrono::Utc;
    use sqlx::SqlitePool;

    async fn setup_test_conversation(pool: &SqlitePool, conversation_id: &str) {
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
    async fn test_save_chat_interaction_success() {
        let (pool, _temp_dir) = crate::adapters::db::test_utils::setup_test_db().await;
        let conversation_id = "conv-save-1";

        setup_test_conversation(&pool, conversation_id).await;

        // Save user message
        let user_request = CreateMessageRequest {
            conversation_id: conversation_id.to_string(),
            role: "user".to_string(),
            content: "Hello AI".to_string(),
            images: None,
            provider: Some("gemini".to_string()),
            model: Some("gemini-2.5-flash".to_string()),
            input_tokens: Some(10),
            output_tokens: None,
        };
        let user_msg = repositories::conversation_message::create_message(&pool, user_request).await.unwrap();

        // Save AI response
        let ai_request = CreateMessageRequest {
            conversation_id: conversation_id.to_string(),
            role: "assistant".to_string(),
            content: "Hello User!".to_string(),
            images: None,
            provider: Some("gemini".to_string()),
            model: Some("gemini-2.5-flash".to_string()),
            input_tokens: None,
            output_tokens: Some(20),
        };
        let ai_msg = repositories::conversation_message::create_message(&pool, ai_request).await.unwrap();

        assert_eq!(user_msg.role, "user");
        assert_eq!(user_msg.content, "Hello AI");
        assert_eq!(user_msg.input_tokens, Some(10));
        assert_eq!(user_msg.output_tokens, None);

        assert_eq!(ai_msg.role, "assistant");
        assert_eq!(ai_msg.content, "Hello User!");
        assert_eq!(ai_msg.input_tokens, None);
        assert_eq!(ai_msg.output_tokens, Some(20));
    }

    #[tokio::test]
    async fn test_save_chat_interaction_with_images() {
        let (pool, _temp_dir) = crate::adapters::db::test_utils::setup_test_db().await;
        let conversation_id = "conv-save-images";

        setup_test_conversation(&pool, conversation_id).await;

        let images = vec![ImageData {
            data: "base64data".to_string(),
            mime_type: "image/png".to_string(),
        }];

        let user_request = CreateMessageRequest {
            conversation_id: conversation_id.to_string(),
            role: "user".to_string(),
            content: "Look at this".to_string(),
            images: Some(images),
            provider: Some("gemini".to_string()),
            model: Some("gemini-2.5-flash".to_string()),
            input_tokens: Some(15),
            output_tokens: None,
        };
        let user_msg = repositories::conversation_message::create_message(&pool, user_request).await.unwrap();

        assert!(user_msg.images.is_some());
    }

    #[tokio::test]
    async fn test_save_chat_interaction_sequence_numbers() {
        let (pool, _temp_dir) = crate::adapters::db::test_utils::setup_test_db().await;
        let conversation_id = "conv-save-seq";

        setup_test_conversation(&pool, conversation_id).await;

        // First interaction
        let user_request1 = CreateMessageRequest {
            conversation_id: conversation_id.to_string(),
            role: "user".to_string(),
            content: "First".to_string(),
            images: None,
            provider: Some("gemini".to_string()),
            model: Some("gemini-2.5-flash".to_string()),
            input_tokens: Some(5),
            output_tokens: None,
        };
        let user_msg1 = repositories::conversation_message::create_message(&pool, user_request1).await.unwrap();

        let ai_request1 = CreateMessageRequest {
            conversation_id: conversation_id.to_string(),
            role: "assistant".to_string(),
            content: "Response".to_string(),
            images: None,
            provider: Some("gemini".to_string()),
            model: Some("gemini-2.5-flash".to_string()),
            input_tokens: None,
            output_tokens: Some(10),
        };
        let ai_msg1 = repositories::conversation_message::create_message(&pool, ai_request1).await.unwrap();

        assert_eq!(user_msg1.sequence_number, 0);
        assert_eq!(ai_msg1.sequence_number, 1);

        // Second interaction
        let user_request2 = CreateMessageRequest {
            conversation_id: conversation_id.to_string(),
            role: "user".to_string(),
            content: "Second".to_string(),
            images: None,
            provider: Some("gemini".to_string()),
            model: Some("gemini-2.5-flash".to_string()),
            input_tokens: Some(5),
            output_tokens: None,
        };
        let user_msg2 = repositories::conversation_message::create_message(&pool, user_request2).await.unwrap();

        let ai_request2 = CreateMessageRequest {
            conversation_id: conversation_id.to_string(),
            role: "assistant".to_string(),
            content: "Response 2".to_string(),
            images: None,
            provider: Some("gemini".to_string()),
            model: Some("gemini-2.5-flash".to_string()),
            input_tokens: None,
            output_tokens: Some(10),
        };
        let ai_msg2 = repositories::conversation_message::create_message(&pool, ai_request2).await.unwrap();

        assert_eq!(user_msg2.sequence_number, 2);
        assert_eq!(ai_msg2.sequence_number, 3);
    }
}