import { assertEquals } from "@std/assert";
import { chatWithOpenRouter } from "./chatWithOpenRouter.ts";
import type { ImageData } from "../../types/AgentRequest.ts";
import type { LlmChatClient } from "@/types/LlmChatClient.ts";
import { UserIntent } from "@/intent/types.ts";

// deno-lint-ignore no-explicit-any
const mockLlm = (response: string | unknown, usage?: Record<string, number>): LlmChatClient => ({
  async invoke() {
    return { content: response, usage_metadata: usage ?? { input_tokens: 15, output_tokens: 25 } };
  },
} as any);

// deno-lint-ignore no-explicit-any
const mockErrorLlm = (error: unknown): LlmChatClient => ({
  async invoke() { throw error; },
} as any);

Deno.test("chatWithOpenRouter - returns response", async () => {
  const result = await chatWithOpenRouter(mockLlm("Hello!"), "test", []);
  assertEquals(result.data?.response, "Hello!");
  assertEquals(result.error, undefined);
});

Deno.test("chatWithOpenRouter - includes usage metadata", async () => {
  const result = await chatWithOpenRouter(mockLlm("Hi", { input_tokens: 20, output_tokens: 30 }), "test", []);
  assertEquals(result.data?.usage_metadata?.input_tokens, 20);
});

Deno.test("chatWithOpenRouter - handles non-string content", async () => {
  const result = await chatWithOpenRouter(mockLlm({ type: "object" }), "test", []);
  assertEquals(result.data?.response, '{"type":"object"}');
});

Deno.test("chatWithOpenRouter - accepts images", async () => {
  const images: ImageData[] = [{ data: "base64data", mime_type: "image/png" }];
  const result = await chatWithOpenRouter(mockLlm("Analysis"), "Analyze", [], images);
  assertEquals(result.data?.response, "Analysis");
});

Deno.test("chatWithOpenRouter - handles empty images array", async () => {
  const result = await chatWithOpenRouter(mockLlm("Response"), "test", [], []);
  assertEquals(result.data?.response, "Response");
});

Deno.test("chatWithOpenRouter - handles errors", async () => {
  const result = await chatWithOpenRouter(mockErrorLlm(new Error("API key invalid")), "test", []);
  assertEquals(result.error?.errorType, "unknown-error");
  assertEquals(result.error?.message, "API key invalid");
});

Deno.test("chatWithOpenRouter - handles non-Error exceptions", async () => {
  const result = await chatWithOpenRouter(mockErrorLlm("string error"), "test", []);
  assertEquals(result.error?.message, "string error");
});

Deno.test("chatWithOpenRouter - passes user_intent in response", async () => {
  const intent = new UserIntent({ intent: "chat_no_pdf_markdown", topics: [], keywords: [] });
  const result = await chatWithOpenRouter(mockLlm("ok"), "Hi", [], undefined, intent);
  assertEquals(result.data?.user_intent, intent);
});
