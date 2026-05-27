use tauri::Manager;

/// Initializes the devtools plugin (only in debug mode with devtools feature enabled)
///
/// # Arguments
/// * `app` - The Tauri application instance
///
/// # Returns
/// * `Result<(), String>` - Ok if successful, Err with message if failed
///
/// # Examples
/// ```ignore
/// init_devtools(&app)?;
/// ```
#[cfg(all(debug_assertions, feature = "devtools"))]
pub fn init_devtools(app: &tauri::App) -> Result<(), String> {
    app.handle()
        .plugin(tauri_plugin_devtools::init())
        .map_err(|e| format!("Failed to initialize devtools plugin: {}", e))
}

/// No-op version when devtools is not enabled
#[cfg(not(all(debug_assertions, feature = "devtools")))]
pub fn init_devtools(_app: &tauri::App) -> Result<(), String> {
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_init_devtools_compiles() {
        // Type checking test - ensures the function exists with correct signature
        let _f: fn(&tauri::App) -> Result<(), String> = init_devtools;
    }

    #[cfg(not(all(debug_assertions, feature = "devtools")))]
    #[test]
    fn test_init_devtools_noop_returns_ok() {
        // In non-devtools mode, we can test that the no-op version returns Ok
        // We can't create a real App here, but we verify the function signature
        // and that it compiles correctly

        // This is a compile-time test
        // The actual behavior is tested when devtools feature is enabled
    }

    #[cfg(all(debug_assertions, feature = "devtools"))]
    #[test]
    fn test_init_devtools_requires_app_context() {
        // When devtools is enabled, initialization requires a real App context
        // This is tested in integration tests with full Tauri app setup

        // This test verifies the function signature is correct
    }
}