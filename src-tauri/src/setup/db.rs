use tauri::AppHandle;

use crate::adapters::db::sqlite;

/// Initialize the database
pub fn init_db(app_handle: &AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    tauri::async_runtime::block_on(async move { sqlite::init_database(app_handle).await })?;
    Ok(())
}
