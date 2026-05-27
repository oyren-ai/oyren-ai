use crate::errors::{AiServiceError, SidecarError, SidecarErrorType};
use std::io::Write;
use tauri::AppHandle;
use tauri_plugin_shell::ShellExt;
use uuid::Uuid;

/// Sidecar name type - must match names in tauri.conf.json
pub type SidecarName = &'static str;

/// Oyren AI Agent sidecar - handles AI provider requests
pub const OYREN_AI_AGENT_SIDECAR: SidecarName = "oyren-ai-agent-sidecar";

/// Generic sidecar executor that can run any sidecar process
///
/// Pure functional approach: takes inputs, returns Result<Success, Error>
///
/// # Arguments
/// * `app` - Tauri AppHandle for accessing shell functionality
/// * `sidecar_name` - Name constant (use OYREN_AI_AGENT_SIDECAR)
/// * `args` - Command line arguments to pass to the sidecar
///
/// # Returns
/// * `Result<String, AiServiceError>` - stdout on success, error on failure
///
/// # Example
/// ```ignore
/// let output = execute_sidecar(&app, OYREN_AI_AGENT_SIDECAR, &[json_request]).await?;
/// ```
///
/// # Coverage
/// Excluded from coverage - thin wrapper around Tauri shell API, tested via integration tests
pub async fn execute_sidecar<R: tauri::Runtime>(
    app: &AppHandle<R>,
    sidecar_name: SidecarName,
    args: &[&str],
) -> Result<String, AiServiceError> {
    let sidecar_command = app
        .shell()
        .sidecar(sidecar_name)
        .map_err(|e| AiServiceError::InvalidInput {
            message: format!("Failed to locate {} sidecar: {}", sidecar_name, e),
        })?
        .args(args);

    let output = sidecar_command
        .output()
        .await
        .map_err(|e| AiServiceError::InvalidInput {
            message: format!("Sidecar {} execution failed: {}", sidecar_name, e),
        })?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(AiServiceError::InvalidInput {
            message: format!(
                "{} sidecar failed with exit code {}: {}",
                sidecar_name,
                output.status.code().unwrap_or(-1),
                stderr
            ),
        });
    }

    Ok(String::from_utf8_lossy(&output.stdout).to_string())
}

