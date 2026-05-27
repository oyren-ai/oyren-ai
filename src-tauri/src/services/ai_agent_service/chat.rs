//! AI Agent Chat Service - Provides chat functionality for AI providers

use crate::errors::AiServiceError;
use super::types::{ChatMessage, ChatRequest, ChatRequestData, ChatResponse, FileAttachment, ImageData};
use tauri::{AppHandle, Manager};

// ============================================================================
// Conditional Imports
// ============================================================================

#[cfg(not(test))]
use crate::adapters::sidecars::ai_agent::{
    self,
    ChatResponse as AdapterChatResponse,
};

#[cfg(not(test))]
pub use crate::adapters::sidecars::ai_agent::ConversationMessage;

#[cfg(test)]
use tests::ai_agent::AdapterChatResponse;

#[cfg(test)]
pub use tests::ai_agent::ConversationMessage;

// ============================================================================
// Public API
// ============================================================================

/// Chat with AI provider (accepts frontend ChatRequestData)
///
/// SECURITY: This function handles sensitive data (API keys, user messages).
/// Never add logging (println!, dbg!, log::) for parameters or responses.
pub async fn chat<R: tauri::Runtime>(
    app: &AppHandle<R>,
    request: ChatRequestData,
    frontend_request_id: Option<String>,
) -> Result<ChatResponse, AiServiceError> {
    let request_id = frontend_request_id.unwrap_or_else(|| uuid::Uuid::new_v4().to_string());
    let active_request = app.state::<crate::state::active_request::ActiveRequest>();
    let chat_request: ChatRequest = request.clone().into();

    // Validate multimodal capability before calling sidecar
    let has_attachments = !chat_request.images.is_empty() || !chat_request.files.is_empty();
    if has_attachments {
        validate_multimodal_capability(&chat_request.model).await?;
    }

    let conversation_history = to_conversation_messages(chat_request.conversation_history);

    let adapter_response = call_adapter(
        app,
        request_id,
        chat_request.message,
        chat_request.provider,
        request.api_key,
        chat_request.model,
        conversation_history,
        chat_request.temperature,
        chat_request.max_tokens,
        chat_request.answer_mode,
        chat_request.images,
        chat_request.files,
        chat_request.attached_file_names,
        &active_request,
    )
    .await?;

    // Convert adapter SidecarError to service SidecarError
    let sidecar_error = adapter_response.sidecar_error.map(|err| super::types::SidecarError {
        error_type: err.error_type,
        short_message: err.short_message,
        message: err.message,
        suggestion: err.suggestion,
    });

    Ok(ChatResponse {
        response: adapter_response.response,
        usage_metadata: adapter_response.usage_metadata.map(|meta| super::types::UsageMetadata {
            input_tokens: meta.input_tokens,
            output_tokens: meta.output_tokens,
            total_tokens: meta.total_tokens,
        }),
        sidecar_error,
        arxiv_papers: adapter_response.arxiv_papers,
        user_intent: adapter_response.user_intent,
    })
}

/// Backward compatibility alias
pub use chat as process_chat;

// ============================================================================
// Internal Helpers
// ============================================================================

fn to_conversation_messages(messages: Vec<ChatMessage>) -> Vec<ConversationMessage> {
    messages
        .into_iter()
        .map(|msg| ConversationMessage {
            role: msg.role,
            content: msg.content,
        })
        .collect()
}

/// Check if the model supports multimodal (images/files).
/// If the model is not in the DB (e.g. Ollama custom models), allow the request through.
#[cfg(not(test))]
async fn validate_multimodal_capability(model: &str) -> Result<(), AiServiceError> {
    let pool = crate::adapters::db::sqlite::get_db_pool()
        .map_err(|e| AiServiceError::InvalidInput { message: e })?;
    let model_info = crate::adapters::db::repositories::ai_provider_model::get_ai_provider_model_by_id(pool, model)
        .await
        .map_err(|e| AiServiceError::InvalidInput { message: e })?;

    if let Some(info) = model_info {
        if !info.is_multimodal {
            return Err(AiServiceError::FeatureNotSupported {
                message: format!(
                    "The model \"{}\" does not support images or file attachments. Use a multimodal model.",
                    info.model_name
                ),
            });
        }
    }
    Ok(())
}

