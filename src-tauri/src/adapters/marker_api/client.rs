use crate::errors::MarkerApiError;
use reqwest::multipart;
use std::time::{Duration, Instant};

const DEFAULT_MARKER_API_BASE: &str = "http://localhost:3000";
const MARKER_TIMEOUT_SECS: u64 = 600;

fn api_base(base_url: Option<&str>) -> String {
    base_url
        .filter(|s| !s.is_empty())
        .map(|s| s.trim_end_matches('/'))
        .unwrap_or(DEFAULT_MARKER_API_BASE)
        .to_string()
}

pub async fn convert_pdf(
    base_url: Option<&str>,
    pdf_path: &str,
    auth_token: &str,
    estimated_pages: Option<u32>,
) -> Result<Vec<u8>, MarkerApiError> {
    let base = api_base(base_url);
    let api_url = format!("{}/api/pdf-scan", base);
    tracing::info!("[Marker] Starting conversion for: {} (API: {})", pdf_path, api_url);

    let pdf_bytes = std::fs::read(pdf_path).map_err(|e| MarkerApiError::NetworkError {
        message: format!("Failed to read PDF file: {}", e),
    })?;

    let page_count = estimated_pages.unwrap_or(1);

    tracing::info!("[Marker] Read PDF ({} bytes, ~{} pages), uploading to API...", pdf_bytes.len(), page_count);

    let file_name = std::path::Path::new(pdf_path)
        .file_name()
        .unwrap_or_default()
        .to_string_lossy()
        .to_string();

    let file_part = multipart::Part::bytes(pdf_bytes)
        .file_name(file_name.clone())
        .mime_str("application/pdf")
        .map_err(|e| MarkerApiError::InvalidResponse {
            message: format!("Failed to create multipart: {}", e),
        })?;

    let form = multipart::Form::new().part("file", file_part);

    let start = Instant::now();
    let client = reqwest::Client::new();
    let url = format!("{}?estimated_pages={}", api_url, page_count);
    let response = client
        .post(&url)
        .bearer_auth(auth_token)
        .multipart(form)
        .timeout(Duration::from_secs(MARKER_TIMEOUT_SECS))
        .send()
        .await
        .map_err(|e| {
            tracing::error!("[Marker] Request failed after {:.1}s: {}", start.elapsed().as_secs_f64(), e);
            MarkerApiError::NetworkError {
                message: e.to_string(),
            }
        })?;

    let status = response.status().as_u16();
    let elapsed = start.elapsed().as_secs_f64();
    tracing::info!("[Marker] Response status {} after {:.1}s for {}", status, elapsed, file_name);

    match status {
        200 => response
            .bytes()
            .await
            .map(|b| {
                tracing::info!("[Marker] Received {} bytes zip response", b.len());
                b.to_vec()
            })
            .map_err(|e| MarkerApiError::InvalidResponse {
                message: format!("Failed to read response body: {}", e),
            }),
        401 => Err(MarkerApiError::AuthError {
            message: "Invalid or expired auth token".to_string(),
        }),
        402 => Err(MarkerApiError::ServerError {
            message: "Not enough credits to convert this PDF to Markdown.".to_string(),
        }),
        403 => Err(MarkerApiError::AuthError {
            message: "Access denied — your account doesn't have conversion access".to_string(),
        }),
        413 => Err(MarkerApiError::ServerError {
            message: "PDF file too large for conversion".to_string(),
        }),
        status => Err(MarkerApiError::ServerError {
            message: format!("Marker API returned status {}", status),
        }),
    }
}
