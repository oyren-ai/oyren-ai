// @ts-ignore
import { assertEquals } from "@std/assert";
import { testGeminiConnection } from "./testGeminiConnection.ts";
// Mock client factories
const createSuccessMock = () => ({
  async invoke() { return { content: "test" }; }
});

const createErrorMock = (message: string) => ({
  async invoke() { throw new Error(message); }
});

// ============================================================================
// Happy Path Tests
// ============================================================================

Deno.test("testGeminiConnection - returns true for valid credentials", async () => {
  const result = await testGeminiConnection("test-key", "models/gemini-2.5-flash", createSuccessMock);

  assertEquals(result.data, true);
  assertEquals(result.error, undefined);
});

Deno.test("testGeminiConnection - sends minimal test message", async () => {
  let invokedMessages: unknown;
  const mockClient = {
    async invoke(messages: unknown) {
      invokedMessages = messages;
      return { content: "test" };
    }
  };

  await testGeminiConnection("test-key", "models/gemini-2.5-flash", () => mockClient);

  assertEquals(invokedMessages, [["human", "Say OK. Do not reason, do not explain."]]);
});

Deno.test("testGeminiConnection - uses default config (no temperature/maxTokens)", async () => {
  let capturedConfig: unknown;
  const mockFactory = (config: unknown) => {
    capturedConfig = config;
    return createSuccessMock();
  };

  await testGeminiConnection("test-key", "models/gemini-2.5-flash", mockFactory);

  assertEquals(capturedConfig, { apiKey: "test-key", model: "models/gemini-2.5-flash" });
});

// ============================================================================
// Error Cases
// ============================================================================

Deno.test("testGeminiConnection - returns error for invalid API key", async () => {
  const result = await testGeminiConnection(
    "invalid-key",
    "models/gemini-2.5-flash",
    () => createErrorMock("Invalid API key")
  );

  assertEquals(result.data, undefined);
  assertEquals(result.error?.errorType, "unknown-error");
  assertEquals(result.error?.message, "Invalid API key");
});

Deno.test("testGeminiConnection - returns error for invalid model", async () => {
  const result = await testGeminiConnection(
    "test-key",
    "invalid-model",
    () => createErrorMock("Model not found")
  );

  assertEquals(result.data, undefined);
  assertEquals(result.error?.errorType, "unknown-error");
  assertEquals(result.error?.message?.includes("Model not found"), true);
});

Deno.test("testGeminiConnection - returns error for network failure", async () => {
  const result = await testGeminiConnection(
    "test-key",
    "models/gemini-2.5-flash",
    () => createErrorMock("Network error: Failed to fetch")
  );

  assertEquals(result.data, undefined);
  assertEquals(result.error?.message?.includes("Network error"), true);
});

Deno.test("testGeminiConnection - handles non-Error exceptions", async () => {
  const mockClient = {
    async invoke() { throw "string error"; }
  };

  const result = await testGeminiConnection("test-key", "models/gemini-2.5-flash", () => mockClient);

  assertEquals(result.data, undefined);
  assertEquals(result.error?.errorType, "unknown-error");
  assertEquals(result.error?.message, "string error");
});