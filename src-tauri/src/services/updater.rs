use serde::{Deserialize, Serialize};
use crate::errors::UpdaterError;

#[cfg(debug_assertions)]
use crate::config::VERSION_CHECK_URL_DEV as VERSION_CHECK_URL;
#[cfg(not(debug_assertions))]
use crate::config::VERSION_CHECK_URL_PROD as VERSION_CHECK_URL;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateInfo {
    pub available: bool,
    pub current_version: String,
    pub latest_version: Option<String>,
    pub body: Option<String>,
    pub whats_changed: Option<String>,
}

#[derive(Debug, Deserialize)]
struct VersionResponse {
    #[serde(rename = "latestVersionAvailable")]
    latest_version_available: String,
    #[serde(rename = "whatsChanged")]
    whats_changed: Option<String>,
}

pub async fn check_for_updates(app: &tauri::AppHandle) -> Result<UpdateInfo, UpdaterError> {
    let current_version = app.package_info().version.to_string();

    let client = reqwest::Client::new();
    let response = client
        .get(VERSION_CHECK_URL)

        .send()
        .await
        .map_err(|e| UpdaterError::CheckFailed {
            message: format!("Failed to check version: {}", e),
        })?;

    let version_data: VersionResponse = response
        .json()
        .await
        .map_err(|e| UpdaterError::CheckFailed {
            message: format!("Failed to parse version response: {}", e),
        })?;

    let latest_version = version_data.latest_version_available;
    let is_newer = is_version_newer(&current_version, &latest_version);

    Ok(UpdateInfo {
        available: is_newer,
        current_version,
        latest_version: Some(latest_version),
        body: None,
        whats_changed: version_data.whats_changed,
    })
}

fn is_version_newer(current: &str, latest: &str) -> bool {
    current != latest
}
