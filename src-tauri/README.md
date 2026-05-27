# Oyren Desktop - Rust Backend Architecture

This document describes the architecture and structure of the Rust backend for the Oyren Desktop application, built with Tauri framework.

## 🏗️ Architecture Overview

The Rust backend follows a **layered functional architecture** with clear separation of concerns:

```
┌─────────────────┐
│   Tauri Layer   │  ← Entry points (main.rs, lib.rs)
├─────────────────┤
│  Commands Layer │  ← Tauri command handlers (commands.rs)
├─────────────────┤
│ Services Layer  │  ← Business logic (services/)
├─────────────────┤
│ Adapters Layer  │  ← External integrations (adapters/)
├─────────────────┤
│  Models Layer   │  ← Shared data structures (models/)
└─────────────────┘
    │
    Configuration (config.rs) & Error Handling (errors.rs)
```

## 📁 Directory Structure

```
src/
├── main.rs                 # Application entry point
├── lib.rs                  # Library exports and Tauri setup
├── config.rs              # Configuration constants
├── errors.rs              # Layered error types and conversions
├── commands.rs             # Tauri command handlers
├── commands_test.rs        # Command layer tests
├── lib_test.rs            # Library tests
│
├── models/                 # Shared data models
│   ├── mod.rs             # Re-exports
│   └── ai.rs              # AI provider enums
│
├── services/              # Business logic layer
│   ├── mod.rs             # Service exports
│   ├── ai/                # AI-related services
│   │   ├── mod.rs         # AI service exports
│   │   ├── chat.rs        # Chat processing service
│   │   ├── chat_test.rs   # Chat service tests
│   │   ├── health_check.rs # Connection testing service
│   │   └── health_check_test.rs # Health check tests
│   └── document/          # Document processing services
│       ├── mod.rs         # Document service exports
│       ├── pdf.rs         # PDF processing service
│       └── pdf_test.rs    # PDF service tests
│
└── adapters/              # External integration layer
    ├── mod.rs             # Adapter exports
    ├── ai/                # AI provider adapters
    │   ├── deepseek/      # DeepSeek API integration
    │   │   ├── mod.rs     # DeepSeek adapter
    │   │   ├── adapter_test.rs # Adapter tests
    │   │   ├── client.rs  # HTTP client
    │   │   ├── client_test.rs # Client tests
    │   │   └── models/    # DeepSeek-specific models
    │   │       ├── mod.rs # Model exports
    │   │       ├── error.rs    # Error types
    │   │       ├── message.rs  # Message types
    │   │       ├── request.rs  # Request types
    │   │       ├── response.rs # Response types
    │   │       └── tool.rs     # Tool calling types
    │   └── gemini/        # Gemini API integration
    │       ├── mod.rs     # Gemini adapter
    │       ├── adapter_test.rs # Adapter tests
    │       ├── client.rs  # HTTP client
    │       ├── client_test.rs # Client tests
    │       └── models/    # Gemini-specific models
    │           ├── mod.rs # Model exports
    │           ├── error.rs    # Error types
    │           ├── message.rs  # Message types
    │           ├── request.rs  # Request types
    │           ├── response.rs # Response types
    │           └── tool.rs     # Tool calling types
    └── os/                # Operating system adapters
        ├── mod.rs         # OS adapter exports
        ├── file.rs        # File system operations
        └── file_test.rs   # File adapter tests
```

## 🔄 Data Flow Architecture

### Request Flow
```
Frontend → Tauri Commands → Services → Adapters → External APIs/OS
   ↑                                        ↓
   └── Response ← Error Handling ← Results ←┘
```

### Layer Responsibilities

#### 1. **Commands Layer** (`commands.rs`)
- **Purpose**: Thin Tauri command wrappers
- **Responsibilities**:
  - Receive requests from frontend
  - Delegate to appropriate services
  - Convert service errors to user-friendly strings
  - Return results to frontend
- **Key Functions**:
  - `ai_chat()` - Process AI chat requests
  - `test_gemini_connection()` - Test API connectivity
  - `read_pdf_file()` - Read PDF file bytes
  - `process_pdf_file()` - Extract PDF content
  - `search_pdf_text()` - Search within PDF content

#### 2. **Services Layer** (`services/`)
- **Purpose**: Core business logic and orchestration
- **Characteristics**:
  - Pure functional approach (no OOP)
  - Stateless operations
  - Provider-agnostic logic

##### AI Services (`services/ai/`)
- **Chat Service** (`chat.rs`):
  - Provider routing (Gemini vs DeepSeek)
  - Model validation and mapping
  - Image support checking
  - Request preprocessing
- **Health Check Service** (`health_check.rs`):
  - API connectivity testing
  - Provider-specific health checks

##### Document Services (`services/document/`)
- **PDF Service** (`pdf.rs`):
  - PDF reading and validation
  - Text extraction and cleaning
  - Content chunking for AI processing
  - Search functionality with context

#### 3. **Adapters Layer** (`adapters/`)
- **Purpose**: External system integrations
- **Characteristics**:
  - Provider-specific implementations
  - HTTP clients and API wrappers
  - Error mapping and handling

