use crate::adapters::db::{repositories, sqlite, WorkspaceDisplay};

pub async fn list_workspaces_for_display() -> Result<Vec<WorkspaceDisplay>, String> {
    let pool = sqlite::get_db_pool()?;

    // Step 1: Get all workspaces
    let workspaces = repositories::workspace::get_all_workspaces(pool).await?;

    // Step 2: For each workspace, get file count and chat count, then build WorkspaceDisplay
    let mut workspace_displays = Vec::new();
    for workspace in workspaces {
        let files = repositories::workspace_files::list_workspace_files(&workspace.id).await?;
        
        // Count only PDF files (not markdown notes)
        let pdf_count = files
            .iter()
            .filter(|file| {
                file.file_name.to_lowercase().ends_with(".pdf")
            })
            .count();
        
        let chat_count = repositories::conversation::count_conversations_by_workspace(pool, &workspace.id).await?;

        workspace_displays.push(WorkspaceDisplay {
            id: workspace.id,
            name: workspace.name,
            description: workspace.description,
            created_at: workspace.created_at,
            updated_at: workspace.updated_at,
            last_accessed_at: workspace.last_accessed_at,
            is_pinned: workspace.is_pinned,
            is_archived: workspace.is_archived,
            is_favourite: workspace.is_favourite,
            settings: workspace.settings,
            is_active: workspace.is_active,
            document_count: pdf_count as i32,
            chat_count,
        });
    }

    Ok(workspace_displays)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::adapters::db::test_utils::init_test_db;
    use crate::services::workspace_service::create_workspace::create_workspace;
    use tempfile::TempDir;

    #[tokio::test]
    async fn test_list_workspaces_for_display_with_files() {
        init_test_db().await;
        let temp_dir = TempDir::new().unwrap();
        let pool = crate::adapters::db::sqlite::get_db_pool().unwrap();

        // Create workspace
        let workspace = create_workspace(temp_dir.path(), "Workspace With Files".to_string(), None)
            .await
            .unwrap();

        // Add 3 files
        for i in 1..=3 {
            sqlx::query(
                r#"
                INSERT INTO workspace_files (id, workspace_id, file_path, file_name, is_visible, is_read_only)
                VALUES (?, ?, ?, ?, 1, 1)
                "#,
            )
            .bind(format!("file-{}-{}", workspace.id, i))
            .bind(&workspace.id)
            .bind(format!("/path/to/file{}.pdf", i))
            .bind(format!("file{}.pdf", i))
            .execute(pool)
            .await
            .unwrap();
        }

        let result = list_workspaces_for_display().await;
        assert!(result.is_ok());
        let displays = result.unwrap();

        let test_ws = displays.iter().find(|w| w.id == workspace.id).unwrap();
        assert_eq!(test_ws.name, "Workspace With Files");
        assert_eq!(test_ws.document_count, 3);
        assert_eq!(test_ws.chat_count, 0);
    }

    #[tokio::test]
    async fn test_list_workspaces_for_display_multiple_workspaces() {
        init_test_db().await;
        let temp_dir = TempDir::new().unwrap();
        let pool = crate::adapters::db::sqlite::get_db_pool().unwrap();

        // Create workspace 1 with 2 files
        let ws1 = create_workspace(temp_dir.path(), "Workspace 1".to_string(), None)
            .await
            .unwrap();

        for i in 1..=2 {
            sqlx::query(
                r#"
                INSERT INTO workspace_files (id, workspace_id, file_path, file_name, is_visible, is_read_only)
                VALUES (?, ?, ?, ?, 1, 1)
                "#,
            )
            .bind(format!("ws1-file-{}-{}", ws1.id, i))
            .bind(&ws1.id)
            .bind(format!("/path/to/ws1-file{}.pdf", i))
            .bind(format!("ws1-file{}.pdf", i))
            .execute(pool)
            .await
            .unwrap();
        }

        // Create workspace 2 with no files
        let ws2 = create_workspace(temp_dir.path(), "Workspace 2".to_string(), None)
            .await
            .unwrap();

        let result = list_workspaces_for_display().await;
        assert!(result.is_ok());
        let displays = result.unwrap();

        let ws1_display = displays.iter().find(|w| w.id == ws1.id).unwrap();
        let ws2_display = displays.iter().find(|w| w.id == ws2.id).unwrap();

        assert_eq!(ws1_display.document_count, 2);
        assert_eq!(ws2_display.document_count, 0);
    }

    #[tokio::test]
    async fn test_list_workspaces_for_display_with_conversations() {
        init_test_db().await;
        let temp_dir = TempDir::new().unwrap();
        let pool = crate::adapters::db::sqlite::get_db_pool().unwrap();

        // Create workspace with 2 files and 3 conversations
        let workspace = create_workspace(temp_dir.path(), "Workspace With Chats".to_string(), None)
            .await
            .unwrap();

        // Add 2 files
        for i in 1..=2 {
            sqlx::query(
                r#"
                INSERT INTO workspace_files (id, workspace_id, file_path, file_name, is_visible, is_read_only)
                VALUES (?, ?, ?, ?, 1, 1)
                "#,
            )
            .bind(format!("file-{}-{}", workspace.id, i))
            .bind(&workspace.id)
            .bind(format!("/path/to/file{}.pdf", i))
            .bind(format!("file{}.pdf", i))
            .execute(pool)
            .await
            .unwrap();
        }

        // Add 3 conversations
        for i in 1..=3 {
            use crate::adapters::db::models::workspace_chats::CreateConversationRequest;
            use crate::adapters::db::repositories::conversation::create_conversation;
            let request = CreateConversationRequest {
                workspace_id: workspace.id.clone(),
                title: format!("Chat {}", i),
                provider: "gemini".to_string(),
                model: "gemini-2.5-flash".to_string(),
            };
            create_conversation(pool, request).await.unwrap();
        }

        let result = list_workspaces_for_display().await;
        assert!(result.is_ok());
        let displays = result.unwrap();

        let test_ws = displays.iter().find(|w| w.id == workspace.id).unwrap();
        assert_eq!(test_ws.name, "Workspace With Chats");
        assert_eq!(test_ws.document_count, 2);
        assert_eq!(test_ws.chat_count, 3);
    }

    #[tokio::test]
    async fn test_list_workspaces_counts_only_pdfs_not_markdown() {
        init_test_db().await;
        let temp_dir = TempDir::new().unwrap();
        let pool = crate::adapters::db::sqlite::get_db_pool().unwrap();

        // Create workspace
        let workspace = create_workspace(temp_dir.path(), "Mixed Files Workspace".to_string(), None)
            .await
            .unwrap();

        // Add 2 PDF files
        for i in 1..=2 {
            sqlx::query(
                r#"
                INSERT INTO workspace_files (id, workspace_id, file_path, file_name, is_visible, is_read_only)
                VALUES (?, ?, ?, ?, 1, 1)
                "#,
            )
            .bind(format!("pdf-{}-{}", workspace.id, i))
            .bind(&workspace.id)
            .bind(format!("/path/to/document{}.pdf", i))
            .bind(format!("document{}.pdf", i))
            .execute(pool)
            .await
            .unwrap();
        }

        // Add 3 markdown notes (should not be counted)
        for i in 1..=3 {
            sqlx::query(
                r#"
                INSERT INTO workspace_files (id, workspace_id, file_path, file_name, is_visible, is_read_only)
                VALUES (?, ?, ?, ?, 1, 1)
                "#,
            )
            .bind(format!("note-{}-{}", workspace.id, i))
            .bind(&workspace.id)
            .bind(format!("/path/to/note{}.md", i))
            .bind(format!("note{}.md", i))
            .execute(pool)
            .await
            .unwrap();
        }

        let result = list_workspaces_for_display().await;
        assert!(result.is_ok());
        let displays = result.unwrap();

        let test_ws = displays.iter().find(|w| w.id == workspace.id).unwrap();
        assert_eq!(test_ws.name, "Mixed Files Workspace");
        // Should only count PDFs (2), not markdown files (3)
        assert_eq!(test_ws.document_count, 2);
        assert_eq!(test_ws.chat_count, 0);
    }
}
