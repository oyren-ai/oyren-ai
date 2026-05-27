# AI Agent Sidecar

A standalone Deno-based TypeScript executable for AI agent functionality in the Oyren AI Tauri application.

## Purpose

This sidecar provides AI agent capabilities as a separate process that can be invoked from the main Tauri application. It supports multiple AI providers (Gemini, DeepSeek, Ollama) with three main operations: chat, model detection, and connection testing.

## Requirements

### For Building
- **Deno** (latest version)
- **Node.js** (for rename script)

### For End Users
- No dependencies (compiled to standalone executable)

## Features

- **Multi-Provider Support**: Works with Gemini, DeepSeek, and Ollama
- **Three Operations**:
  - `chat`: Send messages with conversation history
  - `detect-models`: List available models (Ollama only)
  - `test-connection`: Test provider connectivity
- **Built with LangChain.js**: Leverages LangChain for unified AI provider interface

## Usage

### 1. Chat Operation

Send a message to an AI provider with optional conversation history.

```bash
./ai-agent '{
  "operation": "chat",
  "message": "Hello, how are you?",
  "aiProvider": {
    "provider": "ollama",
    "apiKey": ""
  },
  "conversationHistory": [],
  "model": "deepseek-r1:8b",
  "temperature": 0.7,
  "maxTokens": 2000
}'
```

**Response**:
```json
{
  "data": {
    "response": "I'm doing well, thank you! How can I assist you today?"
  },
  "error": null
}
```

**Supported Providers**:
- `ollama`: Local Ollama instance (no API key required)
- `gemini`: Google Gemini (requires API key)
- `deepseek`: DeepSeek (requires API key)

### 2. Detect Models Operation

List all available models from Ollama.

```bash
./ai-agent '{
  "operation": "detect-models",
  "provider": "ollama"
}'
```

**Response**:
```json
{
  "data": {
    "models": [
      {
        "name": "deepseek-r1:8b",
        "size": 4920738407,
        "modified_at": "2025-03-08T00:32:51.080410984Z"
      }
    ]
  },
  "error": null
}
```

### 3. Test Connection Operation

Test connectivity to an AI provider.

```bash
./ai-agent '{
  "operation": "test-connection",
  "aiProvider": {
    "provider": "ollama",
    "apiKey": ""
  },
  "model": "deepseek-r1:8b"
}'
```

**Response**:
```json
{
  "data": {
    "success": true,
    "provider": "ollama",
    "model": "deepseek-r1:8b",
    "message": "Connection successful"
  },
  "error": null
}
```

### Input/Output Format

All operations use JSON input via command-line argument and return JSON to stdout.

**Success Response**:
```json
{
  "data": { /* operation-specific data */ },
  "error": null
}
```

**Error Response**:
```json
{
  "data": null,
  "error": "Error message here"
}
```

## Building

### Prerequisites

1. Install Deno:
```bash
# macOS
brew install deno

# Or use curl
curl -fsSL https://deno.land/install.sh | sh
```

### Build Commands

```bash
# Build the sidecar binary
pnpm run build

# Or directly with Deno (if in PATH)
deno compile --no-check --allow-all --output ai-agent index.ts
node rename.js

# Or with full Deno path
~/.deno/bin/deno compile --no-check --allow-all --output ai-agent index.ts
node rename.js
```

**Note**: Uses `--no-check` flag to skip TypeScript type checking during compilation.

The binary will be created and moved to `../../src-tauri/binaries/ai-agent-<target-triple>`

## Testing

### Test the script directly
```bash
pnpm run test

# Or manually with Deno
~/.deno/bin/deno run --allow-all index.ts '{"message":"test"}'
```

### Test the compiled binary
```bash
# Build first
pnpm run build

# Test the binary
../../src-tauri/binaries/ai-agent-aarch64-apple-darwin '{"message":"test message"}'
```

**Expected output**:
```json
{"response":"hello world: test message"}
```

## Integration with Tauri

