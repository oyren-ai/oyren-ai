use crate::errors::AiServiceError;
use tauri::AppHandle;

#[cfg(not(test))]
use super::execute_sidecar_request::execute_sidecar_request;
use super::types::{AgentRequest, AiProvider, ChatResponse, ConversationMessage};
use crate::services::ai_agent_service::{FileAttachment, ImageData};

#[cfg(test)]
use tests::execute_sidecar_request;

/// Execute AI chat operation
///
/// SECURITY: This function handles sensitive data (API keys, user messages).
/// Never add logging (println!, dbg!, log::) for parameters or responses.
pub async fn chat<R: tauri::Runtime>(
    app: &AppHandle<R>,
    request_id: String,
    message: String,
    provider: String,
    api_key: String,
    model: String,
    conversation_history: Vec<ConversationMessage>,
    temperature: Option<f32>,
    max_tokens: Option<u32>,
    answer_mode: Option<String>,
    images: Vec<ImageData>,
    files: Vec<FileAttachment>,
    attached_file_names: Vec<String>,
    active_request: &crate::state::active_request::ActiveRequest,
) -> Result<ChatResponse, AiServiceError> {
    let request = AgentRequest::Chat {
        message,
        ai_provider: AiProvider { provider, api_key },
        conversation_history,
        model,
        temperature,
        max_tokens,
        answer_mode,
        images,
        files,
        attached_file_names,
    };

    execute_sidecar_request(app, request_id, request, active_request).await
}

#[cfg(test)]
mod tests {
    use super::super::execute_sidecar_request::execute_sidecar_request as real_execute_sidecar_request;
    use super::*;
    use std::cell::RefCell;

    thread_local! {
        static MOCK_EXECUTE_RESULT: RefCell<Option<Result<ChatResponse, AiServiceError>>> = RefCell::new(None);
    }

    // Mock execute_sidecar_request for testing
    #[cfg(test)]
    // Mock execute_sidecar_request for testing
    #[cfg(test)]
    pub async fn execute_sidecar_request<T, R: tauri::Runtime>(
        _app: &AppHandle<R>,
        _request_id: String,
        request: AgentRequest,
        _active_request: &crate::state::active_request::ActiveRequest,
    ) -> Result<T, AiServiceError>
    where
        T: serde::de::DeserializeOwned,
    {
        // Verify request structure
        if let AgentRequest::Chat { message, .. } = &request {
            if message.is_empty() {
                return Err(AiServiceError::InvalidInput {
                    message: "Empty message".to_string(),
                });
            }
        }

        // Return mock result
        MOCK_EXECUTE_RESULT.with(|m| {
            m.borrow()
                .as_ref()
                .cloned()
                .map(|result| {
                    result.map(|response| {
                        // This is a bit of a hack - we need to convert ChatResponse to T
                        // In tests, T is always ChatResponse
                        serde_json::from_str(&serde_json::to_string(&response).unwrap()).unwrap()
                    })
                })
                .unwrap_or_else(|| {
                    Err(AiServiceError::InvalidInput {
                        message: "No mock result configured".to_string(),
                    })
                })
        })
    }

    fn set_mock_result(result: Result<ChatResponse, AiServiceError>) {
        MOCK_EXECUTE_RESULT.with(|m| *m.borrow_mut() = Some(result));
    }

    fn reset_mock() {
        MOCK_EXECUTE_RESULT.with(|m| *m.borrow_mut() = None);
    }

    fn get_mock_app_handle() -> AppHandle<tauri::test::MockRuntime> {
        tauri::test::mock_app().handle().clone()
    }

    #[tokio::test]
    async fn test_chat_success() {
        reset_mock();
        set_mock_result(Ok(ChatResponse {
            response: "Hello! How can I help you?".to_string(),
            usage_metadata: None,
            sidecar_error: None,
            arxiv_papers: None,
            user_intent: None,
        }));

        let app = get_mock_app_handle();
        // Create temporary state
        let temp_state = crate::state::active_request::ActiveRequest::new();
        
        let result = chat(
            &app,
            "test-request-id".to_string(),
            "Hello".to_string(),
            "gemini".to_string(),
            "test-key".to_string(),
            "gemini-2.5-flash".to_string(),
            vec![],
            None,
            None,
            None,
            vec![],
            vec![],
            vec![],
            &temp_state,
        )
        .await;

        assert!(result.is_ok());
        let response = result.unwrap();
        assert_eq!(response.response, "Hello! How can I help you?");

        reset_mock();
    }

