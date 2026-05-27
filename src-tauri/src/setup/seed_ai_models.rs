use crate::adapters::db::{repositories, sqlite};
use crate::config::ai_seed_models;

pub async fn seed_ai_models() -> Result<(), String> {
    let pool = sqlite::get_db_pool()?;
    let models = ai_seed_models::get_all_seed_models();
    repositories::ai_provider_model::seed_ai_provider_models(pool, models).await
}