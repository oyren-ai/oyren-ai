// Suppress warnings for unused code that may be used in future
#![allow(dead_code)]
#![allow(unused_imports)]

mod adapters;
mod commands;
mod config;
mod errors;
mod models;
mod services;
mod setup;
mod state;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let builder = tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_deep_link::init())
        .plugin(tauri_plugin_single_instance::init(setup::single_instance_plugin_config()))
        .manage(state::active_request::ActiveRequest::new())
        .invoke_handler(commands::register_commands())
        .setup(setup::app_setup_config());

    builder
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[cfg(test)]
#[path = "lib_test.rs"]
mod tests;