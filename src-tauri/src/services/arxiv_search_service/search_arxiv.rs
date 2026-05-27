use crate::adapters::arxiv_api;
use crate::errors::{arxiv_api_error_to_string, ArxivApiError};

pub async fn search_arxiv(query: &str, max_results: u32) -> Result<String, ArxivApiError> {
    arxiv_api::search_arxiv(query, max_results).await
}

pub fn arxiv_error_to_string(err: &ArxivApiError) -> String {
    arxiv_api_error_to_string(err)
}
