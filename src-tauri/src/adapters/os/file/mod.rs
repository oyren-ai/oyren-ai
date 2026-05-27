mod copy_file;
mod delete_file;
mod file_exists;
mod get_all_files;
mod get_file_metadata;
mod hash_file;
mod is_file;
mod read_file;
mod rename_file;
mod verify_file_exists;
mod write_file;

// Re-export functions so they can be called as adapters::os::file::function_name
pub use copy_file::copy_file;
pub use delete_file::delete_file;
pub use file_exists::file_exists;
pub use get_all_files::get_all_files;
pub use get_file_metadata::get_file_metadata;
pub use hash_file::hash_file;
pub use is_file::is_file;
pub use read_file::read_file;
pub use rename_file::rename_file;
pub use verify_file_exists::verify_file_exists;
pub use write_file::write_file;
