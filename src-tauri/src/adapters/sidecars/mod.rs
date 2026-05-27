// Sidecar adapters: Communicate with external sidecar processes
// Each sidecar runs as a separate process and communicates via stdin/stdout or command line args

mod executor;

pub mod ai_agent;

// Re-export generic executor and constants for use by sidecar adapters
pub(crate) use executor::{execute_sidecar, execute_ai_agent_sidecar, OYREN_AI_AGENT_SIDECAR};
