use crate::errors::ArxivApiError;

const ARXIV_API_URL: &str = "http://export.arxiv.org/api/query";
const MAX_RESULTS_UPPER: u32 = 10;

pub async fn search_arxiv(query: &str, max_results: u32) -> Result<String, ArxivApiError> {
    let clamped = max_results.clamp(1, MAX_RESULTS_UPPER);
    let url = format!(
        "{}?search_query=all:{}&max_results={}&sortBy=relevance&sortOrder=descending",
        ARXIV_API_URL,
        urlencoding::encode(query),
        clamped
    );

    let response = reqwest::get(&url)
        .await
        .map_err(|e| ArxivApiError::NetworkError {
            message: format!("Failed to reach ArXiv API: {}", e),
        })?;

    match response.status().is_success() {
        true => response
            .text()
            .await
            .map_err(|e| ArxivApiError::InvalidResponse {
                message: format!("Failed to read response body: {}", e),
            }),
        false => Err(ArxivApiError::InvalidResponse {
            message: format!("ArXiv API returned status {}", response.status()),
        }),
    }
}
