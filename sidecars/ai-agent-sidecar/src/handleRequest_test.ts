import { assertEquals } from "@std/assert";
import handleAgentRequest from "./handleAgentRequest.ts";

// ============================================================================
// handleRequest Tests
// ============================================================================

Deno.test("handleRequest - should return error for undefined input", async () => {
  const result = await handleAgentRequest(undefined);

  assertEquals(result.isError, true);
  assertEquals(result.exitCode, 0);
  const output = JSON.parse(result.output);
  assertEquals(output.data, null);
  assertEquals(output.error.errorType, "validation-error");
  assertEquals(output.error.message, "No input received");
});

Deno.test("handleRequest - should return error for empty string input", async () => {
  const result = await handleAgentRequest("");

  assertEquals(result.isError, true);
  assertEquals(result.exitCode, 0);
  const output = JSON.parse(result.output);
  assertEquals(output.data, null);
  assertEquals(output.error.errorType, "validation-error");
  assertEquals(output.error.message, "No input received");
});

Deno.test("handleRequest - should return error for invalid JSON", async () => {
  const result = await handleAgentRequest("not valid json");

  assertEquals(result.isError, true);
  assertEquals(result.exitCode, 0);

  const output = JSON.parse(result.output);
  assertEquals(output.data, null);
  assertEquals(output.error.errorType, "parse-error");
  assertEquals(typeof output.error.message, "string");
});

Deno.test("handleRequest - should return error for missing operation field", async () => {
  const input = JSON.stringify({});

  const result = await handleAgentRequest(input);

  assertEquals(result.isError, true);
  assertEquals(result.exitCode, 0);

  const output = JSON.parse(result.output);
  assertEquals(output.data, null);
  assertEquals(output.error.errorType, "validation-error");
  assertEquals(output.error.message, "Missing required field: operation");
});

Deno.test("handleRequest - should return error for unknown operation", async () => {
  const input = JSON.stringify({
    operation: "unknown-operation"
  });

  const result = await handleAgentRequest(input);

  assertEquals(result.isError, true);
  assertEquals(result.exitCode, 0);

  const output = JSON.parse(result.output);
  assertEquals(output.data, null);
  assertEquals(output.error.errorType, "unknown-error");
  assertEquals(output.error.message, "Unknown operation: unknown-operation");
});

// ============================================================================
// Chat Operation Tests
// ============================================================================

Deno.test("handleRequest - chat operation should return error for missing message", async () => {
  const input = JSON.stringify({
    operation: "chat",
    message: "",
    aiProvider: { provider: "gemini", apiKey: "test-key" },
    conversationHistory: [],
    model: "gemini-2.5-flash",
  });

  const result = await handleAgentRequest(input);

  assertEquals(result.isError, true);
  assertEquals(result.exitCode, 0);

  const output = JSON.parse(result.output);
  assertEquals(output.data, null);
  assertEquals(output.error.errorType, "unknown-error");
  assertEquals(output.error.message, "Missing required fields: message, aiProvider, or model");
});

Deno.test("handleRequest - chat operation should return error for missing model", async () => {
  const input = JSON.stringify({
    operation: "chat",
    message: "test",
    aiProvider: { provider: "gemini", apiKey: "test-key" },
    conversationHistory: [],
    model: "",
  });

  const result = await handleAgentRequest(input);

  assertEquals(result.isError, true);
  assertEquals(result.exitCode, 0);

  const output = JSON.parse(result.output);
  assertEquals(output.data, null);
  assertEquals(output.error.errorType, "unknown-error");
  assertEquals(output.error.message, "Missing required fields: message, aiProvider, or model");
});

Deno.test("handleRequest - chat operation should return error for unsupported provider", async () => {
  const input = JSON.stringify({
    operation: "chat",
    message: "test",
    aiProvider: { provider: "unknown-provider", apiKey: "test-key" },
    conversationHistory: [],
    model: "test-model",
  });

  const result = await handleAgentRequest(input);

  assertEquals(result.isError, true);
  assertEquals(result.exitCode, 0);

  const output = JSON.parse(result.output);
  assertEquals(output.data, null);
  assertEquals(output.error.message.includes("Unsupported provider"), true);
});

