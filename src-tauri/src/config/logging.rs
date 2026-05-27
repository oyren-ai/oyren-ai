use std::fs;
use std::path::PathBuf;

use tracing_subscriber::{fmt, EnvFilter};

pub struct Logger {
    folder: PathBuf,
}

impl Logger {
    /// Create logger with logs folder (inside app_data_dir)
    pub fn new(app_data_dir: &PathBuf) -> Self {
        let folder = app_data_dir.join("logs");
        fs::create_dir_all(&folder).ok();
        Self { folder }
    }

    pub fn init(&self) {
        //TODO: make the logger dynamic, so it only logs debug in the development mode
        let filter = EnvFilter::try_from_default_env().unwrap_or_else(|_| EnvFilter::new("info"));

        let subscriber = fmt()
            .with_env_filter(filter)
            .with_thread_ids(true)
            .with_thread_names(true)
            .with_file(true)
            .with_line_number(true)
            .with_target(true)
            // .with_ansi(true)
            // .compact()
            .finish();

        if tracing::subscriber::set_global_default(subscriber).is_err() {
            eprintln!("Global logger already initialized, skipping setup");
        }
        tracing::info!("Logger initialized");
    }
}

pub fn log_line_separator() {
    println!("{}", "-".repeat(80));
}

pub fn log_separator() {
    println!("{}", "=".repeat(80));
}
