#[cfg(not(test))]
use crate::adapters::sidecars::ai_agent;
use crate::errors::AiServiceError;
use tauri::AppHandle;

#[cfg(test)]
use tests::ai_agent;

pub use ai_agent::TestConnectionResponse;

/// Test connection to an AI provider
///
/// SECURITY: This function handles sensitive data (API keys).
/// Never add logging (println!, dbg!, log::) for parameters or responses.
pub async fn test_provider_connection<R: tauri::Runtime>(
    app: &AppHandle<R>,
    provider: String,
    api_key: String,
    model: String,
) -> Result<TestConnectionResponse, AiServiceError> {
    ai_agent::test_connection(app, provider, api_key, model).await
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::cell::RefCell;

    thread_local! {
        static MOCK_ADAPTER_RESULT: RefCell<Option<Result<TestConnectionResponse, AiServiceError>>> = RefCell::new(None);
    }

    // Mock ai_agent::test_connection for testing
    #[cfg(test)]
    pub mod ai_agent {
        use super::*;

        pub use crate::adapters::sidecars::ai_agent::TestConnectionResponse;

        pub async fn test_connection<R: tauri::Runtime>(
            _app: &AppHandle<R>,
            _provider: String,
            _api_key: String,
            _model: String,
        ) -> Result<TestConnectionResponse, AiServiceError> {
            MOCK_ADAPTER_RESULT.with(|m| {
                m.borrow().as_ref().cloned().unwrap_or_else(|| {
                    Err(AiServiceError::InvalidInput {
                        message: "No mock adapter result configured".to_string(),
                    })
                })
            })
        }
    }

    fn set_mock_adapter_result(result: Result<TestConnectionResponse, AiServiceError>) {
        MOCK_ADAPTER_RESULT.with(|m| *m.borrow_mut() = Some(result));
    }

    fn reset_mock() {
        MOCK_ADAPTER_RESULT.with(|m| *m.borrow_mut() = None);
    }

    fn get_mock_app_handle() -> AppHandle<tauri::test::MockRuntime> {
        tauri::test::mock_app().handle().clone()
    }

    #[tokio::test]
    async fn test_connection_success() {
        reset_mock();
        set_mock_adapter_result(Ok(TestConnectionResponse {
            success: true,
            provider: "gemini".to_string(),
            model: "gemini-2.5-flash".to_string(),
            message: "Connection successful".to_string(),
        }));

        let app = get_mock_app_handle();
        let result = test_provider_connection(
            &app,
            "gemini".to_string(),
            "test-key".to_string(),
            "gemini-2.5-flash".to_string(),
        )
        .await;

        assert!(result.is_ok());
        let response = result.unwrap();
        assert!(response.success);
        assert_eq!(response.provider, "gemini");

        reset_mock();
    }

    #[tokio::test]
    async fn test_connection_error_propagation() {
        reset_mock();
        set_mock_adapter_result(Err(AiServiceError::ProviderNotSupported {
            provider: "unsupported".to_string(),
        }));

        let app = get_mock_app_handle();
        let result = test_provider_connection(
            &app,
            "unsupported".to_string(),
            "test-key".to_string(),
            "test-model".to_string(),
        )
        .await;

        assert!(result.is_err());
        if let Err(AiServiceError::ProviderNotSupported { provider }) = result {
            assert_eq!(provider, "unsupported");
        } else {
            panic!("Expected ProviderNotSupported error");
        }

        reset_mock();
    }
}