// ============================================================================
// Detect Models Operation Tests
// ============================================================================

Deno.test("handleRequest - detect-models operation returns response for ollama", async () => {
  const input = JSON.stringify({
    operation: "detect-models",
    provider: "ollama"
  });

  const result = await handleAgentRequest(input);

  // Response structure should be valid (success or error depending on Ollama availability)
  assertEquals(typeof result.isError, "boolean");
  assertEquals(typeof result.exitCode, "number");

  const output = JSON.parse(result.output);
  assertEquals(typeof output === 'object', true);
});

Deno.test("handleRequest - detect-models operation should return error for non-ollama provider", async () => {
  const input = JSON.stringify({
    operation: "detect-models",
    provider: "gemini"
  });

  const result = await handleAgentRequest(input);

  assertEquals(result.isError, true);
  assertEquals(result.exitCode, 0);

  const output = JSON.parse(result.output);
  assertEquals(output.data, null);
  assertEquals(output.error.errorType, "unknown-error");
  assertEquals(output.error.message, "Model detection only supported for Ollama");
});

// ============================================================================
// Test Connection Operation Tests
// ============================================================================

Deno.test("handleRequest - test-connection operation should return error for unsupported provider", async () => {
  const input = JSON.stringify({
    operation: "test-connection",
    aiProvider: { provider: "unknown-provider", apiKey: "test-key" },
    model: "test-model"
  });

  const result = await handleAgentRequest(input);

  assertEquals(result.isError, true);
  assertEquals(result.exitCode, 0);

  const output = JSON.parse(result.output);
  assertEquals(output.data, null);
  assertEquals(output.error.message.includes("Unsupported provider"), true);
});

Deno.test("handleRequest - test-connection operation returns response for ollama", async () => {
  const input = JSON.stringify({
    operation: "test-connection",
    aiProvider: { provider: "ollama", apiKey: "" },
    model: "llama2"
  });

  const result = await handleAgentRequest(input);

  // Response structure should be valid
  assertEquals(typeof result.isError, "boolean");
  assertEquals(typeof result.exitCode, "number");

  const output = JSON.parse(result.output);
  if (output.data) {
    assertEquals(output.data.provider, "ollama");
    assertEquals(output.data.model, "llama2");
    assertEquals(typeof output.data.success, "boolean");
  }
});

Deno.test("handleRequest - test-connection operation returns response for gemini", async () => {
  const input = JSON.stringify({
    operation: "test-connection",
    aiProvider: { provider: "gemini", apiKey: "test-key" },
    model: "gemini-2.5-flash"
  });

  const result = await handleAgentRequest(input);

  // Response structure should be valid
  assertEquals(typeof result.isError, "boolean");
  assertEquals(typeof result.exitCode, "number");

  const output = JSON.parse(result.output);
  if (output.data) {
    assertEquals(output.data.provider, "gemini");
    assertEquals(output.data.model, "gemini-2.5-flash");
    assertEquals(typeof output.data.success, "boolean");
  }
});

Deno.test("handleRequest - test-connection operation returns response for deepseek", async () => {
  const input = JSON.stringify({
    operation: "test-connection",
    aiProvider: { provider: "deepseek", apiKey: "test-key" },
    model: "deepseek-chat"
  });

  const result = await handleAgentRequest(input);

  // Response structure should be valid
  assertEquals(typeof result.isError, "boolean");
  assertEquals(typeof result.exitCode, "number");

  const output = JSON.parse(result.output);
  if (output.data) {
    assertEquals(output.data.provider, "deepseek");
    assertEquals(output.data.model, "deepseek-chat");
    assertEquals(typeof output.data.success, "boolean");
  }
});
