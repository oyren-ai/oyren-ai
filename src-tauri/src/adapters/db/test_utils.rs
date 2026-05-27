//! Common test utilities for database tests
//!
//! This module provides a centralized database setup for all tests that need
//! to interact with the database. It ensures all tests have access to the same
//! complete schema.

#![cfg(test)]

use sqlx::{sqlite::SqlitePoolOptions, SqlitePool};
use std::sync::OnceLock;
use tempfile::TempDir;

static TEST_DB_INITIALIZED: OnceLock<()> = OnceLock::new();
static TEST_DB_DIR: OnceLock<TempDir> = OnceLock::new();

/// Initialize the test database with all required tables.
/// This function is idempotent and can be called multiple times safely.
/// It creates all tables that the application uses to ensure tests have
/// access to a complete schema.
pub async fn init_test_db() {
    use crate::adapters::db::sqlite::DB_POOL;

    // Check if already initialized
    if TEST_DB_INITIALIZED.get().is_some() {
        return;
    }

    // Create temp directory
    let temp_dir = TempDir::new().expect("Failed to create temp directory");
    let db_path = temp_dir.path().join("test.db");
    let db_url = format!("sqlite://{}?mode=rwc", db_path.display());

    let pool = SqlitePoolOptions::new()
        .max_connections(5)
        .connect(&db_url)
        .await
        .expect("Failed to create test database");

    create_all_tables(&pool).await;

    // Initialize the static pool (may fail if already set, which is ok)
    let _ = DB_POOL.set(pool);

    // Store temp_dir to prevent cleanup
    let _ = TEST_DB_DIR.set(temp_dir);

    // Mark as initialized
    let _ = TEST_DB_INITIALIZED.set(());
}

/// Setup a fresh test database for isolated tests.
/// Returns (SqlitePool, TempDir) for tests that need their own database instance.
pub async fn setup_test_db() -> (SqlitePool, TempDir) {
    let temp_dir = TempDir::new().expect("Failed to create temp directory");
    let db_path = temp_dir.path().join("test.db");
    let db_url = format!("sqlite://{}?mode=rwc", db_path.display());

    let pool = SqlitePoolOptions::new()
        .max_connections(1)
        .connect(&db_url)
        .await
        .expect("Failed to create test database");

    create_all_tables(&pool).await;

    (pool, temp_dir)
}

