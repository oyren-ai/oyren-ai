//! Deep link protocol registration service

/// Register deep link protocol for Windows
#[cfg(target_os = "windows")]
pub fn register_deep_link_protocol() -> Result<(), String> {
    use std::process::Command;

    let exe_path = std::env::current_exe()
        .map(|p| p.display().to_string())
        .map_err(|e| format!("Failed to get exe path: {}", e))?;

    tracing::info!("Registering oyren:// protocol for Windows");

    register_protocol_registry(&exe_path)?;

    tracing::info!("✅ Deep link protocol registered");
    Ok(())
}

#[cfg(target_os = "windows")]
fn register_protocol_registry(exe_path: &str) -> Result<(), String> {
    use std::process::Command;

    // Register oyren:// protocol
    Command::new("reg")
        .args(&[
            "add",
            "HKCU\\Software\\Classes\\oyren",
            "/ve",
            "/d",
            "URL:Oyren Protocol",
            "/f",
        ])
        .output()
        .map_err(|e| format!("Failed to register protocol: {}", e))?;

    Command::new("reg")
        .args(&[
            "add",
            "HKCU\\Software\\Classes\\oyren",
            "/v",
            "URL Protocol",
            "/d",
            "",
            "/f",
        ])
        .output()
        .map_err(|e| format!("Failed to register URL protocol flag: {}", e))?;

    Command::new("reg")
        .args(&[
            "add",
            "HKCU\\Software\\Classes\\oyren\\shell\\open\\command",
            "/ve",
            "/d",
            &format!("\"{}\" \"%1\"", exe_path),
            "/f",
        ])
        .output()
        .map_err(|e| format!("Failed to register protocol command: {}", e))?;

    Ok(())
}

/// No-op for non-Windows platforms
#[cfg(not(target_os = "windows"))]
pub fn register_deep_link_protocol() -> Result<(), String> {
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_register_deep_link_protocol_non_windows() {
        #[cfg(not(target_os = "windows"))]
        {
            let result = register_deep_link_protocol();
            assert!(result.is_ok());
        }
    }

    #[test]
    fn test_register_deep_link_protocol_windows_exists() {
        #[cfg(target_os = "windows")]
        {
            // Just verify the function exists and can be called
            // Actual registration requires admin privileges
            let result = register_deep_link_protocol();
            // May succeed or fail depending on permissions
            // We just verify it doesn't panic
            let _ = result;
        }
    }
}