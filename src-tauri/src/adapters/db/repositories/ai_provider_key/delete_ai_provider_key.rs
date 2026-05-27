use sqlx::SqlitePool;

pub async fn delete_ai_provider_key(pool: &SqlitePool, id: &str) -> Result<(), String> {
    sqlx::query("DELETE FROM ai_provider_keys WHERE id = ?")
        .bind(id)
        .execute(pool)
        .await
        .map_err(|e| format!("Failed to delete AI provider key: {}", e))?;

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::adapters::db::models::CreateAiProviderKeyRequest;
    use crate::adapters::db::repositories::ai_provider_key::{
        create_ai_provider_key, get_ai_provider_key,
    };
    use crate::adapters::db::test_utils::setup_test_db;
    use sqlx::SqlitePool;
    use tempfile::TempDir;

    async fn setup_db_with_providers() -> (SqlitePool, TempDir) {
        let (pool, temp_dir) = setup_test_db().await;

        let now = chrono::Utc::now().to_rfc3339();
        sqlx::query("INSERT INTO ai_providers (id, name, created_at) VALUES (?, ?, ?)")
            .bind("gemini")
            .bind("gemini")
            .bind(&now)
            .execute(&pool)
            .await
            .expect("Failed to insert gemini provider");

        (pool, temp_dir)
    }

    #[tokio::test]
    async fn test_delete_ai_provider_key_success() {
        let (pool, _temp_dir) = setup_db_with_providers().await;

        let request = CreateAiProviderKeyRequest {
            provider_id: "gemini".to_string(),
            name: "Test Name".to_string(),
            key: "test-key-123".to_string(),
        };
        let created = create_ai_provider_key(&pool, request).await.unwrap();

        let result = delete_ai_provider_key(&pool, &created.id).await;
        assert!(result.is_ok());

        let found = get_ai_provider_key(&pool, &created.id).await.unwrap();
        assert!(found.is_none());
    }

    #[tokio::test]
    async fn test_delete_ai_provider_key_idempotent() {
        let (pool, _temp_dir) = setup_db_with_providers().await;

        let request = CreateAiProviderKeyRequest {
            provider_id: "gemini".to_string(),
            name: "Test Name".to_string(),
            key: "test-key-456".to_string(),
        };
        let created = create_ai_provider_key(&pool, request).await.unwrap();
        delete_ai_provider_key(&pool, &created.id).await.unwrap();

        let result = delete_ai_provider_key(&pool, &created.id).await;
        assert!(result.is_ok());
    }
}
