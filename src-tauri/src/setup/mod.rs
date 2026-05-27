mod app_setup_config;
mod deep_link;
mod init_logger;
mod init_database;
mod init_devtools;
mod process_initial_deep_links;
mod register_deep_link_callback;
mod register_platform_deep_links;
pub(crate) mod seed_ai_models;
mod setup_app;
mod single_instance;

pub use app_setup_config::app_setup_config;
pub use deep_link::setup_deep_link_handlers;
pub use setup_app::setup_app;
pub use single_instance::single_instance_plugin_config;