    #[tokio::test]
    async fn test_chat_empty_message() {
        reset_mock();
        set_mock_result(Ok(ChatResponse {
            response: "should not reach here".to_string(),
            usage_metadata: None,
            sidecar_error: None,
            arxiv_papers: None,
            user_intent: None,
        }));

        let app = get_mock_app_handle();
        // Create temporary state
        let temp_state = crate::state::active_request::ActiveRequest::new();
        
        let result = chat(
            &app,
            "test-request-id".to_string(),
            "".to_string(),
            "gemini".to_string(),
            "test-key".to_string(),
            "gemini-2.5-flash".to_string(),
            vec![],
            None,
            None,
            None,
            vec![],
            vec![],
            vec![],
            &temp_state,
        )
        .await;

        assert!(result.is_err());
        if let Err(AiServiceError::InvalidInput { message }) = result {
            assert!(message.contains("Empty message"));
        } else {
            panic!("Expected InvalidInput error for empty message");
        }

        reset_mock();
    }

    #[tokio::test]
    async fn test_chat_error_response() {
        reset_mock();
        set_mock_result(Err(AiServiceError::InvalidInput {
            message: "AI agent error: Provider unavailable".to_string(),
        }));

        let app = get_mock_app_handle();
        // Create temporary state
        let temp_state = crate::state::active_request::ActiveRequest::new();
        
        let result = chat(
            &app,
            "test-request-id".to_string(),
            "Hello".to_string(),
            "unknown-provider".to_string(),
            "test-key".to_string(),
            "test-model".to_string(),
            vec![],
            None,
            None,
            None,
            vec![],
            vec![],
            vec![],
            &temp_state,
        )
        .await;

        assert!(result.is_err());
        if let Err(AiServiceError::InvalidInput { message }) = result {
            assert!(message.contains("Provider unavailable"));
        } else {
            panic!("Expected InvalidInput error");
        }

        reset_mock();
    }

    #[tokio::test]
    async fn test_chat_with_history() {
        reset_mock();
        set_mock_result(Ok(ChatResponse {
            response: "Based on our previous conversation...".to_string(),
            usage_metadata: None,
            sidecar_error: None,
            arxiv_papers: None,
            user_intent: None,
        }));

        let app = get_mock_app_handle();
        let history = vec![
            ConversationMessage {
                role: "user".to_string(),
                content: "What is Rust?".to_string(),
            },
            ConversationMessage {
                role: "assistant".to_string(),
                content: "Rust is a systems programming language.".to_string(),
            },
        ];

        // Create temporary state
        let temp_state = crate::state::active_request::ActiveRequest::new();
        
        let result = chat(
            &app,
            "test-request-id".to_string(),
            "Tell me more".to_string(),
            "gemini".to_string(),
            "test-key".to_string(),
            "gemini-2.5-flash".to_string(),
            history,
            None,
            None,
            None,
            vec![],
            vec![],
            vec![],
            &temp_state,
        )
        .await;

        assert!(result.is_ok());
        let response = result.unwrap();
        assert!(response.response.contains("previous conversation"));

        reset_mock();
    }

    #[tokio::test]
    async fn test_chat_with_temperature_and_max_tokens() {
        reset_mock();
        set_mock_result(Ok(ChatResponse {
            response: "Creative response with custom settings".to_string(),
            usage_metadata: None,
            sidecar_error: None,
            arxiv_papers: None,
            user_intent: None,
        }));

        let app = get_mock_app_handle();
        // Create temporary state
        let temp_state = crate::state::active_request::ActiveRequest::new();
        
        let result = chat(
            &app,
            "test-request-id".to_string(),
            "Write a poem".to_string(),
            "gemini".to_string(),
            "test-key".to_string(),
            "gemini-2.5-flash".to_string(),
            vec![],
            Some(0.9),
            Some(500),
            None,
            vec![],
            vec![],
            vec![],
            &temp_state,
        )
        .await;

        assert!(result.is_ok());
        let response = result.unwrap();
        assert!(response.response.contains("Creative response"));

        reset_mock();
    }
}
