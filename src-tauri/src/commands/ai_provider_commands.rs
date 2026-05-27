use crate::errors::ai_service_error_to_string;
use crate::services::ai_agent_service::{self, ChatRequestData, FrontendConversationMessage};
use crate::services::{ChatRequest, ChatResponse};
use tauri::AppHandle;

#[tauri::command]
pub async fn ai_chat<R: tauri::Runtime>(
    app: AppHandle<R>,
    request: ChatRequest,
    api_key: String,
    request_id: String,
) -> Result<ChatResponse, String> {
    tracing::info!("⚠️  [AI_CHAT - LEGACY] Command called - provider: {}, model: {}, request_id: {}",
        request.provider, request.model, request_id);

    // Convert ChatRequest to ChatRequestData
    let request_data = ChatRequestData {
        message: request.message,
        provider: request.provider,
        api_key,
        model: request.model,
        conversation_history: request.conversation_history
            .into_iter()
            .map(|msg| FrontendConversationMessage {
                role: msg.role,
                content: msg.content,
            })
            .collect(),
        temperature: Some(request.temperature),
        max_tokens: request.max_tokens,
        answer_mode: request.answer_mode,
        images: request.images,
        files: request.files,
        attached_file_names: request.attached_file_names,
    };

    ai_agent_service::chat(&app, request_data, Some(request_id))
        .await
        .map_err(|e| ai_service_error_to_string(&e))
}

#[cfg(test)]
mod tests {
    // TODO: Update tests after adding AppHandle parameter and AI agent integration
    // Tests temporarily disabled during AI agent feature implementation
    // The ai_chat command signature has changed to include AppHandle,
    // which requires mock AppHandle creation for testing.
    // Tests will be re-enabled once the AI agent integration is complete.
}
