use crate::errors::ai_service_error_to_string;
use crate::services::ai_agent_service::{
    self, ChatRequestData, ChatResponse, DetectModelsResponse, OllamaModel,
    TestConnectionResponse,
};
use serde::Deserialize;
use tauri::AppHandle;

#[derive(Deserialize)]
pub struct TestConnectionRequest {
    pub provider: String,
    pub api_key: String,
    pub model: String,
}

/// Chat with AI provider
#[tauri::command]
pub async fn ai_agent_chat_v2(
    app: AppHandle,
    request: ChatRequestData,
) -> Result<ChatResponse, String> {
    tracing::info!("🤖 [AI_AGENT_CHAT_V2] Command called - provider: {}, model: {}",
        request.provider, request.model);

    ai_agent_service::chat(&app, request, None)
        .await
        .map_err(|e| ai_service_error_to_string(&e))
}

/// Detect available Ollama models
#[tauri::command]
pub async fn ai_agent_detect_models(app: AppHandle) -> Result<Vec<OllamaModel>, String> {
    ai_agent_service::detect_ollama_models(&app)
        .await
        .map(|response| response.models)
        .map_err(|e| ai_service_error_to_string(&e))
}

/// Test connection to an AI provider
#[tauri::command]
pub async fn ai_agent_test_connection(
    app: AppHandle,
    request: TestConnectionRequest,
) -> Result<TestConnectionResponse, String> {
    ai_agent_service::test_provider_connection(&app, request.provider, request.api_key, request.model)
        .await
        .map_err(|e| ai_service_error_to_string(&e))
}
