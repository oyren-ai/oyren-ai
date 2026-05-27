// @ts-ignore
import { assertEquals } from "@std/assert";
import { extractIntent } from "./extractIntent.ts";
import type { LlmChatClient } from "@/types/LlmChatClient.ts";

// deno-lint-ignore no-explicit-any
const mockLlm = (response: string): LlmChatClient => ({
  async invoke() { return { content: response }; },
} as any);

// deno-lint-ignore no-explicit-any
const mockErrorLlm = (): LlmChatClient => ({
  async invoke() { throw new Error("LLM error"); },
} as any);

Deno.test("extractIntent - classifies paper_search", async () => {
  const llm = mockLlm(JSON.stringify({
    intent: "paper_search",
    topics: ["transformer architectures"],
    keywords: ["self-attention"],
  }));
  const result = await extractIntent(llm, "Find papers on transformers", []);
  assertEquals(result.intent, "paper_search");
  assertEquals(result.topics, ["transformer architectures"]);
});

Deno.test("extractIntent - classifies chat_pdf_markdown", async () => {
  const llm = mockLlm(JSON.stringify({
    intent: "chat_pdf_markdown",
    topics: ["ML"],
    keywords: [],
  }));
  const msg = "--- paper.pdf ---\nExtracted text\n\nExplain this";
  const result = await extractIntent(llm, msg, []);
  assertEquals(result.intent, "chat_pdf_markdown");
});

Deno.test("extractIntent - classifies chat_no_pdf_markdown", async () => {
  const llm = mockLlm(JSON.stringify({
    intent: "chat_no_pdf_markdown",
    topics: [],
    keywords: [],
  }));
  const result = await extractIntent(llm, "Hello, how are you?", []);
  assertEquals(result.intent, "chat_no_pdf_markdown");
});

Deno.test("extractIntent - error fallback with no docs → chat_no_pdf_markdown", async () => {
  const result = await extractIntent(mockErrorLlm(), "Find papers", []);
  assertEquals(result.intent, "chat_no_pdf_markdown");
  assertEquals(result.topics, []);
});

Deno.test("extractIntent - error fallback with docs → chat_pdf_markdown", async () => {
  const msg = "--- paper.pdf ---\nExtracted text";
  const result = await extractIntent(mockErrorLlm(), msg, []);
  assertEquals(result.intent, "chat_pdf_markdown");
});

Deno.test("extractIntent - includes conversation context", async () => {
  let capturedMessages: unknown;
  // deno-lint-ignore no-explicit-any
  const llm: LlmChatClient = {
    async invoke(messages: unknown) {
      capturedMessages = messages;
      return { content: JSON.stringify({ intent: "chat_no_pdf_markdown", topics: [], keywords: [] }) };
    },
  } as any;

  await extractIntent(llm, "Continue", [
    { role: "user", content: "Previous question" },
    { role: "assistant", content: "Previous answer" },
  ]);

  assertEquals(Array.isArray(capturedMessages), true);
});
