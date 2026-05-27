// @ts-ignore
import { assertEquals } from "@std/assert";
import { testDeepSeekConnection } from "./testDeepSeekConnection.ts";
import { DEEPSEEK_MODELS } from "./models.ts";

// Mock client factories
const createSuccessMock = () => ({
  async invoke() {
    return { content: "test" };
  },
});

const createErrorMock = (message: string) => ({
  async invoke() {
    throw new Error(message);
  },
});

// ============================================================================
// Happy Path Tests
// ============================================================================

Deno.test("testDeepSeekConnection - returns true for valid credentials", async () => {
  const result = await testDeepSeekConnection(
    "test-key",
    "deepseek-chat",
    createSuccessMock
  );

  assertEquals(result.data, true);
  assertEquals(result.error, undefined);
});

Deno.test("testDeepSeekConnection - sends minimal test message", async () => {
  let invokedMessages: unknown;
  const mockClient = {
    async invoke(messages: unknown) {
      invokedMessages = messages;
      return { content: "test" };
    },
  };

  await testDeepSeekConnection("test-key", "deepseek-chat", () => mockClient);

  assertEquals(invokedMessages, [["human", "Say OK. Do not reason, do not explain."]]);
});

Deno.test("testDeepSeekConnection - uses default config (no temperature/maxTokens)", async () => {
  let capturedConfig: unknown;
  const mockFactory = (config: unknown) => {
    capturedConfig = config;
    return createSuccessMock();
  };

  await testDeepSeekConnection("test-key", "deepseek-chat", mockFactory);

  assertEquals(capturedConfig, { apiKey: "test-key", model: "deepseek-chat" });
});

// ============================================================================
// Error Cases
// ============================================================================

Deno.test("testDeepSeekConnection - returns error for invalid API key", async () => {
  const result = await testDeepSeekConnection(
    "invalid-key",
    "deepseek-chat",
    () => createErrorMock("Invalid API key")
  );

  assertEquals(result.data, undefined);
  assertEquals(result.error?.errorType, "unknown-error");
  assertEquals(result.error?.message, "Invalid API key");
});

Deno.test("testDeepSeekConnection - returns error for invalid model", async () => {
  const result = await testDeepSeekConnection(
    "test-key",
    "invalid-model",
    () => createErrorMock("Model not found")
  );

  assertEquals(result.data, undefined);
  assertEquals(result.error?.errorType, "unknown-error");
  assertEquals(result.error?.message?.includes("Model not found"), true);
});

Deno.test("testDeepSeekConnection - returns error for network failure", async () => {
  const result = await testDeepSeekConnection(
    "test-key",
    "deepseek-chat",
    () => createErrorMock("Network error: Failed to fetch")
  );

  assertEquals(result.data, undefined);
  assertEquals(result.error?.message?.includes("Network error"), true);
});

Deno.test("testDeepSeekConnection - handles non-Error exceptions", async () => {
  const mockClient = {
    async invoke() {
      throw "string error";
    },
  };

  const result = await testDeepSeekConnection(
    "test-key",
    "deepseek-chat",
    () => mockClient
  );

  assertEquals(result.data, undefined);
  assertEquals(result.error?.errorType, "unknown-error");
  assertEquals(result.error?.message, "string error");
});

// ============================================================================
// Model Name Verification Tests
// ============================================================================

for (const model of DEEPSEEK_MODELS) {
  Deno.test(`testDeepSeekConnection - works with ${model}`, async () => {
    const result = await testDeepSeekConnection(
      "test-key",
      model,
      createSuccessMock
    );

    assertEquals(result.error, undefined);
    assertEquals(result.data, true);
  });
}