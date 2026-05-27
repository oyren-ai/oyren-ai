use crate::adapters::db::sqlite;

/// Initializes the database connection pool and runs migrations
///
/// # Arguments
/// * `app_handle` - The Tauri application handle
///
/// # Returns
/// * `Result<(), String>` - Ok if successful, Err with message if failed
///
/// # Examples
/// ```ignore
/// let app_handle = app.handle();
/// init_database_sync(&app_handle)?;
/// ```
pub fn init_database_sync(app_handle: &tauri::AppHandle) -> Result<(), String> {
    tauri::async_runtime::block_on(async move {
        sqlite::init_database(app_handle).await
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    // Note: Full integration tests for database initialization are in
    // adapters/db/sqlite.rs. These tests verify the wrapper function works correctly.

    #[test]
    fn test_init_database_sync_signature() {
        // This test verifies the function signature compiles correctly
        // Actual database testing requires a Tauri app context which is tested
        // in the sqlite module integration tests

        // Type checking test - ensures the function exists with correct signature
        let _f: fn(&tauri::AppHandle) -> Result<(), String> = init_database_sync;
    }

    // Integration test with mock app handle would go here
    // However, testing with actual Tauri AppHandle requires full app context
    // which is tested in the sqlite module's comprehensive test suite
}
