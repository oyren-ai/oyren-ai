use tauri::Manager;
use tauri_plugin_deep_link::DeepLinkExt;
use crate::services::auth_service;

/// Processes initial deep link URLs if present when the app starts
///
/// # Arguments
/// * `app` - The Tauri application instance
///
/// # Returns
/// * `Result<(), Box<dyn std::error::Error>>` - Ok if successful, Err if failed
///
/// # Behavior
/// - Checks for initial deep link URLs using the deep link plugin
/// - If URLs are found, processes each one through the main window
/// - Logs all operations for debugging
///
/// # Examples
/// ```ignore
/// process_initial_deep_links(&app)?;
/// ```
pub fn process_initial_deep_links(
    app: &tauri::App,
) -> Result<(), Box<dyn std::error::Error>> {
    tracing::info!("🔗 Checking for initial deep link URLs...");
    let start_urls = app.deep_link().get_current()?;
    tracing::info!("🔗 get_current() result: {:?}", start_urls);

    if let Some(urls) = start_urls {
        tracing::info!("🚀 App started with deep link URLs: {:?}", urls);
        if let Some(window) = app.get_webview_window("main") {
            for url in &urls {
                tracing::info!("🔗 Processing initial URL: {}", url);
                auth_service::handle_deep_link(&window, url.as_str());
            }
        }
    } else {
        tracing::info!("ℹ️ No initial deep link URLs");
    }

    Ok(())
}

/// Helper function to process a list of URLs (pure function for testing)
///
/// # Arguments
/// * `urls` - Vector of URL strings to process
/// * `handler` - Function that handles each URL
///
/// # Returns
/// * Number of URLs processed
pub fn process_url_list<F>(urls: Vec<String>, mut handler: F) -> usize
where
    F: FnMut(&str),
{
    let count = urls.len();
    for url in &urls {
        handler(url.as_str());
    }
    count
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_process_url_list_empty() {
        let urls: Vec<String> = vec![];
        let mut call_count = 0;

        let count = process_url_list(urls, |_| {
            call_count += 1;
        });

        assert_eq!(count, 0);
        assert_eq!(call_count, 0);
    }

    #[test]
    fn test_process_url_list_single_url() {
        let urls = vec!["oyren://test".to_string()];
        let mut processed_urls = vec![];

        let count = process_url_list(urls, |url| {
            processed_urls.push(url.to_string());
        });

        assert_eq!(count, 1);
        assert_eq!(processed_urls.len(), 1);
        assert_eq!(processed_urls[0], "oyren://test");
    }

    #[test]
    fn test_process_url_list_multiple_urls() {
        let urls = vec![
            "oyren://workspace/123".to_string(),
            "oyren://pdf/456".to_string(),
            "oyren://chat/789".to_string(),
        ];
        let mut processed_urls = vec![];

        let count = process_url_list(urls.clone(), |url| {
            processed_urls.push(url.to_string());
        });

        assert_eq!(count, 3);
        assert_eq!(processed_urls.len(), 3);
        assert_eq!(processed_urls[0], "oyren://workspace/123");
        assert_eq!(processed_urls[1], "oyren://pdf/456");
        assert_eq!(processed_urls[2], "oyren://chat/789");
    }

    #[test]
    fn test_process_url_list_preserves_order() {
        let urls = vec![
            "first".to_string(),
            "second".to_string(),
            "third".to_string(),
        ];
        let mut processed_urls = vec![];

        process_url_list(urls, |url| {
            processed_urls.push(url.to_string());
        });

        assert_eq!(processed_urls, vec!["first", "second", "third"]);
    }
}
