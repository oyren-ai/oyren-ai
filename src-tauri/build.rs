fn main() {
    // Skip Tauri build during tests to avoid GUI DLL linking issues
    // RUST_TEST_THREADS is set by cargo test
    if std::env::var("RUST_TEST_THREADS").is_err() {
        tauri_build::build()
    }
}
