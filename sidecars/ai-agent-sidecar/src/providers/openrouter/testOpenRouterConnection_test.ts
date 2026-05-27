import { assertEquals } from "@std/assert";
import { testOpenRouterConnection } from "./testOpenRouterConnection.ts";

// Mock factory
const mockClient = () => ({
  async invoke() {
    return { content: "test response" };
  },
  // deno-lint-ignore no-explicit-any
}) as any;

const mockError = (error: unknown) => ({
  async invoke() {
    throw error;
  },
  // deno-lint-ignore no-explicit-any
}) as any;

Deno.test("testOpenRouterConnection - returns true for valid credentials", async () => {
  const result = await testOpenRouterConnection("key", "google/gemini-2.5-pro-preview", () => mockClient());

  assertEquals(result.data, true);
  assertEquals(result.error, undefined);
});

Deno.test("testOpenRouterConnection - sends minimal test message", async () => {
  let invokedMessages: any;
  const mockFactory = () => ({
    async invoke(messages: any) {
      invokedMessages = messages;
      return { content: "Response" };
    },
  }) as any;

  await testOpenRouterConnection("key", "model", mockFactory);

  assertEquals(invokedMessages, [["human", "Say OK. Do not reason, do not explain."]]);
});

Deno.test("testOpenRouterConnection - uses default config (no temperature/maxTokens)", async () => {
  let capturedConfig: any;
  const mockFactory = (config: any) => {
    capturedConfig = config;
    return mockClient();
  };

  await testOpenRouterConnection("key", "anthropic/claude-opus-4.5", mockFactory);

  assertEquals(capturedConfig.temperature, undefined);
  assertEquals(capturedConfig.maxTokens, undefined);
});

Deno.test("testOpenRouterConnection - returns error for invalid API key", async () => {
  const result = await testOpenRouterConnection("bad-key", "model", () => mockError(new Error("Invalid API key")));

  assertEquals(result.error?.errorType, "unknown-error");
  assertEquals(result.error?.message, "Invalid API key");
  assertEquals(result.data, undefined);
});

Deno.test("testOpenRouterConnection - returns error for invalid model", async () => {
  const result = await testOpenRouterConnection("key", "invalid-model", () => mockError(new Error("Model not found")));

  assertEquals(result.error?.message, "Model not found");
});

Deno.test("testOpenRouterConnection - returns error for network failure", async () => {
  const result = await testOpenRouterConnection("key", "model", () => mockError(new Error("Network error")));

  assertEquals(result.error?.message, "Network error");
});

Deno.test("testOpenRouterConnection - handles non-Error exceptions", async () => {
  const result = await testOpenRouterConnection("key", "model", () => mockError("string error"));

  assertEquals(result.error?.errorType, "unknown-error");
  assertEquals(result.error?.message, "string error");
});

Deno.test("testOpenRouterConnection - configures OpenRouter base URL", async () => {
  let capturedConfig: any;
  const mockFactory = (config: any) => {
    capturedConfig = config;
    return mockClient();
  };

  await testOpenRouterConnection("key", "openai/gpt-5", mockFactory);

  assertEquals(capturedConfig.configuration.baseURL, "https://openrouter.ai/api/v1");
  assertEquals(capturedConfig.configuration.defaultHeaders["HTTP-Referer"], "https://oyren.ai");
  assertEquals(capturedConfig.configuration.defaultHeaders["X-Title"], "Oyren AI");
});

// Test different model types
Deno.test("testOpenRouterConnection - works with google/gemini-3-flash-preview", async () => {
  const result = await testOpenRouterConnection("key", "google/gemini-3-flash-preview", () => mockClient());
  assertEquals(result.data, true);
});

Deno.test("testOpenRouterConnection - works with anthropic/claude-haiku-4.5", async () => {
  const result = await testOpenRouterConnection("key", "anthropic/claude-haiku-4.5", () => mockClient());
  assertEquals(result.data, true);
});

Deno.test("testOpenRouterConnection - works with openai/gpt-4.1-mini", async () => {
  const result = await testOpenRouterConnection("key", "openai/gpt-4.1-mini", () => mockClient());
  assertEquals(result.data, true);
});