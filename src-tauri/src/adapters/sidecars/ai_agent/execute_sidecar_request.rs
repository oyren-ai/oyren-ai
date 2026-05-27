use crate::errors::AiServiceError;
use serde::Deserialize;
use tauri::AppHandle;

use super::super::execute_ai_agent_sidecar;
use super::types::{AgentRequest, SidecarResponse};

/// Generic function to execute any sidecar request
///
/// SECURITY: This function handles sensitive data (API keys, user messages).
/// Never add logging (println!, dbg!, log::) for request or response content.
pub async fn execute_sidecar_request<T, R: tauri::Runtime>(
    #[cfg_attr(test, allow(unused_variables))] app: &AppHandle<R>,
    #[cfg_attr(test, allow(unused_variables))] request_id: String,
    request: AgentRequest,
    #[cfg_attr(test, allow(unused_variables))] active_request: &crate::state::active_request::ActiveRequest,
) -> Result<T, AiServiceError>
where
    T: for<'de> Deserialize<'de>,
{
    let request_json =
        serde_json::to_string(&request)
        .map_err(|e| AiServiceError::InvalidInput {
            message: format!("Failed to serialize request: {}", e),
        })?;
    
    // Log payload metadata (not content for security)
    if let AgentRequest::Chat { images, .. } = &request {
        tracing::info!("[execute_sidecar_request] 📤 Chat request {}: images={}, payload_size={} bytes",
            request_id, images.len(), request_json.len());
    }

    #[cfg(not(test))]
    let stdout = execute_ai_agent_sidecar(app, request_id, &request_json, active_request).await?;

    #[cfg(test)]
    let stdout = test_helpers::mock_execute_sidecar(&request_json).await?;

    if stdout.trim().is_empty() {
        return Err(AiServiceError::InvalidInput {
            message: "Agent returned empty response".to_string(),
        });
    }

    let response: SidecarResponse<T> =
        serde_json::from_str(&stdout).map_err(|e| {
            // Log the first 500 chars of stdout for debugging
            let preview = if stdout.len() > 500 {
                format!("{}... (truncated, total {} bytes)", &stdout[..500], stdout.len())
            } else {
                stdout.clone()
            };
            tracing::error!("[execute_sidecar_request] Failed to parse JSON. Preview: {}", preview);
            AiServiceError::InvalidInput {
                message: format!("Failed to parse agent response: {}", e),
            }
        })?;

    // Handle response: if there's an error for ChatResponse, embed it in the response
    // For other types, return Err
    match (response.data, response.error) {
        (Some(data), None) => Ok(data),
        (None, Some(error)) => {
            // Try to construct ChatResponse with error for chat requests
            // This is a bit of a hack but works for our use case
            let error_response_json = serde_json::json!({
                "response": error.message.as_deref().unwrap_or("An error occurred"),
                "usage_metadata": null,
                "sidecar_error": {
                    "errorType": error.error_type,
                    "shortMessage": error.short_message,
                    "message": error.message,
                    "suggestion": error.suggestion
                }
            });
            
            // Try to deserialize as T (which should be ChatResponse for chat requests)
            if let Ok(chat_response) = serde_json::from_value::<T>(error_response_json.clone()) {
                Ok(chat_response)
            } else {
                // If deserialization fails (not ChatResponse), return error
                let display_msg = error.message
                    .as_deref()
                    .or(error.short_message.as_deref())
                    .unwrap_or("Unknown error");

                Err(AiServiceError::InvalidInput {
                    message: display_msg.to_string(),
                })
            }
        },
        (Some(data), Some(_)) => {
            // Both data and error present - prioritize data
            Ok(data)
        },
        (None, None) => Err(AiServiceError::InvalidInput {
            message: "No data or error in response".to_string(),
        })
    }
}

#[cfg(test)]
mod test_helpers {
    use super::*;
    use std::cell::RefCell;

    thread_local! {
        static MOCK_OUTPUT: RefCell<Option<Result<String, String>>> = RefCell::new(None);
    }

    pub async fn mock_execute_sidecar(_request_json: &str) -> Result<String, AiServiceError> {
        MOCK_OUTPUT.with(|m| {
            m.borrow()
                .as_ref()
                .cloned()
                .map(|result| result.map_err(|e| AiServiceError::InvalidInput { message: e }))
                .unwrap_or_else(|| {
                    Err(AiServiceError::InvalidInput {
                        message: "No mock output configured".to_string(),
                    })
                })
        })
    }

    pub fn set_mock_output(output: Result<String, String>) {
        MOCK_OUTPUT.with(|m| *m.borrow_mut() = Some(output));
    }

    pub fn reset_mock() {
        MOCK_OUTPUT.with(|m| *m.borrow_mut() = None);
    }
}

#[cfg(test)]
mod tests {
    use super::test_helpers::{reset_mock, set_mock_output};
    use super::*;
    use crate::adapters::sidecars::ai_agent::types::{
        AiProvider, ChatResponse, ConversationMessage,
    };

