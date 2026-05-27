use crate::adapters::db::models::AiProviderModel;
use sqlx::SqlitePool;

pub async fn update_ai_provider_model_active(
    pool: &SqlitePool,
    id: &str,
    is_active: bool,
) -> Result<AiProviderModel, String> {
    let rows = sqlx::query(
        "UPDATE ai_provider_models SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
    )
    .bind(is_active)
    .bind(id)
    .execute(pool)
    .await
    .map_err(|e| format!("Failed to update AI provider model: {}", e))?;

    if rows.rows_affected() == 0 {
        return Err(format!("AI provider model '{}' not found", id));
    }

    sqlx::query_as::<_, AiProviderModel>(
        r#"SELECT id, provider_id, model_name, is_multimodal, is_active,
           metadata, created_at, updated_at
           FROM ai_provider_models WHERE id = ?"#,
    )
    .bind(id)
    .fetch_one(pool)
    .await
    .map_err(|e| format!("Failed to fetch updated model: {}", e))
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::adapters::db::repositories::ai_provider_model::seed_ai_provider_models;
    use crate::adapters::db::test_utils::setup_test_db;
    use crate::config::ai_seed_models::SeedModel;

    async fn insert_provider(pool: &SqlitePool) {
        let now = chrono::Utc::now().to_rfc3339();
        sqlx::query("INSERT OR IGNORE INTO ai_providers (id, name, created_at) VALUES (?, ?, ?)")
            .bind("gemini")
            .bind("gemini")
            .bind(&now)
            .execute(pool)
            .await
            .unwrap();
    }

    fn seed_model(id: &str) -> SeedModel {
        SeedModel {
            id: id.to_string(),
            provider_id: "gemini".to_string(),
            model_name: "Test Model".to_string(),
            is_multimodal: false,
            metadata: None,
        }
    }

    #[tokio::test]
    async fn test_deactivate_model() {
        let (pool, _dir) = setup_test_db().await;
        insert_provider(&pool).await;
        seed_ai_provider_models(&pool, vec![seed_model("m1")]).await.unwrap();

        let result = update_ai_provider_model_active(&pool, "m1", false).await;
        assert!(result.is_ok());
        assert!(!result.unwrap().is_active);
    }

    #[tokio::test]
    async fn test_reactivate_model() {
        let (pool, _dir) = setup_test_db().await;
        insert_provider(&pool).await;
        seed_ai_provider_models(&pool, vec![seed_model("m1")]).await.unwrap();

        update_ai_provider_model_active(&pool, "m1", false).await.unwrap();
        let result = update_ai_provider_model_active(&pool, "m1", true).await;
        assert!(result.is_ok());
        assert!(result.unwrap().is_active);
    }

    #[tokio::test]
    async fn test_update_not_found() {
        let (pool, _dir) = setup_test_db().await;
        let result = update_ai_provider_model_active(&pool, "nonexistent", false).await;
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("not found"));
    }
}