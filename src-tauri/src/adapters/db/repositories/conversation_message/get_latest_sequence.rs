use sqlx::SqlitePool;

pub async fn get_latest_sequence_number(
    pool: &SqlitePool,
    conversation_id: &str,
) -> Result<i32, String> {
    let result = sqlx::query_scalar::<_, Option<i32>>(
        "SELECT MAX(sequence_number)
         FROM ai_agent_conversation_messages
         WHERE conversation_id = ?",
    )
    .bind(conversation_id)
    .fetch_one(pool)
    .await
    .map_err(|e| format!("Failed to get latest sequence number: {}", e))?;

    Ok(result.unwrap_or(-1))
}