/// Create all application tables in the given pool.
/// This ensures test databases have the complete schema.
async fn create_all_tables(pool: &SqlitePool) {
    // Create workspaces table
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
    .execute(pool)
    .await
    .expect("Failed to create workspaces table");

    // Create workspace_files table
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS workspace_files (
            id TEXT PRIMARY KEY NOT NULL,
            workspace_id TEXT NOT NULL,
            file_path TEXT NOT NULL,
            file_name TEXT NOT NULL,
            added_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            last_accessed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            is_visible BOOLEAN NOT NULL DEFAULT 1,
            is_read_only BOOLEAN NOT NULL DEFAULT 1,
            metadata TEXT,
            sync_id TEXT,
            cloud_file_uuid TEXT,
            content_hash TEXT,
            last_synced_at TEXT,
            local_status TEXT NOT NULL DEFAULT 'active',
            FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
        )
        "#,
    )
    .execute(pool)
    .await
    .expect("Failed to create workspace_files table");

    // Create workspace_file_bookmarks table
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS workspace_file_bookmarks (
            id TEXT PRIMARY KEY NOT NULL,
            workspace_id TEXT NOT NULL,
            workspace_file_id TEXT NOT NULL,
            bookmark_page INTEGER NOT NULL,
            bookmark_description TEXT CHECK(length(bookmark_description) <= 50),
            date_created TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            metadata TEXT,
            FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
            FOREIGN KEY (workspace_file_id) REFERENCES workspace_files(id) ON DELETE CASCADE
        )
        "#,
    )
    .execute(pool)
    .await
    .expect("Failed to create workspace_file_bookmarks table");

    // Create ai_providers table
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS ai_providers (
            id TEXT PRIMARY KEY NOT NULL,
            name TEXT NOT NULL UNIQUE,
            created_at TEXT NOT NULL
        )
        "#,
    )
    .execute(pool)
    .await
    .expect("Failed to create ai_providers table");

    // Create ai_provider_keys table
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS ai_provider_keys (
            id TEXT PRIMARY KEY NOT NULL,
            provider_id TEXT NOT NULL,
            name TEXT NOT NULL,
            key TEXT NOT NULL,
            date_added TEXT NOT NULL,
            last_used_date TEXT,
            FOREIGN KEY (provider_id) REFERENCES ai_providers(id)
        )
        "#,
    )
    .execute(pool)
    .await
    .expect("Failed to create ai_provider_keys table");

    // Create ai_provider_models table
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS ai_provider_models (
            id TEXT PRIMARY KEY NOT NULL,
            provider_id TEXT NOT NULL,
            model_name TEXT NOT NULL,
            is_multimodal BOOLEAN NOT NULL DEFAULT 0,
            is_active BOOLEAN NOT NULL DEFAULT 1,
            metadata TEXT,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (provider_id) REFERENCES ai_providers(id) ON DELETE CASCADE
        )
        "#,
    )
    .execute(pool)
    .await
    .expect("Failed to create ai_provider_models table");

    // Create ai_agent_conversations table
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS ai_agent_conversations (
            id TEXT PRIMARY KEY NOT NULL,
            workspace_id TEXT NOT NULL,
            title TEXT NOT NULL,
            provider TEXT NOT NULL,
            model TEXT NOT NULL,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            last_accessed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            is_pinned BOOLEAN NOT NULL DEFAULT 0,
            is_archived BOOLEAN NOT NULL DEFAULT 0,
            is_active BOOLEAN NOT NULL DEFAULT 1,
            FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
        )
        "#,
    )
    .execute(pool)
    .await
    .expect("Failed to create ai_agent_conversations table");

    // Create ai_agent_conversation_messages table
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS ai_agent_conversation_messages (
            id TEXT PRIMARY KEY NOT NULL,
            conversation_id TEXT NOT NULL,
            role TEXT NOT NULL,
            content TEXT NOT NULL,
            images TEXT,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            sequence_number INTEGER NOT NULL,
            provider TEXT,
            model TEXT,
            input_tokens INTEGER,
            output_tokens INTEGER,
            FOREIGN KEY (conversation_id) REFERENCES ai_agent_conversations(id) ON DELETE CASCADE
        )
        "#,
    )
    .execute(pool)
    .await
    .expect("Failed to create ai_agent_conversation_messages table");

    // Create workspace_prompts table
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS workspace_prompts (
            id TEXT PRIMARY KEY NOT NULL,
            workspace_id TEXT NOT NULL,
            title TEXT NOT NULL,
            blocks TEXT NOT NULL DEFAULT '[]',
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
        )
        "#,
    )
    .execute(pool)
    .await
    .expect("Failed to create workspace_prompts table");

    // Create ai_agent_conversation_files table
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS ai_agent_conversation_files (
            id TEXT PRIMARY KEY NOT NULL,
            workspace_file_id TEXT,
            conversation_id TEXT NOT NULL,
            conversation_message_id TEXT NOT NULL,
            metadata TEXT NOT NULL,
            is_attachment BOOLEAN NOT NULL DEFAULT 0,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (workspace_file_id) REFERENCES workspace_files(id) ON DELETE SET NULL,
            FOREIGN KEY (conversation_id) REFERENCES ai_agent_conversations(id) ON DELETE CASCADE,
            FOREIGN KEY (conversation_message_id) REFERENCES ai_agent_conversation_messages(id) ON DELETE CASCADE
        )
        "#,
    )
    .execute(pool)
    .await
    .expect("Failed to create ai_agent_conversation_files table");
}