#[cfg(test)]
async fn validate_multimodal_capability(_model: &str) -> Result<(), AiServiceError> {
    Ok(())
}

#[cfg(not(test))]
async fn call_adapter<R: tauri::Runtime>(
    app: &AppHandle<R>,
    request_id: String,
    message: String,
    provider: String,
    api_key: String,
    model: String,
    conversation_history: Vec<ConversationMessage>,
    temperature: f32,
    max_tokens: Option<u32>,
    answer_mode: Option<String>,
    images: Vec<ImageData>,
    files: Vec<FileAttachment>,
    attached_file_names: Vec<String>,
    active_request: &crate::state::active_request::ActiveRequest,
) -> Result<AdapterChatResponse, AiServiceError> {
    ai_agent::chat(
        app,
        request_id,
        message,
        provider,
        api_key,
        model,
        conversation_history,
        Some(temperature),
        max_tokens,
        answer_mode,
        images,
        files,
        attached_file_names,
        active_request,
    )
    .await
}

#[cfg(test)]
async fn call_adapter<R: tauri::Runtime>(
    app: &AppHandle<R>,
    _request_id: String,
    message: String,
    provider: String,
    api_key: String,
    model: String,
    conversation_history: Vec<ConversationMessage>,
    temperature: f32,
    max_tokens: Option<u32>,
    answer_mode: Option<String>,
    images: Vec<ImageData>,
    _files: Vec<FileAttachment>,
    _attached_file_names: Vec<String>,
    _active_request: &crate::state::active_request::ActiveRequest,
) -> Result<AdapterChatResponse, AiServiceError> {
    tests::ai_agent::chat(
        app,
        message,
        provider,
        api_key,
        model,
        conversation_history,
        Some(temperature),
        max_tokens,
        answer_mode,
        images,
    )
    .await
}

// ============================================================================
// Tests
// ============================================================================

#[cfg(test)]
mod tests {
    use super::*;
    use crate::services::ai_agent_service::{ChatMessage, ImageData};
    use std::cell::RefCell;

    // ========================================================================
    // Mock Infrastructure
    // ========================================================================

    thread_local! {
        static MOCK_ADAPTER_RESULT: RefCell<Option<Result<AdapterChatResponse, AiServiceError>>> =
            RefCell::new(None);
    }

    pub mod ai_agent {
        use super::*;
        pub use crate::adapters::sidecars::ai_agent::{
            ChatResponse as AdapterChatResponse,
            ConversationMessage,
        };

        pub async fn chat<R: tauri::Runtime>(
            _app: &AppHandle<R>,
            _message: String,
            _provider: String,
            _api_key: String,
            _model: String,
            _conversation_history: Vec<ConversationMessage>,
            _temperature: Option<f32>,
            _max_tokens: Option<u32>,
            _answer_mode: Option<String>,
            _images: Vec<ImageData>,
        ) -> Result<AdapterChatResponse, AiServiceError> {
            MOCK_ADAPTER_RESULT.with(|m| {
                m.borrow().as_ref().cloned().unwrap_or_else(|| {
                    Err(AiServiceError::InvalidInput {
                        message: "No mock adapter result configured".to_string(),
                    })
                })
            })
        }
    }

    // ========================================================================
    // Test Utilities
    // ========================================================================

    fn set_mock_adapter_result(result: Result<AdapterChatResponse, AiServiceError>) {
        MOCK_ADAPTER_RESULT.with(|m| *m.borrow_mut() = Some(result));
    }

    fn reset_mock() {
        MOCK_ADAPTER_RESULT.with(|m| *m.borrow_mut() = None);
    }

