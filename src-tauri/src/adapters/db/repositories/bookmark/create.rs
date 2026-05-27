use crate::adapters::db::models::{CreateBookmarkRequest, WorkspaceFileBookmark};
use chrono::Utc;
use sqlx::SqlitePool;
use uuid::Uuid;

pub async fn create_bookmark(
    pool: &SqlitePool,
    request: CreateBookmarkRequest,
) -> Result<WorkspaceFileBookmark, String> {
    if request.bookmark_description.len() > 50 {
        return Err("Bookmark description must be 50 characters or less".to_string());
    }

    let now = Utc::now();
    let id = Uuid::new_v4().to_string();

    let bookmark = WorkspaceFileBookmark {
        id: id.clone(),
        workspace_id: request.workspace_id.clone(),
        workspace_file_id: request.workspace_file_id.clone(),
        bookmark_page: request.bookmark_page,
        bookmark_description: request.bookmark_description.clone(),
        date_created: now,
        metadata: request.metadata.clone(),
    };

    sqlx::query(
        r#"
        INSERT INTO workspace_file_bookmarks (
            id, workspace_id, workspace_file_id, bookmark_page,
            bookmark_description, date_created, metadata
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
        "#,
    )
    .bind(&bookmark.id)
    .bind(&bookmark.workspace_id)
    .bind(&bookmark.workspace_file_id)
    .bind(bookmark.bookmark_page)
    .bind(&bookmark.bookmark_description)
    .bind(&bookmark.date_created)
    .bind(&bookmark.metadata)
    .execute(pool)
    .await
    .map_err(|e| format!("Failed to create bookmark: {}", e))?;

    Ok(bookmark)
}

#[cfg(test)]
mod tests {
    use super::*;
    use sqlx::sqlite::SqlitePoolOptions;
    use tempfile::TempDir;

    async fn setup_test_db() -> (SqlitePool, TempDir) {
        let temp_dir = TempDir::new().expect("Failed to create temp directory");
        let db_path = temp_dir.path().join("test.db");
        let db_url = format!("sqlite://{}?mode=rwc", db_path.display());

        let pool = SqlitePoolOptions::new()
            .max_connections(1)
            .connect(&db_url)
            .await
            .expect("Failed to create test database");

        sqlx::query(
            r#"
            CREATE TABLE IF NOT EXISTS workspaces (
                id TEXT PRIMARY KEY NOT NULL,
                name TEXT NOT NULL,
                description TEXT,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                last_accessed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                is_pinned BOOLEAN NOT NULL DEFAULT 0,
                is_archived BOOLEAN NOT NULL DEFAULT 0,
                is_favourite BOOLEAN NOT NULL DEFAULT 0,
                settings TEXT,
                is_active BOOLEAN NOT NULL DEFAULT 1
            )
            "#,
        )
        .execute(&pool)
        .await
        .expect("Failed to create workspaces table");

        sqlx::query(
            r#"
            CREATE TABLE IF NOT EXISTS workspace_files (
                id TEXT PRIMARY KEY NOT NULL,
                workspace_id TEXT NOT NULL,
                file_path TEXT NOT NULL,
                file_name TEXT NOT NULL,
                added_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
            "#,
        )
        .execute(&pool)
        .await
        .expect("Failed to create workspace_files table");

        sqlx::query(
            r#"
            CREATE TABLE IF NOT EXISTS workspace_file_bookmarks (
                id TEXT PRIMARY KEY NOT NULL,
                workspace_id TEXT NOT NULL,
                workspace_file_id TEXT NOT NULL,
                bookmark_page INTEGER NOT NULL,
                bookmark_description TEXT CHECK(length(bookmark_description) <= 50),
                date_created TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                metadata TEXT
            )
            "#,
        )
        .execute(&pool)
        .await
        .expect("Failed to create workspace_file_bookmarks table");

        (pool, temp_dir)
    }
}