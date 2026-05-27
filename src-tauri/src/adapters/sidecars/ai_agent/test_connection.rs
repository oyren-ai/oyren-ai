use crate::errors::AiServiceError;
use tauri::{AppHandle, Manager};

#[cfg(not(test))]
use super::execute_sidecar_request::execute_sidecar_request;
use super::types::{AgentRequest, AiProvider, TestConnectionResponse};

#[cfg(test)]
use tests::execute_sidecar_request;

/// Test connection to an AI provider
///
/// SECURITY: This function handles sensitive data (API keys).
/// Never add logging (println!, dbg!, log::) for parameters or responses.
pub async fn test_connection<R: tauri::Runtime>(
    app: &AppHandle<R>,
    provider: String,
    api_key: String,
    model: String,
) -> Result<TestConnectionResponse, AiServiceError> {
    let request = AgentRequest::TestConnection {
        ai_provider: AiProvider { provider, api_key },
        model,
    };

    // Create temporary state since test_connection doesn't support cancellation
    let temp_state = crate::state::active_request::ActiveRequest::new();
    execute_sidecar_request(app, "test-connection".to_string(), request, &temp_state).await
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::cell::RefCell;

    thread_local! {
        static MOCK_EXECUTE_RESULT: RefCell<Option<Result<TestConnectionResponse, AiServiceError>>> = RefCell::new(None);
    }

    // Mock execute_sidecar_request for testing
    #[cfg(test)]
    pub async fn execute_sidecar_request<T, R: tauri::Runtime>(
        _app: &AppHandle<R>,
        _request_id: String,
        _request: AgentRequest,
        _active_request: &crate::state::active_request::ActiveRequest,
    ) -> Result<T, AiServiceError>
    where
        T: serde::de::DeserializeOwned,
    {
        MOCK_EXECUTE_RESULT.with(|m| {
            m.borrow()
                .as_ref()
                .cloned()
                .map(|result| {
                    result.map(|response| {
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

    fn set_mock_result(result: Result<TestConnectionResponse, AiServiceError>) {
        MOCK_EXECUTE_RESULT.with(|m| *m.borrow_mut() = Some(result));
    }

    fn reset_mock() {
        MOCK_EXECUTE_RESULT.with(|m| *m.borrow_mut() = None);
    }

    fn get_mock_app_handle() -> AppHandle<tauri::test::MockRuntime> {
        tauri::test::mock_app().handle().clone()
    }

    #[tokio::test]
    async fn test_connection_success() {
        reset_mock();
        set_mock_result(Ok(TestConnectionResponse {
            success: true,
            provider: "gemini".to_string(),
            model: "gemini-2.5-flash".to_string(),
            message: "Connection successful".to_string(),
        }));

        let app = get_mock_app_handle();
        let result = test_connection(
            &app,
            "gemini".to_string(),
            "test-api-key".to_string(),
            "gemini-2.5-flash".to_string(),
        )
        .await;

        assert!(result.is_ok());
        let response = result.unwrap();
        assert!(response.success);
        assert_eq!(response.provider, "gemini");
        assert_eq!(response.model, "gemini-2.5-flash");
        assert!(response.message.contains("successful"));

        reset_mock();
    }

    #[tokio::test]
    async fn test_connection_failure() {
        reset_mock();
        set_mock_result(Ok(TestConnectionResponse {
            success: false,
            provider: "gemini".to_string(),
            model: "gemini-2.5-flash".to_string(),
            message: "Invalid API key".to_string(),
        }));

        let app = get_mock_app_handle();
        let result = test_connection(
            &app,
            "gemini".to_string(),
            "invalid-key".to_string(),
            "gemini-2.5-flash".to_string(),
        )
        .await;

        assert!(result.is_ok());
        let response = result.unwrap();
        assert!(!response.success);
        assert!(response.message.contains("Invalid API key"));

        reset_mock();
    }

    #[tokio::test]
    async fn test_connection_error_response() {
        reset_mock();
        set_mock_result(Err(AiServiceError::InvalidInput {
            message: "Unsupported provider: unknown-provider".to_string(),
        }));

        let app = get_mock_app_handle();
        let result = test_connection(
            &app,
            "unknown-provider".to_string(),
            "test-key".to_string(),
            "test-model".to_string(),
        )
        .await;

        assert!(result.is_err());
        if let Err(AiServiceError::InvalidInput { message }) = result {
            assert!(message.contains("Unsupported provider"));
        } else {
            panic!("Expected InvalidInput error");
        }

        reset_mock();
    }
}