    // We can't create a real AppHandle in tests, so we use a mock approach
    // The conditional compilation in execute_sidecar_request uses mock_execute_sidecar in tests
    #[allow(invalid_value)]
    #[allow(clippy::missing_safety_doc)]
    fn get_mock_app_handle() -> AppHandle {
        // This is a placeholder - in tests, the AppHandle is never actually used
        // because we use conditional compilation to bypass it
        // SAFETY: This is test-only code and the AppHandle is never dereferenced
        // because conditional compilation (#[cfg(test)]) ensures mock_execute_sidecar is used
        unsafe { std::mem::zeroed() }
    }

    #[tokio::test]
    #[ignore = "AppHandle mocking not currently supported - requires integration test"]
    async fn test_execute_sidecar_request_success() {
        reset_mock();
        set_mock_output(Ok(
            r#"{"data": {"response": "Hello!"}, "error": null}"#.to_string()
        ));

        let app = get_mock_app_handle();
        let request = AgentRequest::Chat {
            message: "test".to_string(),
            ai_provider: AiProvider {
                provider: "gemini".to_string(),
                api_key: "test-key".to_string(),
            },
            conversation_history: vec![],
            model: "gemini-2.5-flash".to_string(),
            temperature: None,
            max_tokens: None,
            answer_mode: None,
            images: vec![],
            files: vec![],
            attached_file_names: vec![],
        };

        let temp_state = crate::state::active_request::ActiveRequest::new();
        let result: Result<ChatResponse, AiServiceError> =
            execute_sidecar_request(&app, "test-id".to_string(), request, &temp_state).await;

        assert!(result.is_ok());
        let response = result.unwrap();
        assert_eq!(response.response, "Hello!");

        reset_mock();
    }

    #[tokio::test]
    #[ignore = "AppHandle mocking not currently supported - requires integration test"]
    async fn test_execute_sidecar_request_error_response() {
        reset_mock();
        set_mock_output(Ok(
            r#"{"data": null, "error": {"errorType": "unknown-error", "message": "Something went wrong"}}"#.to_string()
        ));

        let app = get_mock_app_handle();
        let request = AgentRequest::Chat {
            message: "test".to_string(),
            ai_provider: AiProvider {
                provider: "gemini".to_string(),
                api_key: "test-key".to_string(),
            },
            conversation_history: vec![],
            model: "gemini-2.5-flash".to_string(),
            temperature: None,
            max_tokens: None,
            answer_mode: None,
            images: vec![],
            files: vec![],
            attached_file_names: vec![],
        };

        let temp_state = crate::state::active_request::ActiveRequest::new();
        let result: Result<ChatResponse, AiServiceError> =
            execute_sidecar_request(&app, "test-id".to_string(), request, &temp_state).await;

        assert!(result.is_err());
        if let Err(AiServiceError::InvalidInput { message }) = result {
            assert!(message.contains("Something went wrong"));
        } else {
            panic!("Expected InvalidInput error");
        }

        reset_mock();
    }

    #[tokio::test]
    #[ignore = "AppHandle mocking not currently supported - requires integration test"]
    async fn test_execute_sidecar_request_structured_error_with_suggestion() {
        reset_mock();
        set_mock_output(Ok(
            r#"{"data": null, "error": {"errorType": "feature-not-supported", "shortMessage": "DeepSeek doesn't support images", "message": "The deepseek-chat model doesn't support image analysis.", "suggestion": "Try vision-capable models like Gemini 2.0 Flash."}}"#.to_string()
        ));

        let app = get_mock_app_handle();
        let request = AgentRequest::Chat {
            message: "test".to_string(),
            ai_provider: AiProvider {
                provider: "deepseek".to_string(),
                api_key: "test-key".to_string(),
            },
            conversation_history: vec![],
            model: "deepseek-chat".to_string(),
            temperature: None,
            max_tokens: None,
            answer_mode: None,
            images: vec![],
            files: vec![],
            attached_file_names: vec![],
        };

        let temp_state = crate::state::active_request::ActiveRequest::new();
        let result: Result<ChatResponse, AiServiceError> =
            execute_sidecar_request(&app, "test-id".to_string(), request, &temp_state).await;

        // Should return Ok with ChatResponse containing sidecar_error
        assert!(result.is_ok());
        let response = result.unwrap();
        assert!(response.sidecar_error.is_some());
        
        let error = response.sidecar_error.unwrap();
        assert_eq!(error.error_type, "feature-not-supported");
        assert_eq!(error.short_message, Some("DeepSeek doesn't support images".to_string()));
        assert_eq!(error.message, Some("The deepseek-chat model doesn't support image analysis.".to_string()));
        assert_eq!(error.suggestion, Some("Try vision-capable models like Gemini 2.0 Flash.".to_string()));
        assert_eq!(response.response, "The deepseek-chat model doesn't support image analysis.");

        reset_mock();
    }

