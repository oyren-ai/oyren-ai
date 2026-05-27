use crate::config::ai_seed_models::SeedModel;
use sqlx::SqlitePool;
use std::collections::{HashMap, HashSet};

pub async fn seed_ai_provider_models(
    pool: &SqlitePool,
    models: Vec<SeedModel>,
) -> Result<(), String> {
    let seed_ids_by_provider = group_ids_by_provider(&models);

    for model in &models {
        upsert_model(pool, model).await?;
    }

    remove_stale_models(pool, &seed_ids_by_provider).await
}

async fn upsert_model(pool: &SqlitePool, model: &SeedModel) -> Result<(), String> {
    sqlx::query(
        r#"
        INSERT INTO ai_provider_models
            (id, provider_id, model_name, is_multimodal, is_active, metadata)
        VALUES (?, ?, ?, ?, 0, ?)
        ON CONFLICT(id) DO UPDATE SET
            model_name = excluded.model_name,
            is_multimodal = excluded.is_multimodal,
            metadata = excluded.metadata,
            updated_at = CURRENT_TIMESTAMP
        "#,
    )
    .bind(&model.id)
    .bind(&model.provider_id)
    .bind(&model.model_name)
    .bind(model.is_multimodal)
    .bind(&model.metadata)
    .execute(pool)
    .await
    .map_err(|e| format!("Failed to seed AI provider model '{}': {}", model.id, e))
    .map(|_| ())
}

async fn remove_stale_models(
    pool: &SqlitePool,
    seed_ids_by_provider: &HashMap<String, HashSet<String>>,
) -> Result<(), String> {
    for (provider_id, valid_ids) in seed_ids_by_provider {
        let rows: Vec<(String,)> = sqlx::query_as(
            "SELECT id FROM ai_provider_models WHERE provider_id = ?",
        )
        .bind(provider_id)
        .fetch_all(pool)
        .await
        .map_err(|e| format!("Failed to query models for provider '{}': {}", provider_id, e))?;

        for (db_id,) in rows {
            if !valid_ids.contains(&db_id) {
                sqlx::query("DELETE FROM ai_provider_models WHERE id = ?")
                    .bind(&db_id)
                    .execute(pool)
                    .await
                    .map_err(|e| format!("Failed to remove stale model '{}': {}", db_id, e))?;
            }
        }
    }
    Ok(())
}

fn group_ids_by_provider(models: &[SeedModel]) -> HashMap<String, HashSet<String>> {
    let mut map: HashMap<String, HashSet<String>> = HashMap::new();
    for m in models {
        map.entry(m.provider_id.clone())
            .or_default()
            .insert(m.id.clone());
    }
    map
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::adapters::db::test_utils::setup_test_db;

    async fn insert_test_provider(pool: &SqlitePool, id: &str) {
        let now = chrono::Utc::now().to_rfc3339();
        sqlx::query("INSERT OR IGNORE INTO ai_providers (id, name, created_at) VALUES (?, ?, ?)")
            .bind(id)
            .bind(id)
            .bind(&now)
            .execute(pool)
            .await
            .expect("Failed to insert test provider");
    }

    fn test_seed(id: &str, provider: &str, name: &str) -> SeedModel {
        SeedModel {
            id: id.to_string(),
            provider_id: provider.to_string(),
            model_name: name.to_string(),
            is_multimodal: true,
            metadata: None,
        }
    }

    #[tokio::test]
    async fn test_seed_inserts_models() {
        let (pool, _dir) = setup_test_db().await;
        insert_test_provider(&pool, "gemini").await;

        let models = vec![
            test_seed("model-1", "gemini", "Model One"),
            test_seed("model-2", "gemini", "Model Two"),
        ];

        let result = seed_ai_provider_models(&pool, models).await;
        assert!(result.is_ok());

        let count: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM ai_provider_models")
            .fetch_one(&pool)
            .await
            .unwrap();
        assert_eq!(count.0, 2);
    }

    #[tokio::test]
    async fn test_seed_updates_model_name_on_conflict() {
        let (pool, _dir) = setup_test_db().await;
        insert_test_provider(&pool, "gemini").await;

        seed_ai_provider_models(&pool, vec![test_seed("m1", "gemini", "Old Name")])
            .await
            .unwrap();

        seed_ai_provider_models(&pool, vec![test_seed("m1", "gemini", "New Name")])
            .await
            .unwrap();

        let row: (String,) =
            sqlx::query_as("SELECT model_name FROM ai_provider_models WHERE id = ?")
                .bind("m1")
                .fetch_one(&pool)
                .await
                .unwrap();
        assert_eq!(row.0, "New Name");
    }

    #[tokio::test]
    async fn test_seed_preserves_is_active_on_conflict() {
        let (pool, _dir) = setup_test_db().await;
        insert_test_provider(&pool, "gemini").await;

        seed_ai_provider_models(&pool, vec![test_seed("m1", "gemini", "Model")])
            .await
            .unwrap();

        // User activates the model after testing
        sqlx::query("UPDATE ai_provider_models SET is_active = 1 WHERE id = ?")
            .bind("m1")
            .execute(&pool)
            .await
            .unwrap();

        // Re-seed should NOT overwrite user's activation
        seed_ai_provider_models(&pool, vec![test_seed("m1", "gemini", "Model")])
            .await
            .unwrap();

        let row: (bool,) =
            sqlx::query_as("SELECT is_active FROM ai_provider_models WHERE id = ?")
                .bind("m1")
                .fetch_one(&pool)
                .await
                .unwrap();
        assert!(row.0);
    }

    #[tokio::test]
    async fn test_seed_empty_list() {
        let (pool, _dir) = setup_test_db().await;
        let result = seed_ai_provider_models(&pool, vec![]).await;
        assert!(result.is_ok());
    }

    #[tokio::test]
    async fn test_seed_removes_stale_models() {
        let (pool, _dir) = setup_test_db().await;
        insert_test_provider(&pool, "gemini").await;

        // First seed with 3 models
        seed_ai_provider_models(&pool, vec![
            test_seed("m1", "gemini", "Model 1"),
            test_seed("m2", "gemini", "Model 2"),
            test_seed("m3", "gemini", "Model 3"),
        ]).await.unwrap();

        // Re-seed with only 2 — m3 should be removed
        seed_ai_provider_models(&pool, vec![
            test_seed("m1", "gemini", "Model 1"),
            test_seed("m2", "gemini", "Model 2"),
        ]).await.unwrap();

        let count: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM ai_provider_models")
            .fetch_one(&pool).await.unwrap();
        assert_eq!(count.0, 2);

        let gone = sqlx::query_as::<_, (String,)>(
            "SELECT id FROM ai_provider_models WHERE id = 'm3'"
        ).fetch_optional(&pool).await.unwrap();
        assert!(gone.is_none());
    }

    #[tokio::test]
    async fn test_seed_does_not_remove_other_provider_models() {
        let (pool, _dir) = setup_test_db().await;
        insert_test_provider(&pool, "gemini").await;
        insert_test_provider(&pool, "deepseek").await;

        // Seed both providers
        seed_ai_provider_models(&pool, vec![
            test_seed("g1", "gemini", "Gemini 1"),
            test_seed("d1", "deepseek", "DeepSeek 1"),
        ]).await.unwrap();

        // Re-seed only gemini — deepseek model should remain
        seed_ai_provider_models(&pool, vec![
            test_seed("g1", "gemini", "Gemini 1"),
        ]).await.unwrap();

        let count: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM ai_provider_models")
            .fetch_one(&pool).await.unwrap();
        assert_eq!(count.0, 2);
    }
}
