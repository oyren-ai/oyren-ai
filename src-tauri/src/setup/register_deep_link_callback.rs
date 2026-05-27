use tauri::Manager;
use tauri_plugin_deep_link::DeepLinkExt;
use crate::services::auth_service;

/// Registers the on_open_url callback for handling deep links during runtime
///
/// # Arguments
/// * `app` - The Tauri application instance
///
/// # Behavior
/// - Sets up a callback that triggers when the app receives a deep link
/// - Processes each URL through the main window
/// - Logs all operations for debugging
/// - Handles cases where the main window might not be available
///
/// # Examples
/// ```ignore
/// register_deep_link_callback(&app);
/// ```
pub fn register_deep_link_callback(app: &tauri::App) {
    tracing::info!("🔗 Registering on_open_url callback...");
    let app_handle = app.handle().clone();

    app.deep_link().on_open_url(move |event| {
        tracing::info!("🔗🔗🔗 on_open_url CALLBACK TRIGGERED!");
        let urls = event.urls();
        tracing::info!("🔗 Deep link URLs from callback: {:?}", urls);

        if let Some(window) = app_handle.get_webview_window("main") {
            for url in urls {
                tracing::info!("🔗 Processing callback URL: {}", url);
                auth_service::handle_deep_link(&window, url.as_str());
            }
        } else {
            tracing::warn!("⚠️ Main window not found in callback!");
        }
    });

    tracing::info!("✅ on_open_url callback registered");
}

/// Helper function to handle deep link URLs with window availability check (pure function)
///
/// # Arguments
/// * `urls` - Vector of URL strings
/// * `window_available` - Whether the window is available
/// * `handler` - Function to call for each URL when window is available
///
/// # Returns
/// * `Result<usize, String>` - Number of URLs processed or error message
pub fn handle_deep_link_urls<F>(
    urls: Vec<String>,
    window_available: bool,
    mut handler: F,
) -> Result<usize, String>
where
    F: FnMut(&str),
{
    if !window_available {
        return Err("Main window not available".to_string());
    }

    let count = urls.len();
    for url in &urls {
        handler(url.as_str());
    }

    Ok(count)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_handle_deep_link_urls_window_not_available() {
        let urls = vec!["oyren://test".to_string()];
        let mut call_count = 0;

        let result = handle_deep_link_urls(urls, false, |_| {
            call_count += 1;
        });

        assert!(result.is_err());
        assert_eq!(result.unwrap_err(), "Main window not available");
        assert_eq!(call_count, 0);
    }

    #[test]
    fn test_handle_deep_link_urls_window_available_empty() {
        let urls: Vec<String> = vec![];
        let mut call_count = 0;

        let result = handle_deep_link_urls(urls, true, |_| {
            call_count += 1;
        });

        assert!(result.is_ok());
        assert_eq!(result.unwrap(), 0);
        assert_eq!(call_count, 0);
    }

    #[test]
    fn test_handle_deep_link_urls_window_available_single() {
        let urls = vec!["oyren://workspace/123".to_string()];
        let mut processed_urls = vec![];

        let result = handle_deep_link_urls(urls, true, |url| {
            processed_urls.push(url.to_string());
        });

        assert!(result.is_ok());
        assert_eq!(result.unwrap(), 1);
        assert_eq!(processed_urls.len(), 1);
        assert_eq!(processed_urls[0], "oyren://workspace/123");
    }

    #[test]
    fn test_handle_deep_link_urls_window_available_multiple() {
        let urls = vec![
            "oyren://workspace/123".to_string(),
            "oyren://pdf/456".to_string(),
            "oyren://chat/789".to_string(),
        ];
        let mut processed_urls = vec![];

        let result = handle_deep_link_urls(urls.clone(), true, |url| {
            processed_urls.push(url.to_string());
        });

        assert!(result.is_ok());
        assert_eq!(result.unwrap(), 3);
        assert_eq!(processed_urls.len(), 3);
        assert_eq!(processed_urls[0], "oyren://workspace/123");
        assert_eq!(processed_urls[1], "oyren://pdf/456");
        assert_eq!(processed_urls[2], "oyren://chat/789");
    }

    #[test]
    fn test_handle_deep_link_urls_preserves_order() {
        let urls = vec![
            "first".to_string(),
            "second".to_string(),
            "third".to_string(),
        ];
        let mut processed_urls = vec![];

        let result = handle_deep_link_urls(urls, true, |url| {
            processed_urls.push(url.to_string());
        });

        assert!(result.is_ok());
        assert_eq!(processed_urls, vec!["first", "second", "third"]);
    }
}
