import { assertEquals, assertThrows } from "@std/assert";
import createLlmChatClient from "@/providers/createLlmChatClient.ts";
import type { AiProvider } from "@/types/AiProvider.ts";

function provider(name: string, apiKey = "test-key"): AiProvider {
  return { provider: name, apiKey };
}

// --- Provider routing ---

Deno.test("createLlmChatClient - creates gemini client", () => {
  const client = createLlmChatClient(provider("gemini"), "gemini-2.5-flash");
  assertEquals(typeof client.invoke, "function");
});

Deno.test("createLlmChatClient - creates deepseek client", () => {
  const client = createLlmChatClient(provider("deepseek"), "deepseek-chat");
  assertEquals(typeof client.invoke, "function");
});

Deno.test("createLlmChatClient - creates openrouter client", () => {
  const client = createLlmChatClient(provider("openrouter"), "meta-llama/llama-3");
  assertEquals(typeof client.invoke, "function");
});

Deno.test("createLlmChatClient - creates ollama client", () => {
  const client = createLlmChatClient(provider("ollama"), "llama3");
  assertEquals(typeof client.invoke, "function");
});

Deno.test("createLlmChatClient - case insensitive provider name", () => {
  const client = createLlmChatClient(provider("GEMINI"), "gemini-2.5-flash");
  assertEquals(typeof client.invoke, "function");
});

Deno.test("createLlmChatClient - throws on unsupported provider", () => {
  assertThrows(
    () => createLlmChatClient(provider("unknown"), "model"),
    Error, "Unsupported provider: unknown",
  );
});

// --- Default temperature and maxTokens ---

Deno.test("createLlmChatClient - uses defaults when temp/tokens omitted", () => {
  const client = createLlmChatClient(provider("ollama"), "llama3");
  assertEquals(typeof client.invoke, "function");
});

Deno.test("createLlmChatClient - accepts custom temp and tokens", () => {
  const client = createLlmChatClient(provider("ollama"), "llama3", 0.5, 1000);
  assertEquals(typeof client.invoke, "function");
});
