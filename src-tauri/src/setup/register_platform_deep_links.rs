use crate::{services::auth_service, setup};

/// Registers platform-specific deep link handlers
///
/// # Arguments
/// * `app_handle` - The Tauri application handle
///
/// # Behavior
/// - Registers deep link for Windows registry
/// - Sets up deep link handlers for all platforms
/// - Logs warnings if registration fails (non-fatal)
///
/// # Examples
/// ```ignore
/// register_platform_deep_links(app.handle());
/// ```
pub fn register_platform_deep_links(app_handle: &tauri::AppHandle) {
    // Register deep link for Windows registry
    if let Err(e) = auth_service::register_deep_link_protocol() {
        tracing::warn!("Failed to register Windows deep link: {}", e);
    }

    // Setup deep link handlers for all platforms
    if let Err(e) = setup::setup_deep_link_handlers(app_handle) {
        tracing::error!("Failed to setup deep link handlers: {}", e);
    }
}

/// Helper function to handle registration errors (pure function)
///
/// # Arguments
/// * `windows_result` - Result from Windows registration
/// * `handlers_result` - Result from handlers setup
///
/// # Returns
/// * `(bool, bool)` - Tuple of (windows_success, handlers_success)
pub fn handle_registration_results(
    windows_result: Result<(), String>,
    handlers_result: Result<(), String>,
) -> (bool, bool) {
    let windows_success = windows_result.is_ok();
    let handlers_success = handlers_result.is_ok();

    if let Err(e) = windows_result {
        tracing::warn!("Failed to register Windows deep link: {}", e);
    }

    if let Err(e) = handlers_result {
        tracing::error!("Failed to setup deep link handlers: {}", e);
    }

    (windows_success, handlers_success)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_handle_registration_results_both_success() {
        let windows_result = Ok(());
        let handlers_result = Ok(());

        let (windows_success, handlers_success) =
            handle_registration_results(windows_result, handlers_result);

        assert!(windows_success);
        assert!(handlers_success);
    }

    #[test]
    fn test_handle_registration_results_windows_failure() {
        let windows_result = Err("Windows registration failed".to_string());
        let handlers_result = Ok(());

        let (windows_success, handlers_success) =
            handle_registration_results(windows_result, handlers_result);

        assert!(!windows_success);
        assert!(handlers_success);
    }

    #[test]
    fn test_handle_registration_results_handlers_failure() {
        let windows_result = Ok(());
        let handlers_result = Err("Handlers setup failed".to_string());

        let (windows_success, handlers_success) =
            handle_registration_results(windows_result, handlers_result);

        assert!(windows_success);
        assert!(!handlers_success);
    }

    #[test]
    fn test_handle_registration_results_both_failure() {
        let windows_result = Err("Windows registration failed".to_string());
        let handlers_result = Err("Handlers setup failed".to_string());

        let (windows_success, handlers_success) =
            handle_registration_results(windows_result, handlers_result);

        assert!(!windows_success);
        assert!(!handlers_success);
    }

    #[test]
    fn test_handle_registration_results_with_different_errors() {
        let windows_result = Err("Registry access denied".to_string());
        let handlers_result = Err("Invalid configuration".to_string());

        let (windows_success, handlers_success) =
            handle_registration_results(windows_result, handlers_result);

        assert!(!windows_success);
        assert!(!handlers_success);
    }
}
