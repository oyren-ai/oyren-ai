use crate::adapters::db::{models::AiProviderModel, repositories, sqlite};

pub async fn get_models_by_provider_id(
    provider_id: String,
) -> Result<Vec<AiProviderModel>, String> {
    let pool = sqlite::get_db_pool()?;
    repositories::ai_provider_model::get_models_by_provider_id(pool, &provider_id).await
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::adapters::db::test_utils::init_test_db;
    use crate::adapters::db::{repositories, sqlite};
    use crate::config::ai_seed_models::SeedModel;

    async fn setup() {
        init_test_db().await;
        let pool = sqlite::get_db_pool().unwrap();
        let now = chrono::Utc::now().to_rfc3339();
        let _ = sqlx::query("INSERT OR IGNORE INTO ai_providers (id, name, created_at) VALUES (?, ?, ?)")
            .bind("svc-get-by-prov")
            .bind("svc-get-by-prov")
            .bind(&now)
            .execute(pool)
            .await;

        let models = vec![SeedModel {
            id: "svc-prov-m1".to_string(),
            provider_id: "svc-get-by-prov".to_string(),
            model_name: "Svc Provider Model".to_string(),
            is_multimodal: false,
            metadata: None,
        }];
        let _ = repositories::ai_provider_model::seed_ai_provider_models(pool, models).await;
    }

    #[tokio::test]
    async fn test_get_by_provider() {
        setup().await;
        let result = get_models_by_provider_id("svc-get-by-prov".to_string()).await;
        assert!(result.is_ok());
        let models = result.unwrap();
        assert!(models.iter().any(|m| m.id == "svc-prov-m1"));
    }

    #[tokio::test]
    async fn test_get_by_provider_empty() {
        setup().await;
        let result = get_models_by_provider_id("unknown".to_string()).await;
        assert!(result.is_ok());
        assert!(result.unwrap().is_empty());
    }
}