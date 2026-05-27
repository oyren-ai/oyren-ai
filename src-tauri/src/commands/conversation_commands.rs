use crate::adapters::db::models::workspace_chats::{
    Conversation, ConversationMessage, ConversationWithMessages, ImageData,
};
use crate::services::conversation;

#[tauri::command]
pub async fn create_conversation(
    workspace_id: String,
    title: String,
    provider: String,
    model: String,
) -> Result<Conversation, String> {
    conversation::create_conversation(workspace_id, title, provider, model).await
}

#[tauri::command]
pub async fn get_conversation(
    conversation_id: String,
) -> Result<ConversationWithMessages, String> {
    conversation::get_conversation_with_messages(conversation_id).await
}

#[tauri::command]
pub async fn list_workspace_conversations(
    workspace_id: String,
) -> Result<Vec<Conversation>, String> {
    conversation::list_conversations_by_workspace_id(workspace_id).await
}

#[tauri::command]
pub async fn update_conversation_title(
    conversation_id: String,
    new_title: String,
) -> Result<(), String> {
    conversation::update_conversation_title(conversation_id, new_title).await
}

#[tauri::command]
pub async fn pin_conversation(conversation_id: String, pin: bool) -> Result<(), String> {
    conversation::pin_conversation(conversation_id, pin).await
}

#[tauri::command]
pub async fn archive_conversation(conversation_id: String, archive: bool) -> Result<(), String> {
    conversation::archive_conversation(conversation_id, archive).await
}

#[tauri::command]
pub async fn delete_conversation(conversation_id: String) -> Result<(), String> {
    conversation::delete_conversation(conversation_id).await
}

#[tauri::command]
pub async fn add_message_to_conversation(
    conversation_id: String,
    role: String,
    content: String,
    images: Option<Vec<ImageData>>,
    files: Option<Vec<conversation::MessageFileData>>,
    provider: Option<String>,
    model: Option<String>,
    input_tokens: Option<i32>,
    output_tokens: Option<i32>,
) -> Result<ConversationMessage, String> {
    conversation::add_message_to_conversation(
        conversation_id,
        role,
        content,
        images,
        files,
        provider,
        model,
        input_tokens,
        output_tokens,
    ).await
}

#[tauri::command]
pub async fn save_chat_interaction(
    conversation_id: String,
    user_message: String,
    user_images: Option<Vec<ImageData>>,
    user_files: Option<Vec<conversation::MessageFileData>>,
    ai_response: String,
    provider: String,
    model: String,
    input_tokens: Option<i32>,
    output_tokens: Option<i32>,
) -> Result<(ConversationMessage, ConversationMessage), String> {
    conversation::save_chat_interaction(
        conversation_id,
        user_message,
        user_images,
        user_files,
        ai_response,
        provider,
        model,
        input_tokens,
        output_tokens,
    ).await
}