pub async fn execute_ai_agent_sidecar<R: tauri::Runtime>(
    app: &AppHandle<R>,
    request_id: String,
    json_payload: &str,
    active_request: &crate::state::active_request::ActiveRequest,
) -> Result<String, AiServiceError> {
    // Write payload to temp file to avoid Windows cmd line length limits
    let temp_dir = std::env::temp_dir();
    let temp_file_name = format!("oyren_ai_request_{}.json", Uuid::new_v4());
    let temp_file_path = temp_dir.join(&temp_file_name);
    
    tracing::debug!("[execute_ai_agent_sidecar] Request {}: Writing payload to temp file: {:?}, size: {} bytes", 
        request_id, temp_file_path, json_payload.len());
    
    // Write JSON to temp file
    let mut file = std::fs::File::create(&temp_file_path)
        .map_err(|e| AiServiceError::InvalidInput {
            message: format!("Failed to create temp file: {}", e),
        })?;
    
    file.write_all(json_payload.as_bytes())
        .map_err(|e| AiServiceError::InvalidInput {
            message: format!("Failed to write to temp file: {}", e),
        })?;
    
    drop(file); // Ensure file is closed before sidecar reads it
    
    // Spawn sidec process (non-blocking)
    let temp_path_str = temp_file_path.to_string_lossy().to_string();
    let (mut rx, child) = app
        .shell()
        .sidecar(OYREN_AI_AGENT_SIDECAR)
        .map_err(|e| AiServiceError::InvalidInput {
            message: format!("Failed to locate {} sidecar: {}", OYREN_AI_AGENT_SIDECAR, e),
        })?
        .args(&["--file", &temp_path_str])
        .spawn()
        .map_err(|e| AiServiceError::InvalidInput {
            message: format!("Sidecar {} spawn failed: {}", OYREN_AI_AGENT_SIDECAR, e),
        })?;
    
    tracing::info!("🚀 Request {}: Sidecar process spawned, PID: {}", request_id, child.pid());
    
    // Register process for cancellation
    active_request.register(request_id.clone(), child).await;
    
    // Note: We need to take the child back from ActiveRequest to call .write()
    // The limitation is that reading output is blocking, but cancel_ai_request can still kill the process
    let _child_handle = {
        let mut current = active_request.current.write().await;
        current.take().map(|(_, c)| c)
    }.ok_or_else(|| AiServiceError::InvalidInput {
        message: "Process was cancelled".to_string(),
    })?;
    
    // Wait for process events and collect output
    let mut stdout_output = String::new();
    let mut stderr_output = String::new();
    let mut exit_code = None;
    
    while let Some(event) = rx.recv().await {
        match event {
            tauri_plugin_shell::process::CommandEvent::Stdout(data) => {
                stdout_output.push_str(&String::from_utf8_lossy(&data));
            }
            tauri_plugin_shell::process::CommandEvent::Stderr(data) => {
                stderr_output.push_str(&String::from_utf8_lossy(&data));
            }
            tauri_plugin_shell::process::CommandEvent::Terminated(payload) => {
                exit_code = payload.code;
                break;
            }
            _ => {}
        }
    }
    
    
    // Check all output was read and process exited successfully
    if exit_code != Some(0) {
        let stderr = String::from_utf8_lossy(stderr_output.as_bytes()).to_string();

        // If stderr is empty but stdout has content, try to extract error from stdout
        let error_source = if stderr.trim().is_empty() && !stdout_output.trim().is_empty() {
            extract_error_from_stdout(&stdout_output).unwrap_or(stderr)
        } else {
            stderr
        };

        // Detect error type and generate helpful suggestions
        let error_type = detect_sidecar_error_type(&error_source, exit_code);
        let suggestions = generate_suggestions(&error_type, json_payload.len());
        
        let sidecar_error = SidecarError {
            error_type: error_type.clone(),
            exit_code: exit_code.unwrap_or(-1),
            stderr: error_source.clone(),
            temp_file_path: temp_file_path.to_string_lossy().to_string(),
            payload_size: json_payload.len(),
            suggestions,
        };

        tracing::error!(
            "[execute_ai_agent_sidecar] ❌ Request {}: Sidecar failed\n\
             Error Type: {:?}\n\
             Exit Code: {}\n\
             Payload Size: {} bytes ({} KB)\n\
             Temp File: {:?}\n\
             Error Details: {}",
            request_id,
            sidecar_error.error_type,
            sidecar_error.exit_code,
            sidecar_error.payload_size,
            sidecar_error.payload_size / 1024,
            temp_file_path,
            if error_source.len() > 200 {
                format!("{}... (truncated)", &error_source[..200])
            } else {
                error_source.clone()
            }
        );
        
        return Err(AiServiceError::SidecarExecutionFailed { 
            details: sidecar_error 
        });
    }
    
    
    tracing::info!("✅ Request {}: Sidecar completed successfully", request_id);
    
    // Unregister after completion
    active_request.complete(&request_id).await;
    
    // Clean up temp file
    if let Err(e) = std::fs::remove_file(&temp_file_path) {
        tracing::warn!("[execute_ai_agent_sidecar] Failed to delete temp file: {}", e);
    }
    
    Ok(stdout_output)
}

/// Detect the type of sidecar error based on stderr content and exit code
fn detect_sidecar_error_type(stderr: &str, exit_code: Option<i32>) -> SidecarErrorType {
    let stderr_lower = stderr.to_lowercase();
    
    // Check for specific error patterns
    if stderr_lower.contains("failed to read input file") || 
       stderr_lower.contains("no such file") ||
       stderr_lower.contains("cannot find the file") ||
       stderr_lower.contains("file not found") {
        SidecarErrorType::FileReadError
    } else if stderr_lower.contains("permission denied") || 
              stderr_lower.contains("access denied") ||
              stderr_lower.contains("access is denied") {
        SidecarErrorType::PermissionDenied
    } else if exit_code == Some(130) || exit_code == Some(137) || exit_code == Some(143) {
        // 130 = Ctrl+C, 137 = SIGKILL, 143 = SIGTERM
        SidecarErrorType::ProcessKilled
    } else if stderr_lower.contains("timeout") ||
              stderr_lower.contains("timed out") {
        SidecarErrorType::Timeout
    } else if stderr_lower.contains("payload too large") ||
              stderr_lower.contains("request entity too large") {
        SidecarErrorType::PayloadTooLarge
    } else {
        SidecarErrorType::Unknown
    }
}

