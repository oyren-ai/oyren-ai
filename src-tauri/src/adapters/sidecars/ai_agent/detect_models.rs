use crate::errors::AiServiceError;
use tauri::{AppHandle, Manager};

#[cfg(not(test))]
use super::execute_sidecar_request::execute_sidecar_request;
use super::types::{AgentRequest, DetectModelsResponse};

#[cfg(test)]
use tests::execute_sidecar_request;

/// Detect available Ollama models
pub async fn detect_models<R: tauri::Runtime>(
    app: &AppHandle<R>,
) -> Result<DetectModelsResponse, AiServiceError> {
    let request = AgentRequest::DetectModels {
        provider: "ollama".to_string(),
    };

    // Create temporary state since detect_models doesn't support cancellation
    let temp_state = crate::state::active_request::ActiveRequest::new();
    execute_sidecar_request(app, "detect-models".to_string(), request, &temp_state).await
}

#[cfg(test)]
mod tests {
    use super::super::types::OllamaModel;
    use super::*;
    use std::cell::RefCell;

    thread_local! {
        static MOCK_EXECUTE_RESULT: RefCell<Option<Result<DetectModelsResponse, AiServiceError>>> = RefCell::new(None);
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

    fn set_mock_result(result: Result<DetectModelsResponse, AiServiceError>) {
        MOCK_EXECUTE_RESULT.with(|m| *m.borrow_mut() = Some(result));
    }

    fn reset_mock() {
        MOCK_EXECUTE_RESULT.with(|m| *m.borrow_mut() = None);
    }

    fn get_mock_app_handle() -> AppHandle<tauri::test::MockRuntime> {
        tauri::test::mock_app().handle().clone()
    }

    #[tokio::test]
    async fn test_detect_models_success() {
        reset_mock();
        let models = vec![
            OllamaModel {
                name: "llama2:latest".to_string(),
                size: 3826793677,
                modified_at: "2024-01-15T10:30:00Z".to_string(),
            },
            OllamaModel {
                name: "codellama:7b".to_string(),
                size: 3825819519,
                modified_at: "2024-01-14T08:20:00Z".to_string(),
            },
        ];
        set_mock_result(Ok(DetectModelsResponse {
            models: models.clone(),
        }));

        let app = get_mock_app_handle();
        let result = detect_models(&app).await;

        assert!(result.is_ok());
        let response = result.unwrap();
        assert_eq!(response.models.len(), 2);
        assert_eq!(response.models[0].name, "llama2:latest");
        assert_eq!(response.models[1].name, "codellama:7b");

        reset_mock();
    }

    #[tokio::test]
    async fn test_detect_models_empty_list() {
        reset_mock();
        set_mock_result(Ok(DetectModelsResponse { models: vec![] }));

        let app = get_mock_app_handle();
        let result = detect_models(&app).await;

        assert!(result.is_ok());
        let response = result.unwrap();
        assert_eq!(response.models.len(), 0);

        reset_mock();
    }

    #[tokio::test]
    async fn test_detect_models_error_response() {
        reset_mock();
        set_mock_result(Err(AiServiceError::InvalidInput {
            message: "Ollama is not running".to_string(),
        }));

        let app = get_mock_app_handle();
        let result = detect_models(&app).await;

        assert!(result.is_err());
        if let Err(AiServiceError::InvalidInput { message }) = result {
            assert!(message.contains("Ollama is not running"));
        } else {
            panic!("Expected InvalidInput error");
        }

        reset_mock();
    }
}