    fn get_mock_app_handle() -> AppHandle<tauri::test::MockRuntime> {
        let app = tauri::test::mock_app();
        app.manage(crate::state::active_request::ActiveRequest::new());
        app.handle().clone()
    }

    fn create_test_request_data(provider: &str, api_key: &str) -> ChatRequestData {
        ChatRequestData {
            message: "Test message".to_string(),
            provider: provider.to_string(),
            api_key: api_key.to_string(),
            model: match provider {
                "gemini" => "gemini-pro".to_string(),
                "deepseek" => "deepseek-v3".to_string(),
                _ => "test-model".to_string(),
            },
            conversation_history: vec![],
            temperature: Some(0.7),
            max_tokens: Some(1000),
            answer_mode: None,
            images: vec![],
            files: vec![],
            attached_file_names: vec![],
        }
    }

    // ========================================================================
    // Core Functionality Tests
    // ========================================================================

    #[tokio::test]
    async fn test_chat_success() {
        reset_mock();
        set_mock_adapter_result(Ok(AdapterChatResponse {
            response: "Test response from adapter".to_string(),
            usage_metadata: None,
            sidecar_error: None,
            arxiv_papers: None,
            user_intent: None,
        }));

        let result = chat(&get_mock_app_handle(), create_test_request_data("gemini", "test-key"), None).await;

        assert!(result.is_ok());
        assert_eq!(result.unwrap().response, "Test response from adapter");
        reset_mock();
    }

    #[tokio::test]
    async fn test_chat_error_propagation() {
        reset_mock();
        set_mock_adapter_result(Err(AiServiceError::ProviderNotSupported {
            provider: "unknown".to_string(),
        }));

        let request = create_test_request_data("unknown", "test-key");
        let result = chat(&get_mock_app_handle(), request, None).await;

        assert!(matches!(
            result,
            Err(AiServiceError::ProviderNotSupported { provider }) if provider == "unknown"
        ));
        reset_mock();
    }

    #[tokio::test]
    async fn test_chat_with_sidecar_error() {
        reset_mock();
        use crate::adapters::sidecars::ai_agent::types::SidecarError as AdapterSidecarError;
        
        set_mock_adapter_result(Ok(AdapterChatResponse {
            response: "The deepseek-chat model doesn't support image analysis.".to_string(),
            usage_metadata: None,
            sidecar_error: Some(AdapterSidecarError {
                error_type: "feature-not-supported".to_string(),
                short_message: Some("DeepSeek doesn't support images".to_string()),
                message: Some("The deepseek-chat model doesn't support image analysis.".to_string()),
                suggestion: Some("Try vision-capable models like Gemini 2.0 Flash.".to_string()),
            }),
            arxiv_papers: None,
            user_intent: None,
        }));

        let request = create_test_request_data("deepseek", "test-key");
        let result = chat(&get_mock_app_handle(), request, None).await;

        assert!(result.is_ok());
        let response = result.unwrap();
        assert!(response.sidecar_error.is_some());
        
        let error = response.sidecar_error.unwrap();
        assert_eq!(error.error_type, "feature-not-supported");
        assert_eq!(error.short_message, Some("DeepSeek doesn't support images".to_string()));
        assert_eq!(error.suggestion, Some("Try vision-capable models like Gemini 2.0 Flash.".to_string()));
        assert_eq!(response.response, "The deepseek-chat model doesn't support image analysis.");
        
        reset_mock();
    }