    #[tokio::test]
    #[ignore = "AppHandle mocking not currently supported - requires integration test"]
    async fn test_execute_sidecar_request_structured_error_api_error() {
        reset_mock();
        set_mock_output(Ok(
            r#"{"data": null, "error": {"errorType": "api-error", "shortMessage": "Invalid API key", "message": "The provided API key is invalid.", "suggestion": "Check your API key in Settings."}}"#.to_string()
        ));

        let app = get_mock_app_handle();
        let request = AgentRequest::Chat {
            message: "test".to_string(),
            ai_provider: AiProvider {
                provider: "gemini".to_string(),
                api_key: "invalid-key".to_string(),
            },
            conversation_history: vec![],
            model: "gemini-2.5-flash".to_string(),
            temperature: None,
            max_tokens: None,
            answer_mode: None,
            images: vec![],
            files: vec![],
            attached_file_names: vec![],
        };

        let temp_state = crate::state::active_request::ActiveRequest::new();
        let result: Result<ChatResponse, AiServiceError> =
            execute_sidecar_request(&app, "test-id".to_string(), request, &temp_state).await;

        assert!(result.is_ok());
        let response = result.unwrap();
        assert!(response.sidecar_error.is_some());
        
        let error = response.sidecar_error.unwrap();
        assert_eq!(error.error_type, "api-error");
        assert_eq!(error.short_message, Some("Invalid API key".to_string()));

        reset_mock();
    }

    #[tokio::test]
    #[ignore = "AppHandle mocking not currently supported - requires integration test"]
    async fn test_execute_sidecar_request_empty_stdout() {
        reset_mock();
        set_mock_output(Ok("".to_string()));

        let app = get_mock_app_handle();
        let request = AgentRequest::Chat {
            message: "test".to_string(),
            ai_provider: AiProvider {
                provider: "gemini".to_string(),
                api_key: "test-key".to_string(),
            },
            conversation_history: vec![],
            model: "gemini-2.5-flash".to_string(),
            temperature: None,
            max_tokens: None,
            answer_mode: None,
            images: vec![],
            files: vec![],
            attached_file_names: vec![],
        };

        let temp_state = crate::state::active_request::ActiveRequest::new();
        let result: Result<ChatResponse, AiServiceError> =
            execute_sidecar_request(&app, "test-id".to_string(), request, &temp_state).await;

        assert!(result.is_err());
        if let Err(AiServiceError::InvalidInput { message }) = result {
            assert!(message.contains("empty response"));
        } else {
            panic!("Expected InvalidInput error for empty response");
        }

        reset_mock();
    }

    #[tokio::test]
    #[ignore = "AppHandle mocking not currently supported - requires integration test"]
    async fn test_execute_sidecar_request_invalid_json() {
        reset_mock();
        set_mock_output(Ok("not valid json".to_string()));

        let app = get_mock_app_handle();
        let request = AgentRequest::Chat {
            message: "test".to_string(),
            ai_provider: AiProvider {
                provider: "gemini".to_string(),
                api_key: "test-key".to_string(),
            },
            conversation_history: vec![],
            model: "gemini-2.5-flash".to_string(),
            temperature: None,
            max_tokens: None,
            answer_mode: None,
            images: vec![],
            files: vec![],
            attached_file_names: vec![],
        };

        let temp_state = crate::state::active_request::ActiveRequest::new();
        let result: Result<ChatResponse, AiServiceError> =
            execute_sidecar_request(&app, "test-id".to_string(), request, &temp_state).await;

        assert!(result.is_err());
        if let Err(AiServiceError::InvalidInput { message }) = result {
            assert!(message.contains("Failed to parse"));
        } else {
            panic!("Expected InvalidInput error for invalid JSON");
        }

        reset_mock();
    }

    #[tokio::test]
    #[ignore = "AppHandle mocking not currently supported - requires integration test"]
    async fn test_execute_sidecar_request_no_data_in_response() {
        reset_mock();
        set_mock_output(Ok(r#"{"data": null, "error": null}"#.to_string()));

        let app = get_mock_app_handle();
        let request = AgentRequest::Chat {
            message: "test".to_string(),
            ai_provider: AiProvider {
                provider: "gemini".to_string(),
                api_key: "test-key".to_string(),
            },
            conversation_history: vec![],
            model: "gemini-2.5-flash".to_string(),
            temperature: None,
            max_tokens: None,
            answer_mode: None,
            images: vec![],
            files: vec![],
            attached_file_names: vec![],
        };

        let temp_state = crate::state::active_request::ActiveRequest::new();
        let result: Result<ChatResponse, AiServiceError> =
            execute_sidecar_request(&app, "test-id".to_string(), request, &temp_state).await;

        assert!(result.is_err());
        if let Err(AiServiceError::InvalidInput { message }) = result {
            assert!(message.contains("No data in response"));
        } else {
            panic!("Expected InvalidInput error for no data");
        }

        reset_mock();
    }
}
