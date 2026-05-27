use crate::services::auth_service;

/// Open authentication browser (Tauri command)
#[tauri::command]
pub fn open_auth_browser(is_dev: bool) -> Result<String, String> {
    auth_service::open_auth_browser(is_dev)
}

/// Handle deep link callback from browser (Tauri command)
#[tauri::command]
pub fn handle_deep_link_command(window: tauri::WebviewWindow, url: String) {
    tracing::info!("🔗 handle_deep_link_command called with URL: {}", url);
    auth_service::handle_deep_link(&window, &url);
}

/// Open URL in default browser (Tauri command)
#[tauri::command]
pub fn open_url_in_browser(url: String) -> Result<(), String> {
    tracing::info!("🌐 Opening URL in default browser: {}", url);
    open::that(&url).map_err(|e| format!("Failed to open URL in browser: {}", e))
}