    #[tokio::test]
    async fn test_chat_with_sidecar_error_no_suggestion() {
        reset_mock();
        use crate::adapters::sidecars::ai_agent::types::SidecarError as AdapterSidecarError;
        
        set_mock_adapter_result(Ok(AdapterChatResponse {
            response: "An error occurred.".to_string(),
            usage_metadata: None,
            sidecar_error: Some(AdapterSidecarError {
                error_type: "unknown-error".to_string(),
                short_message: Some("Error occurred".to_string()),
                message: Some("An error occurred.".to_string()),
                suggestion: None,
            }),
            arxiv_papers: None,
            user_intent: None,
        }));

        let request = create_test_request_data("gemini", "test-key");
        let result = chat(&get_mock_app_handle(), request, None).await;

        assert!(result.is_ok());
        let response = result.unwrap();
        assert!(response.sidecar_error.is_some());
        
        let error = response.sidecar_error.unwrap();
        assert_eq!(error.error_type, "unknown-error");
        assert_eq!(error.suggestion, None);
        
        reset_mock();
    }

    #[tokio::test]
    async fn test_process_chat_alias() {
        reset_mock();
        set_mock_adapter_result(Ok(AdapterChatResponse {
            response: "Processed response".to_string(),
            usage_metadata: None,
            sidecar_error: None,
            arxiv_papers: None,
            user_intent: None,
        }));

        let result = process_chat(&get_mock_app_handle(), create_test_request_data("gemini", "test-key"), None).await;

        assert!(result.is_ok());
        assert_eq!(result.unwrap().response, "Processed response");
        reset_mock();
    }

    // ========================================================================
    // Serialization Tests
    // ========================================================================

    #[test]
    fn test_chat_request_serialization() {
        let request = ChatRequest {
            message: "Test message".to_string(),
            images: vec![],
            files: vec![],
            conversation_history: vec![],
            model: "gemini-pro".to_string(),
            temperature: 0.7,
            max_tokens: Some(1000),
            provider: "gemini".to_string(),
            answer_mode: None,
            attached_file_names: vec![],
        };
        let json = serde_json::to_string(&request).unwrap();
        let deserialized: ChatRequest = serde_json::from_str(&json).unwrap();

        assert_eq!(deserialized.message, request.message);
        assert_eq!(deserialized.provider, request.provider);
    }

    #[test]
    fn test_chat_response_serialization() {
        let response = ChatResponse {
            response: "Test response".to_string(),
            usage_metadata: None,
            sidecar_error: None,
            arxiv_papers: None,
            user_intent: None,
        };
        let json = serde_json::to_string(&response).unwrap();
        let deserialized: ChatResponse = serde_json::from_str(&json).unwrap();

        assert_eq!(deserialized.response, response.response);
    }

    #[test]
    fn test_image_data_serialization() {
        let image = ImageData {
            mime_type: "image/webp".to_string(),
            data: "webpdata".to_string(),
            name: Some("test.webp".to_string()),
        };
        let json = serde_json::to_string(&image).unwrap();
        let deserialized: ImageData = serde_json::from_str(&json).unwrap();

        assert_eq!(deserialized.mime_type, image.mime_type);
        assert_eq!(deserialized.data, image.data);
    }

    #[test]
    fn test_chat_message_serialization() {
        let message = ChatMessage {
            role: "system".to_string(),
            content: "You are a helpful assistant".to_string(),
        };
        let json = serde_json::to_string(&message).unwrap();
        let deserialized: ChatMessage = serde_json::from_str(&json).unwrap();

        assert_eq!(deserialized.role, message.role);
        assert_eq!(deserialized.content, message.content);
    }

    // ========================================================================
    // Type Behavior Tests
    // ========================================================================

    #[test]
    fn test_chat_message_clone() {
        let message = ChatMessage {
            role: "assistant".to_string(),
            content: "Hi there".to_string(),
        };
        let cloned = message.clone();

        assert_eq!(cloned.role, message.role);
        assert_eq!(cloned.content, message.content);
    }

    #[test]
    fn test_image_data_creation() {
        let image = ImageData {
            mime_type: "image/png".to_string(),
            data: "base64data".to_string(),
            name: None,
        };

        assert_eq!(image.mime_type, "image/png");
        assert_eq!(image.data, "base64data");
    }

    #[test]
    fn test_chat_message_creation() {
        let message = ChatMessage {
            role: "user".to_string(),
            content: "Hello".to_string(),
        };

        assert_eq!(message.role, "user");
        assert_eq!(message.content, "Hello");
    }