The Tauri app spawns the sidecar with JSON as command-line argument:

```rust
use tauri_plugin_shell::ShellExt;

let request_json = r#"{"message":"your message"}"#;
let output = app
    .shell()
    .sidecar("ai-agent")
    .args([request_json])  // Pass JSON as argument
    .output()
    .await?;

let response = String::from_utf8_lossy(&output.stdout);
// response contains: {"response":"hello world: your message"}
```

## Architecture

```
┌─────────────────────────────────────┐
│   Tauri App (Rust + TypeScript)     │
└────────────┬────────────────────────┘
             │ spawns sidecar
             ▼
┌─────────────────────────────────────┐
│   AI Agent Sidecar (Deno)           │
│   - index.ts (entry point)          │
│   - Receives JSON via CLI args      │
│   - Returns JSON via stdout         │
└─────────────────────────────────────┘
```

## Project Structure

```
ai-agent-sidecar/
├── index.ts          # Entry point (I/O handling)
├── agent.ts          # Core routing and operation handling
├── agent_test.ts     # Unit tests
├── providers/        # AI provider implementations
│   ├── ollama.ts     # Ollama chat, detection, testing
│   ├── gemini.ts     # Google Gemini integration
│   └── deepseek.ts   # DeepSeek integration
├── types/            # TypeScript type definitions
│   ├── AgentRequest.ts          # Union of all request types
│   ├── AiProvider.ts            # Provider configuration
│   ├── ChatResponse.ts          # Chat operation response
│   ├── ConversationMessage.ts   # Message history format
│   ├── DetectModelsRequest.ts   # Model detection request
│   ├── DetectModelsResponse.ts  # Model detection response
│   ├── TestConnectionRequest.ts # Connection test request
│   ├── TestConnectionResponse.ts# Connection test response
│   ├── SidecarError.ts          # Error type
│   └── SidecarResponse.ts       # Monadic response wrapper
├── deno.json         # Deno configuration + LangChain imports
├── package.json      # Build and test scripts
├── rename.js         # Renames binary to Tauri format
└── README.md         # This file
```

## Testing

### Run Tests

```bash
# Run all tests
pnpm test

# Run tests with coverage
pnpm run test:coverage

# Watch mode (auto-run on file changes)
pnpm run test:watch

# Generate coverage report
pnpm run coverage:report
```

### Coverage Configuration

- **Excluded from coverage**: `types/` directory, test files, `node_modules/`
- **Target**: 100% coverage for business logic
- **Current coverage**: 100% for `agent.ts`

### Test Structure

Tests are located in `agent_test.ts` and cover:
- ✅ Validation errors (missing fields)
- ✅ Error scenarios (test_error_scenario)
- ✅ Success cases with full config
- ✅ Default value handling
- ✅ API key truncation
- ✅ Response formatting

## Security

⚠️ **NEVER log request or response data** - contains sensitive API keys and user messages.

Only use `console.log` for structured stdout/stderr output.

## Monadic Response Pattern

Uses `SidecarResponse<T, E>` for functional error handling:

```typescript
type SidecarResponse<T, E> =
  | { success: true; data: T }
  | { success: false; error: E };
```

Pattern matching ensures type-safe error handling without exceptions.

## Dependencies

Built with LangChain.js ecosystem:
- `@langchain/core`: Core LangChain functionality
- `@langchain/ollama`: Ollama integration
- `@langchain/google-genai`: Google Gemini integration
- `@langchain/openai`: OpenAI-compatible API (used for DeepSeek)

Dependencies are automatically managed via Deno's npm imports.

## Future Enhancements

- ✅ Multiple AI provider support (Gemini, DeepSeek, Ollama)
- ✅ Conversation history support
- ✅ Connection testing
- ✅ Local model detection (Ollama)
- 🔲 Implement tool calling/function use
- 🔲 Add streaming support
- 🔲 Add more providers (Anthropic, OpenAI, etc.)
- 🔲 Support for multimodal inputs (images)