##### AI Adapters (`adapters/ai/`)
- **Gemini Adapter** (`ai/gemini/`):
  - Google Gemini API integration
  - Support for multiple models (Flash, Pro)
  - Image and multimodal support
  - Rate limiting and error handling
- **DeepSeek Adapter** (`ai/deepseek/`):
  - DeepSeek API integration
  - Text-only processing (no images)
  - OpenAI-compatible API format

##### OS Adapters (`adapters/os/`)
- **File Adapter** (`os/file.rs`):
  - File system operations
  - Path validation and security
  - Metadata extraction

#### 4. **Models Layer** (`models/`)
- **Purpose**: Shared data structures
- **AI Models** (`ai.rs`):
  - Provider enums (GeminiModel, DeepSeekModel)
  - Model capability definitions

## ⚠️ Error Handling Strategy

### Layered Error Architecture
```rust
// Each layer has its own error type
pub enum CommandError     // Commands layer
pub enum AiServiceError   // AI services layer
pub enum PdfServiceError  // PDF services layer
pub enum FileError        // File adapter layer
pub enum GeminiError      // Gemini adapter layer
pub enum DeepSeekError    // DeepSeek adapter layer
```

### Functional Error Conversion
- **Explicit conversion functions** (not `From` trait)
- **Functional style**: `adapter_error_to_service_error()`
- **Context preservation**: Errors maintain detailed context through layers
- **User-friendly messages**: Top layer converts to readable strings

### Error Flow Example
```rust
FileError::NotFound → file_error_to_pdf_service_error()
→ PdfServiceError::FileError → pdf_service_error_to_string()
→ "PDF file not found: /path/to/file.pdf"
```

## 🔧 Configuration Management

### Centralized Constants (`config.rs`)
- **API Endpoints**: Base URLs and versions
- **AI Parameters**: Default temperature, max tokens
- **PDF Processing**: Context lines, page dimensions
- **HTTP Settings**: Timeouts, retry policies
- **Error Messages**: Standardized user messages

### Benefits
- Single source of truth for configuration
- Easy maintenance and updates
- Consistent behavior across modules
- Test-friendly (constants can be overridden)

## 🧪 Testing Strategy

### Test Organization
- **Separate test files**: All tests in `*_test.rs` files
- **Comprehensive coverage**: 123 tests covering happy and error paths
- **Layer-specific testing**: Each layer has focused test suites

### Test Categories
1. **Unit Tests**: Individual function testing
2. **Integration Tests**: Cross-layer interaction testing
3. **Error Path Tests**: Comprehensive error scenario coverage
4. **Boundary Tests**: Edge cases and limits

### Mock Strategy
- **Dependency injection**: Test-friendly function signatures
- **HTTP mocking**: Custom clients for API testing
- **File system mocking**: Temporary files and directories
- **Provider simulation**: Mock API responses

## 🎯 Key Design Decisions

### 1. **Functional Programming Paradigm**
- **Why**: Better testability, predictability, and maintainability
- **How**: Pure functions, no mutable state, explicit error handling
- **Result**: Easier to reason about, debug, and test

### 2. **Layered Architecture**
- **Why**: Separation of concerns, modularity, maintainability
- **How**: Clear boundaries between commands, services, adapters
- **Result**: Easy to modify providers without affecting business logic

### 3. **Explicit Error Handling**
- **Why**: Better error context, functional style consistency
- **How**: Custom error types per layer, explicit conversion functions
- **Result**: Detailed error information, easier debugging

### 4. **Provider Abstraction**
- **Why**: Support multiple AI providers, easy to add new ones
- **How**: Common service interface, provider-specific adapters
- **Result**: Flexible AI provider switching, consistent API

### 5. **Configuration Centralization**
- **Why**: Single source of truth, easier maintenance
- **How**: Constants module with categorized settings
- **Result**: Consistent configuration, easy to modify

## 🚀 Extension Points

### Adding New AI Providers
1. Create adapter in `adapters/ai/new_provider/`
2. Add model enum to `models/ai.rs`
3. Add provider case to `services/ai/chat.rs`
4. Add error types to `errors.rs`
5. Implement comprehensive tests

### Adding New Document Types
1. Create service in `services/document/new_type.rs`
2. Add Tauri commands in `commands.rs`
3. Add error types to `errors.rs`
4. Implement processing and tests

### Adding New OS Integrations
1. Create adapter in `adapters/os/new_integration.rs`
2. Add service layer if needed
3. Add error handling
4. Implement tests with proper mocking

## 📊 Metrics & Monitoring

### Current Status
- **Total Files**: 41 Rust source files
- **Test Coverage**: 123 comprehensive tests
- **Lines of Code**: ~3,000 lines (estimated)
- **Error Types**: 6 layered error enums
- **Providers**: 2 AI providers (Gemini, DeepSeek)

### Code Quality
- **No warnings**: Clean compilation
- **Functional style**: Consistent paradigm
- **Well-tested**: Both happy and error paths
- **Documented**: Comprehensive inline documentation
- **Maintainable**: Clear separation of concerns

---

This architecture provides a solid foundation for a maintainable, testable, and extensible Rust backend that can grow with the application's needs while maintaining code quality and developer experience.