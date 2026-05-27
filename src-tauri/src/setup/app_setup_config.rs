use std::error::Error;
use tauri::{App, Emitter};

use crate::services::updater;

pub fn app_setup_config() -> fn(&mut App) -> Result<(), Box<dyn Error>> {
    |app| {
        // Setup app (existing setup)
        if let Err(e) = super::setup_app(app) {
            tracing::error!("Setup failed: {}", e);
            return Err(e);
        }

        // Periodic update check: first after 3 minutes, then every hour
        let handle = app.handle().clone();
        tauri::async_runtime::spawn(async move {
            tokio::time::sleep(tokio::time::Duration::from_secs(180)).await;

            loop {
                match updater::check_for_updates(&handle).await {
                    Ok(update_info) => {
                        if update_info.available {
                            tracing::info!("🔔 Update available: {} -> {}",
                                    update_info.current_version,
                                    update_info.latest_version.as_ref().unwrap_or(&"unknown".to_string())
                                );
                            if let Err(e) = handle.emit("update-available", &update_info) {
                                tracing::error!("Failed to emit update-available event: {}", e);
                            }
                        } else {
                            tracing::info!("✅ App is up to date: {}", update_info.current_version);
                        }
                    }
                    Err(e) => {
                        tracing::warn!("⚠️ Failed to check for updates: {:?}", e);
                    }
                }

                tokio::time::sleep(tokio::time::Duration::from_secs(3600)).await;
            }
        });

        Ok(())
    }
}