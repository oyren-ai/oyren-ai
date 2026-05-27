use tauri::Manager;
use crate::services::auth_service;
use crate::setup::{init_logger, init_database, init_devtools, process_initial_deep_links, register_deep_link_callback, register_platform_deep_links, seed_ai_models};

/// Main application setup function
///
/// Orchestrates all setup steps in the correct order:
/// 1. Initialize logger
/// 2. Initialize database
/// 3. Seed AI models
/// 4. Initialize devtools (debug mode only)
/// 5. Process initial deep links
/// 6. Register deep link callback
/// 7. Register platform-specific deep links
///
/// # Arguments
/// * `app` - The Tauri application instance
///
/// # Returns
/// * `Result<(), Box<dyn std::error::Error>>` - Ok if successful, Err if failed
///
/// # Examples
/// ```ignore
/// use oyren::setup::setup_app;
/// setup_app(&mut app)?;
/// ```
pub fn setup_app(app: &mut tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    let app_handle = app.handle().clone();
    let app_data_dir = &app.path().app_data_dir()?;

    // Step 1: Initialize logger
    init_logger::init_logger(app_data_dir);

    // Step 2: Initialize database
    init_database::init_database_sync(&app_handle)?;

    // Step 3: Seed AI models
    tauri::async_runtime::block_on(seed_ai_models::seed_ai_models())
        .map_err(|e| format!("Failed to seed AI models: {}", e))?;

    // Step 4: Initialize devtools (debug mode only)
    init_devtools::init_devtools(app)?;

    // Step 5: Process initial deep links
    process_initial_deep_links::process_initial_deep_links(app)?;

    // Step 6: Register deep link callback
    register_deep_link_callback::register_deep_link_callback(app);

    // Step 7: Register platform-specific deep links
    register_platform_deep_links::register_platform_deep_links(app.handle());

    // Step 8: Start local auth callback server
    auth_service::start_local_callback_server(app_handle);

    Ok(())
}

/// Validates the setup steps order and returns the step names
///
/// This is a pure function for testing the setup sequence
///
/// # Returns
/// * `Vec<&'static str>` - List of setup step names in order
pub fn get_setup_steps() -> Vec<&'static str> {
    vec![
        "Initialize logger",
        "Initialize database",
        "Seed AI models",
        "Initialize devtools",
        "Process initial deep links",
        "Register deep link callback",
        "Register platform-specific deep links",
    ]
}

/// Validates that all required setup steps are present
///
/// # Arguments
/// * `steps` - Vector of step names
///
/// # Returns
/// * `Result<(), String>` - Ok if all steps present, Err with missing steps
pub fn validate_setup_steps(steps: Vec<&str>) -> Result<(), String> {
    let required_steps = get_setup_steps();

    if steps.len() != required_steps.len() {
        return Err(format!(
            "Expected {} steps, got {}",
            required_steps.len(),
            steps.len()
        ));
    }

    for (i, step) in steps.iter().enumerate() {
        if *step != required_steps[i] {
            return Err(format!(
                "Step {} mismatch: expected '{}', got '{}'",
                i + 1,
                required_steps[i],
                step
            ));
        }
    }

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_get_setup_steps_returns_seven_steps() {
        let steps = get_setup_steps();
        assert_eq!(steps.len(), 7);
    }

    #[test]
    fn test_get_setup_steps_order() {
        let steps = get_setup_steps();
        assert_eq!(steps[0], "Initialize logger");
        assert_eq!(steps[1], "Initialize database");
        assert_eq!(steps[2], "Seed AI models");
        assert_eq!(steps[3], "Initialize devtools");
        assert_eq!(steps[4], "Process initial deep links");
        assert_eq!(steps[5], "Register deep link callback");
        assert_eq!(steps[6], "Register platform-specific deep links");
    }

    #[test]
    fn test_validate_setup_steps_success() {
        let steps = vec![
            "Initialize logger",
            "Initialize database",
            "Seed AI models",
            "Initialize devtools",
            "Process initial deep links",
            "Register deep link callback",
            "Register platform-specific deep links",
        ];

        let result = validate_setup_steps(steps);
        assert!(result.is_ok());
    }

    #[test]
    fn test_validate_setup_steps_wrong_count() {
        let steps = vec![
            "Initialize logger",
            "Initialize database",
        ];

        let result = validate_setup_steps(steps);
        assert!(result.is_err());
        assert_eq!(result.unwrap_err(), "Expected 7 steps, got 2");
    }

    #[test]
    fn test_validate_setup_steps_wrong_order() {
        let steps = vec![
            "Initialize database",
            "Initialize logger",
            "Seed AI models",
            "Initialize devtools",
            "Process initial deep links",
            "Register deep link callback",
            "Register platform-specific deep links",
        ];

        let result = validate_setup_steps(steps);
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("Step 1 mismatch"));
    }

    #[test]
    fn test_validate_setup_steps_wrong_name() {
        let steps = vec![
            "Initialize logger",
            "Initialize database",
            "Seed AI models",
            "Setup devtools",  // Wrong name
            "Process initial deep links",
            "Register deep link callback",
            "Register platform-specific deep links",
        ];

        let result = validate_setup_steps(steps);
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("Step 4 mismatch"));
    }

    #[test]
    fn test_validate_setup_steps_empty() {
        let steps: Vec<&str> = vec![];

        let result = validate_setup_steps(steps);
        assert!(result.is_err());
        assert_eq!(result.unwrap_err(), "Expected 7 steps, got 0");
    }

    #[test]
    fn test_validate_setup_steps_extra_steps() {
        let steps = vec![
            "Initialize logger",
            "Initialize database",
            "Seed AI models",
            "Initialize devtools",
            "Process initial deep links",
            "Register deep link callback",
            "Register platform-specific deep links",
            "Extra step",
        ];

        let result = validate_setup_steps(steps);
        assert!(result.is_err());
        assert_eq!(result.unwrap_err(), "Expected 7 steps, got 8");
    }

    #[test]
    fn test_setup_app_function_signature() {
        // Type checking test - ensures the function exists with correct signature
        let _f: fn(&mut tauri::App) -> Result<(), Box<dyn std::error::Error>> = setup_app;
    }

    #[test]
    fn test_setup_steps_immutability() {
        let steps1 = get_setup_steps();
        let steps2 = get_setup_steps();

        // Verify that the steps are consistent across calls
        assert_eq!(steps1, steps2);
    }
}