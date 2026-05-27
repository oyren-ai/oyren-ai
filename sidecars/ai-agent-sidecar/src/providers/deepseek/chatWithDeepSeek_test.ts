// @ts-ignore
import { assertEquals } from "@std/assert";
import { chatWithDeepSeek } from "./chatWithDeepSeek.ts";
import type { ConversationMessage } from "@/types/ConversationMessage.ts";
import type { LlmChatClient } from "@/types/LlmChatClient.ts";
import { UserIntent } from "@/intent/types.ts";

// deno-lint-ignore no-explicit-any
const mockLlm = (response: string | unknown, usage?: Record<string, number>): LlmChatClient => ({
  async invoke() {
    return { content: response, usage_metadata: usage ?? { input_tokens: 10, output_tokens: 20 } };
  },
} as any);

// deno-lint-ignore no-explicit-any
const mockErrorLlm = (error: unknown): LlmChatClient => ({
  async invoke() { throw error; },
} as any);

Deno.test("chatWithDeepSeek - returns chat response", async () => {
  const result = await chatWithDeepSeek(mockLlm("Hello, I'm DeepSeek!"), "Hello", []);
  assertEquals(result.error, undefined);
  assertEquals(result.data?.response, "Hello, I'm DeepSeek!");
});

Deno.test("chatWithDeepSeek - includes usage metadata", async () => {
  const result = await chatWithDeepSeek(mockLlm("Hi", { input_tokens: 10, output_tokens: 20 }), "Hi", []);
  assertEquals(result.data?.usage_metadata?.input_tokens, 10);
});

Deno.test("chatWithDeepSeek - processes conversation history", async () => {
  const history: ConversationMessage[] = [
    { role: "user", content: "First" },
    { role: "assistant", content: "Response" },
  ];
  const result = await chatWithDeepSeek(mockLlm("ok"), "Second", history);
  assertEquals(result.data?.response, "ok");
});

Deno.test("chatWithDeepSeek - handles empty images array", async () => {
  const result = await chatWithDeepSeek(mockLlm("ok"), "Hello", [], []);
  assertEquals(result.error, undefined);
  assertEquals(result.data?.response, "ok");
});

Deno.test("chatWithDeepSeek - handles errors", async () => {
  const result = await chatWithDeepSeek(mockErrorLlm(new Error("API error")), "Hello", []);
  assertEquals(result.data, undefined);
  assertEquals(result.error?.errorType, "unknown-error");
  assertEquals(result.error?.message, "API error");
});

Deno.test("chatWithDeepSeek - handles non-Error exceptions", async () => {
  const result = await chatWithDeepSeek(mockErrorLlm("string error"), "Hello", []);
  assertEquals(result.error?.message, "string error");
});

Deno.test("chatWithDeepSeek - passes user_intent in response", async () => {
  const intent = new UserIntent({ intent: "chat_no_pdf_markdown", topics: [], keywords: [] });
  const result = await chatWithDeepSeek(mockLlm("ok"), "Hi", [], undefined, intent);
  assertEquals(result.data?.user_intent, intent);
});
