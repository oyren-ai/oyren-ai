use tauri::{AppHandle, Manager};

use crate::services::auth_service;

pub fn single_instance_plugin_config() -> fn(&AppHandle, Vec<String>, String) {
    |app, args, _cwd| {
        // This callback is called when app is already running and a new instance tries to start
        // Deep links are handled differently on different platforms:
        // - macOS/iOS/Android: Use onOpenUrl() event from frontend (handled by deep-link plugin)
        // - Windows/Linux: URLs are passed as CLI arguments (handled here)
        tracing::info!("🔄 Single instance: App already running, handling new args");
        tracing::info!("📋 Total args received: {}", args.len());
        tracing::info!("📋 All args: {:?}", args);

        // Check for deep link URLs in args (Windows/Linux only)
        for (idx, arg) in args.iter().enumerate() {
            tracing::info!("  arg[{}]: {}", idx, arg);
            if arg.starts_with("oyren://") {
                tracing::info!("🔗 Received deep link in existing instance: {}", arg);

                if let Some(window) = app.get_webview_window("main") {
                    tracing::info!("✅ Main window found, calling handle_deep_link");
                    auth_service::handle_deep_link(&window, arg);
                    tracing::info!("✅ handle_deep_link completed");
                } else {
                    tracing::warn!("⚠️ Main window not found!");
                }
            } else {
                tracing::info!("  Not a deep link: {}", arg);
            }
        }
        tracing::debug!("🏁 Single instance handler completed");
    }
}