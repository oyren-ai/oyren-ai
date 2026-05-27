pub mod create_workspace;
pub mod delete_workspace;
pub mod get_workspace;
pub mod list_workspace_for_display;
pub mod list_workspaces;
pub mod update_workspace;

// Re-export functions so they can be called as services::workspace::function_name
pub use create_workspace::create_workspace;
pub use delete_workspace::delete_workspace;
pub use get_workspace::get_workspace;
pub use list_workspace_for_display::list_workspaces_for_display;
pub use list_workspaces::list_workspaces;
pub use update_workspace::update_workspace;

use crate::adapters::db::{
    models::{CreateWorkspaceRequest, UpdateWorkspaceRequest, Workspace},
    repositories, sqlite, WorkspaceDisplay,
};
