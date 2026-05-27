// @ts-ignore
import { assertEquals } from "@std/assert";
import { AIMessageChunk } from "@langchain/core/messages";
import { chatWithLlm } from "./chatWithLlm.ts";
import type { LlmChatClient } from "@/types/LlmChatClient.ts";
import type { AiProvider } from "@/types/AiProvider.ts";

function mockLlm(content: string): LlmChatClient {
  return {
    invoke: () =>
      Promise.resolve(new AIMessageChunk({ content })),
    bindTools: function () { return this; },
  };
}

function provider(name: string): AiProvider {
  return { provider: name, apiKey: "test-key" };
}

Deno.test("chatWithLlm - routes to gemini", async () => {
  const llm = mockLlm("gemini response");
  const result = await chatWithLlm(
    llm, provider("gemini"), "gemini-2.5-flash",
    "hello", [],
  );
  assertEquals(result.data?.response, "gemini response");
});

Deno.test("chatWithLlm - routes to deepseek", async () => {
  const llm = mockLlm("deepseek response");
  const result = await chatWithLlm(
    llm, provider("deepseek"), "deepseek-chat",
    "hello", [],
  );
  assertEquals(result.data?.response, "deepseek response");
});

Deno.test("chatWithLlm - routes to openrouter", async () => {
  const llm = mockLlm("openrouter response");
  const result = await chatWithLlm(
    llm, provider("openrouter"), "some-model",
    "hello", [],
  );
  assertEquals(result.data?.response, "openrouter response");
});

Deno.test("chatWithLlm - routes to ollama", async () => {
  const llm = mockLlm("ollama response");
  const result = await chatWithLlm(
    llm, provider("ollama"), "llama3",
    "hello", [],
  );
  assertEquals(result.data?.response, "ollama response");
});

Deno.test("chatWithLlm - case insensitive provider name", async () => {
  const llm = mockLlm("ok");
  const result = await chatWithLlm(
    llm, provider("GEMINI"), "gemini-2.5-flash",
    "hello", [],
  );
  assertEquals(result.data?.response, "ok");
});

Deno.test("chatWithLlm - returns error for unknown provider", () => {
  const llm = mockLlm("nope");
  const result = chatWithLlm(
    llm, provider("unknown"), "model",
    "hello", [],
  );
  // Synchronous return for default branch
  assertEquals("error" in (result as object), true);
  const sync = result as { error: { errorType: string } };
  assertEquals(sync.error.errorType, "unknown-error");
});
