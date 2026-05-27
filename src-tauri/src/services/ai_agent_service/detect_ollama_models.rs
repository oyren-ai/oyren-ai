#[cfg(not(test))]
use crate::adapters::sidecars::ai_agent;
use crate::errors::AiServiceError;
use tauri::AppHandle;

#[cfg(test)]
use tests::ai_agent;

pub use ai_agent::{DetectModelsResponse, OllamaModel};

/// Detect available Ollama models on the host machine
pub async fn detect_ollama_models<R: tauri::Runtime>(
    app: &AppHandle<R>,
) -> Result<DetectModelsResponse, AiServiceError> {
    ai_agent::detect_models(app).await
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::cell::RefCell;

    thread_local! {
        static MOCK_ADAPTER_RESULT: RefCell<Option<Result<DetectModelsResponse, AiServiceError>>> = RefCell::new(None);
    }

    // Mock ai_agent::detect_models for testing
    #[cfg(test)]
    pub mod ai_agent {
        use super::*;

        pub use crate::adapters::sidecars::ai_agent::{DetectModelsResponse, OllamaModel};

        pub async fn detect_models<R: tauri::Runtime>(
            _app: &AppHandle<R>,
        ) -> Result<DetectModelsResponse, AiServiceError> {
            MOCK_ADAPTER_RESULT.with(|m| {
                m.borrow().as_ref().cloned().unwrap_or_else(|| {
                    Err(AiServiceError::InvalidInput {
                        message: "No mock adapter result configured".to_string(),
                    })
                })
            })
        }
    }

    fn set_mock_adapter_result(result: Result<DetectModelsResponse, AiServiceError>) {
        MOCK_ADAPTER_RESULT.with(|m| *m.borrow_mut() = Some(result));
    }

    fn reset_mock() {
        MOCK_ADAPTER_RESULT.with(|m| *m.borrow_mut() = None);
    }

    fn get_mock_app_handle() -> AppHandle<tauri::test::MockRuntime> {
        tauri::test::mock_app().handle().clone()
    }

    #[tokio::test]
    async fn test_detect_ollama_models_success() {
        reset_mock();
        let models = vec![OllamaModel {
            name: "llama2:latest".to_string(),
            size: 3826793677,
            modified_at: "2024-01-15T10:30:00Z".to_string(),
        }];
        set_mock_adapter_result(Ok(DetectModelsResponse { models }));

        let app = get_mock_app_handle();
        let result = detect_ollama_models(&app).await;

        assert!(result.is_ok());
        let response = result.unwrap();
        assert_eq!(response.models.len(), 1);
        assert_eq!(response.models[0].name, "llama2:latest");

        reset_mock();
    }

    #[tokio::test]
    async fn test_detect_ollama_models_error_propagation() {
        reset_mock();
        set_mock_adapter_result(Err(AiServiceError::InvalidInput {
            message: "Ollama not running".to_string(),
        }));

        let app = get_mock_app_handle();
        let result = detect_ollama_models(&app).await;

        assert!(result.is_err());
        if let Err(AiServiceError::InvalidInput { message }) = result {
            assert!(message.contains("Ollama not running"));
        } else {
            panic!("Expected InvalidInput error");
        }

        reset_mock();
    }
}
