use sqlx::{sqlite::SqlitePoolOptions, SqlitePool};
use std::sync::OnceLock;
use tauri::{AppHandle, Manager};

pub(crate) static DB_POOL: OnceLock<SqlitePool> = OnceLock::new();

pub async fn init_database(app: &AppHandle) -> Result<(), String> {
    let app_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data directory: {}", e))?;

    if !app_dir.exists() {
        std::fs::create_dir_all(&app_dir)
            .map_err(|e| format!("Failed to create app data directory: {}", e))?;
    }

    let db_path = app_dir.join("oyren.db");
    let db_url = format!("sqlite://{}?mode=rwc", db_path.display());

    let pool = SqlitePoolOptions::new()
        .max_connections(5)
        .connect(&db_url)
        .await
        .map_err(|e| format!("Failed to connect to database: {}", e))?;

    // Run migrations
    sqlx::migrate!("./migrations")
        .run(&pool)
        .await
        .map_err(|e| format!("Failed to run migrations: {}", e))?;

    DB_POOL
        .set(pool)
        .map_err(|_| "Failed to set database pool".to_string())?;

    Ok(())
}

pub fn get_db_pool() -> Result<&'static SqlitePool, String> {
    DB_POOL
        .get()
        .ok_or_else(|| "Database not initialized".to_string())
}

#[cfg(test)]
#[path = "sqlite_test.rs"]
mod tests;