    // ========================================================================
    // Request Construction Tests
    // ========================================================================

    #[test]
    fn test_chat_request_with_conversation_history() {
        let request = ChatRequest {
            message: "Test message".to_string(),
            images: vec![],
            files: vec![],
            conversation_history: vec![
                ChatMessage {
                    role: "user".to_string(),
                    content: "Previous question".to_string(),
                },
                ChatMessage {
                    role: "assistant".to_string(),
                    content: "Previous answer".to_string(),
                },
            ],
            model: "gemini-pro".to_string(),
            temperature: 0.7,
            max_tokens: Some(1000),
            provider: "gemini".to_string(),
            answer_mode: None,
            attached_file_names: vec![],
        };

        assert_eq!(request.conversation_history.len(), 2);
        assert_eq!(request.conversation_history[0].role, "user");
        assert_eq!(request.conversation_history[1].role, "assistant");
    }

    #[test]
    fn test_chat_request_with_images() {
        let request = ChatRequest {
            message: "Describe this".to_string(),
            images: vec![ImageData {
                mime_type: "image/jpeg".to_string(),
                data: "data1".to_string(),
                name: None,
            }],
            files: vec![],
            conversation_history: vec![],
            model: "gemini-pro-vision".to_string(),
            temperature: 0.5,
            max_tokens: Some(500),
            provider: "gemini".to_string(),
            answer_mode: None,
            attached_file_names: vec![],
        };

        assert_eq!(request.images.len(), 1);
        assert_eq!(request.images[0].mime_type, "image/jpeg");
    }

    #[test]
    fn test_chat_request_with_history() {
        let request = ChatRequest {
            message: "Continue".to_string(),
            images: vec![],
            files: vec![],
            conversation_history: vec![
                ChatMessage {
                    role: "user".to_string(),
                    content: "Start".to_string(),
                },
                ChatMessage {
                    role: "assistant".to_string(),
                    content: "Started".to_string(),
                },
            ],
            model: "deepseek-chat".to_string(),
            temperature: 0.9,
            max_tokens: Some(2000),
            provider: "deepseek".to_string(),
            answer_mode: None,
            attached_file_names: vec![],
        };

        assert_eq!(request.conversation_history.len(), 2);
        assert_eq!(request.provider, "deepseek");
    }

    // ========================================================================
    // Boundary Value Tests
    // ========================================================================

    #[test]
    fn test_invalid_temperature_boundaries() {
        // Negative temperature
        let mut request = ChatRequest {
            message: "Test".to_string(),
            images: vec![],
            files: vec![],
            conversation_history: vec![],
            model: "gemini-pro".to_string(),
            temperature: -0.1,
            max_tokens: Some(1000),
            provider: "gemini".to_string(),
            answer_mode: None,
            attached_file_names: vec![],
        };
        let json = serde_json::to_string(&request).unwrap();
        let deserialized: ChatRequest = serde_json::from_str(&json).unwrap();
        assert_eq!(deserialized.temperature, -0.1);

        // High temperature
        request.temperature = 2.0;
        let json = serde_json::to_string(&request).unwrap();
        let deserialized: ChatRequest = serde_json::from_str(&json).unwrap();
        assert_eq!(deserialized.temperature, 2.0);
    }

    #[test]
    fn test_zero_max_tokens() {
        let request = ChatRequest {
            message: "Test".to_string(),
            images: vec![],
            files: vec![],
            conversation_history: vec![],
            model: "gemini-pro".to_string(),
            temperature: 0.7,
            max_tokens: Some(0),
            provider: "gemini".to_string(),
            answer_mode: None,
            attached_file_names: vec![],
        };

        let json = serde_json::to_string(&request).unwrap();
        let deserialized: ChatRequest = serde_json::from_str(&json).unwrap();

        assert_eq!(deserialized.max_tokens, Some(0));
    }
}