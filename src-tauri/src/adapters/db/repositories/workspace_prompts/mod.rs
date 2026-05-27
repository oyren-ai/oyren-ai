pub mod create;
pub mod delete;
pub mod get_by_id;
pub mod list_by_workspace;
pub mod update;

pub use create::create_workspace_prompt;
pub use delete::delete_workspace_prompt;
pub use get_by_id::get_workspace_prompt_by_id;
pub use list_by_workspace::list_workspace_prompts_by_workspace;
pub use update::update_workspace_prompt;
