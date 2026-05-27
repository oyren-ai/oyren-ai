use crate::services::arxiv_search_service;

#[tauri::command]
pub async fn search_arxiv(query: String, max_results: Option<u32>) -> Result<String, String> {
    let max = max_results.unwrap_or(10);
    arxiv_search_service::search_arxiv(&query, max)
        .await
        .map_err(|e| arxiv_search_service::arxiv_error_to_string(&e))
}