/// Generate helpful suggestions based on error type and context
fn generate_suggestions(error_type: &SidecarErrorType, payload_size: usize) -> Vec<String> {
    let mut suggestions = Vec::new();
    
    match error_type {
        SidecarErrorType::FileReadError => {
            suggestions.push("Check if your antivirus software is blocking the application".to_string());
            suggestions.push("Ensure you have enough free disk space in your temporary directory".to_string());
            if payload_size > 100_000 {
                suggestions.push(format!(
                    "Your request is large ({} KB). Try using smaller PDF sections or take screenshots of specific pages instead",
                    payload_size / 1024
                ));
            }
            suggestions.push("Try restarting the application".to_string());
        },
        SidecarErrorType::PermissionDenied => {
            suggestions.push("Try running the application as administrator".to_string());
            suggestions.push("Check Windows Defender settings and add an exception for Oyren".to_string());
            suggestions.push("Verify temp directory permissions (usually C:\\Users\\YourName\\AppData\\Local\\Temp)".to_string());
            suggestions.push("If using a work computer, contact your IT department about application permissions".to_string());
        },
        SidecarErrorType::ProcessKilled => {
            suggestions.push("Your antivirus might be terminating the AI agent process".to_string());
            suggestions.push("Add oyren-ai-agent-sidecar.exe to your antivirus whitelist".to_string());
            suggestions.push("Check if Windows Defender SmartScreen is blocking the process".to_string());
        },
        SidecarErrorType::Timeout => {
            if payload_size > 200_000 {
                suggestions.push(format!(
                    "The request is very large ({} KB). Try breaking it into smaller parts",
                    payload_size / 1024
                ));
            }
            suggestions.push("Check your internet connection if using cloud AI providers".to_string());
            suggestions.push("Use PDF screenshots for specific sections instead of entire file contents".to_string());
        },
        SidecarErrorType::PayloadTooLarge => {
            suggestions.push(format!(
                "Your request ({} KB) exceeds system limits. Use screenshots of specific pages instead",
                payload_size / 1024
            ));
            suggestions.push("Remove unnecessary file attachments from your message".to_string());
            suggestions.push("Split your question into multiple smaller requests".to_string());
        },
        SidecarErrorType::Unknown => {
            suggestions.push("Try restarting the application".to_string());
            suggestions.push("Check the application logs for more details".to_string());
            if payload_size > 500_000 {
                suggestions.push("Your request size is very large. This might be causing issues".to_string());
            }
            suggestions.push("Report this issue on GitHub with the error details: https://github.com/oyren-ai/oyren-ai-tauri/issues".to_string());
        },
    }
    
    suggestions
}

/// Try to extract an error description from stdout JSON when stderr is empty.
/// Returns a human-readable error string if stdout contains parseable error info.
fn extract_error_from_stdout(stdout: &str) -> Option<String> {
    let parsed: serde_json::Value = serde_json::from_str(stdout).ok()?;
    let error = parsed.get("error")?;

    match error {
        serde_json::Value::String(s) => Some(s.clone()),
        serde_json::Value::Object(obj) => {
            let message = obj.get("message").and_then(|v| v.as_str());
            let error_type = obj.get("errorType").and_then(|v| v.as_str());
            match (error_type, message) {
                (Some(t), Some(m)) => Some(format!("{}: {}", t, m)),
                (None, Some(m)) => Some(m.to_string()),
                (Some(t), None) => Some(t.to_string()),
                (None, None) => None,
            }
        }
        _ => None,
    }
}
