use super::*;

// Commented out due to generate_context!() symbol duplication issue
// This causes "_EMBED_INFO_PLIST is already defined" error when running tests
// These functions are used by some slidev export tests - those tests will be skipped

// use tauri::{generate_context, App, AppHandle, Builder};

// pub fn mock_app() -> App {
//     Builder::default()
//         .build(generate_context!())
//         .expect("Failed to build mock app")
// }

// pub fn mock_app_handle() -> AppHandle {
//     mock_app().handle().clone()
// }

// #[test]
// fn test_app_handle_exists() {
//     let app = mock_app();
//     let handle = app.handle();
//     assert_eq!(1, 1);
// }
