use crate::services::auth_service;
use tauri::{AppHandle, Manager};

/// Setup deep link handlers for all platforms
#[allow(unused_variables)]
pub fn setup_deep_link_handlers(app: &AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    // Register all deep link schemes for testing (Windows/Linux)
    #[cfg(any(target_os = "windows", target_os = "linux"))]
    {
        use tauri_plugin_deep_link::DeepLinkExt;
        tracing::info!("🔗 Registering deep link schemes for Windows/Linux testing");
        app.deep_link().register_all()?;
        tracing::info!("✅ Deep link schemes registered");

        // Handle CLI args for Windows/Linux first launch
        tracing::info!("🔍 Checking command line args for deep links...");
        let args: Vec<String> = std::env::args().collect();
        tracing::debug!("📋 Total command line args: {}", args.len());
        tracing::debug!("📋 All command line args: {:?}", args);

        if let Some(window) = app.get_webview_window("main") {
            tracing::info!("✅ Main window found during setup");
            for (idx, arg) in args.iter().enumerate() {
                tracing::debug!("  arg[{}]: {}", idx, arg);
                if arg.starts_with("oyren://") {
                    tracing::info!("🚀 App opened with deep link: {}", arg);
                    tracing::info!("🔗 Calling handle_deep_link...");
                    auth_service::handle_deep_link(&window, arg);
                    tracing::info!("✅ handle_deep_link completed");
                } else {
                    tracing::debug!("  Not a deep link: {}", arg);
                }
            }
        } else {
            tracing::warn!("⚠️ Main window not found during setup!");
        }
        tracing::info!("🏁 Deep link check completed");
    }

    tracing::info!("✅ Deep link handlers setup complete");
    Ok(())
}
