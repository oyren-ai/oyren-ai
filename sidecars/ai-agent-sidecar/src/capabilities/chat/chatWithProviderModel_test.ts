// @ts-ignore
import { assertEquals } from "@std/assert";
import { chatWithProviderModel } from "./chatWithProviderModel.ts";
import type { ProviderModelConfig } from "./types.ts";
import type { LlmChatClient } from "@/types/LlmChatClient.ts";
import { UserIntent } from "@/intent/types.ts";
import { SidecarError } from "@/types/SidecarError.ts";

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

const noToolsConfig: ProviderModelConfig = {
  supportsTools: false,
  handleError: (error, _model) => ({
    error: SidecarError.UnknownError({
      message: error instanceof Error ? error.message : String(error),
    }),
  }),
};

const toolsConfig: ProviderModelConfig = {
  supportsTools: true,
  handleError: noToolsConfig.handleError,
};

Deno.test("chatWithProviderModel - returns response with text content", async () => {
  const result = await chatWithProviderModel(noToolsConfig, mockLlm("Hello!"), "Hi", []);
  assertEquals(result.error, undefined);
  assertEquals(result.data?.response, "Hello!");
});

Deno.test("chatWithProviderModel - includes usage metadata", async () => {
  const llm = mockLlm("Hi", { input_tokens: 10, output_tokens: 20 });
  const result = await chatWithProviderModel(noToolsConfig, llm, "Hi", []);
  assertEquals(result.data?.usage_metadata?.input_tokens, 10);
  assertEquals(result.data?.usage_metadata?.output_tokens, 20);
});

Deno.test("chatWithProviderModel - handles non-string content", async () => {
  const result = await chatWithProviderModel(noToolsConfig, mockLlm({ key: "val" }), "Hi", []);
  assertEquals(result.data?.response, JSON.stringify({ key: "val" }));
});

Deno.test("chatWithProviderModel - passes user_intent in response", async () => {
  const intent = new UserIntent({ intent: "chat_no_pdf_markdown", topics: [], keywords: [] });
  const result = await chatWithProviderModel(
    noToolsConfig, mockLlm("ok"), "Hi", [], undefined, undefined, intent,
  );
  assertEquals(result.data?.user_intent, intent);
});

Deno.test("chatWithProviderModel - skips tools when supportsTools is false", async () => {
  const intent = new UserIntent({ intent: "paper_search", topics: ["ai"], keywords: ["llm"] });
  // With supportsTools: false, should plain invoke even for paper_search
  const result = await chatWithProviderModel(
    noToolsConfig, mockLlm("plain response"), "find papers", [], undefined, undefined, intent,
  );
  assertEquals(result.data?.response, "plain response");
  assertEquals(result.data?.arxiv_papers, undefined);
});

Deno.test("chatWithProviderModel - delegates errors to handleError", async () => {
  const customConfig: ProviderModelConfig = {
    supportsTools: false,
    handleError: (_error, _model) => ({
      error: SidecarError.ApiError({ shortMessage: "Custom handler" }),
    }),
  };
  const result = await chatWithProviderModel(
    customConfig, mockErrorLlm(new Error("fail")), "Hi", [],
  );
  assertEquals(result.error?.errorType, "api-error");
  assertEquals(result.error?.shortMessage, "Custom handler");
});

Deno.test("chatWithProviderModel - handles non-Error exceptions via handleError", async () => {
  const result = await chatWithProviderModel(
    noToolsConfig, mockErrorLlm("string error"), "Hi", [],
  );
  assertEquals(result.error?.errorType, "unknown-error");
  assertEquals(result.error?.message, "string error");
});

Deno.test("chatWithProviderModel - skips tools when images present", async () => {
  const intent = new UserIntent({ intent: "paper_search", topics: ["ai"], keywords: ["llm"] });
  const images = [{ data: "base64", mime_type: "image/png" }];
  const result = await chatWithProviderModel(
    toolsConfig, mockLlm("image response"), "describe", [], images, undefined, intent,
  );
  assertEquals(result.data?.response, "image response");
  assertEquals(result.data?.arxiv_papers, undefined);
});

Deno.test("chatWithProviderModel - extracts text from array content parts", async () => {
  const arrayContent = [{ type: "text", text: "Hello from OpenRouter" }];
  const result = await chatWithProviderModel(noToolsConfig, mockLlm(arrayContent), "Hi", []);
  assertEquals(result.error, undefined);
  assertEquals(result.data?.response, "Hello from OpenRouter");
});

Deno.test("chatWithProviderModel - joins multiple text parts with newline", async () => {
  const arrayContent = [
    { type: "text", text: "First paragraph" },
    { type: "text", text: "Second paragraph" },
  ];
  const result = await chatWithProviderModel(noToolsConfig, mockLlm(arrayContent), "Hi", []);
  assertEquals(result.data?.response, "First paragraph\nSecond paragraph");
});

Deno.test("chatWithProviderModel - filters non-text content parts", async () => {
  const arrayContent = [
    { type: "text", text: "Visible text" },
    { type: "image_url", image_url: "data:image/png;base64,..." },
  ];
  const result = await chatWithProviderModel(noToolsConfig, mockLlm(arrayContent), "Hi", []);
  assertEquals(result.data?.response, "Visible text");
});

Deno.test("chatWithProviderModel - returns error for empty string content", async () => {
  const result = await chatWithProviderModel(noToolsConfig, mockLlm(""), "Hi", []);
  assertEquals(result.data, undefined);
  assertEquals(result.error?.errorType, "unknown-error");
  assertEquals(result.error?.message, "Model returned empty response");
});

Deno.test("chatWithProviderModel - returns error for whitespace-only content", async () => {
  const result = await chatWithProviderModel(noToolsConfig, mockLlm("   \n  "), "Hi", []);
  assertEquals(result.error?.errorType, "unknown-error");
  assertEquals(result.error?.message, "Model returned empty response");
});

Deno.test("chatWithProviderModel - returns error for empty array content", async () => {
  const result = await chatWithProviderModel(noToolsConfig, mockLlm([]), "Hi", []);
  assertEquals(result.error?.errorType, "unknown-error");
  assertEquals(result.error?.message, "Model returned empty response");
});
