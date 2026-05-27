// @ts-ignore
import { assertEquals } from "@std/assert";
import { chatWithGemini } from "./chatWithGemini.ts";
import type { ConversationMessage } from "@/types/ConversationMessage.ts";
import type { ImageData } from "@/types/AgentRequest.ts";
import type { LlmChatClient } from "@/types/LlmChatClient.ts";
import { UserIntent } from "@/intent/types.ts";

// deno-lint-ignore no-explicit-any
const mockLlm = (response: string | unknown, usage?: Record<string, number>): LlmChatClient => ({
  async invoke() {
    return { content: response, usage_metadata: usage };
  },
} as any);

// deno-lint-ignore no-explicit-any
const mockErrorLlm = (error: unknown): LlmChatClient => ({
  async invoke() { throw error; },
} as any);

Deno.test("chatWithGemini - returns response with text", async () => {
  const result = await chatWithGemini(mockLlm("Hello from Gemini!"), "Hello", []);
  assertEquals(result.error, undefined);
  assertEquals(result.data?.response, "Hello from Gemini!");
});

Deno.test("chatWithGemini - includes usage metadata", async () => {
  const llm = mockLlm("Hi", { input_tokens: 10, output_tokens: 20 });
  const result = await chatWithGemini(llm, "Hi", []);
  assertEquals(result.data?.usage_metadata?.input_tokens, 10);
  assertEquals(result.data?.usage_metadata?.output_tokens, 20);
});

Deno.test("chatWithGemini - handles non-string content", async () => {
  const result = await chatWithGemini(mockLlm({ type: "obj" }), "Hi", []);
  assertEquals(result.data?.response, JSON.stringify({ type: "obj" }));
});

Deno.test("chatWithGemini - processes conversation history", async () => {
  const history: ConversationMessage[] = [
    { role: "user", content: "First" },
    { role: "assistant", content: "Response" },
  ];
  const result = await chatWithGemini(mockLlm("ok"), "Second", history);
  assertEquals(result.data?.response, "ok");
});

Deno.test("chatWithGemini - accepts images", async () => {
  const images: ImageData[] = [{ data: "base64", mime_type: "image/png" }];
  const result = await chatWithGemini(mockLlm("I see an image"), "Describe", [], images);
  assertEquals(result.data?.response, "I see an image");
});

Deno.test("chatWithGemini - handles errors", async () => {
  const result = await chatWithGemini(mockErrorLlm(new Error("Network timeout")), "Hi", []);
  assertEquals(result.data, undefined);
  assertEquals(result.error?.message, "Network timeout");
});

Deno.test("chatWithGemini - passes user_intent in response", async () => {
  const intent = new UserIntent({ intent: "chat_no_pdf_markdown", topics: [], keywords: [] });
  const result = await chatWithGemini(mockLlm("ok"), "Hi", [], undefined, intent);
  assertEquals(result.data?.user_intent, intent);
});
