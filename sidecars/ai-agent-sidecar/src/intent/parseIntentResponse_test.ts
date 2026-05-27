// @ts-ignore
import { assertEquals } from "@std/assert";
import { parseIntentResponse } from "./parseIntentResponse.ts";

Deno.test("parseIntentResponse - parses paper_search intent", () => {
  const raw = JSON.stringify({
    intent: "paper_search",
    topics: ["transformers"],
    keywords: ["attention mechanism"],
    authors: ["Vaswani"],
    categories: ["cs.CL"],
  });
  const result = parseIntentResponse(raw, "Find papers on transformers");
  assertEquals(result.intent, "paper_search");
  assertEquals(result.topics, ["transformers"]);
  assertEquals(result.keywords, ["attention mechanism"]);
  assertEquals(result.authors, ["Vaswani"]);
  assertEquals(result.categories, ["cs.CL"]);
});

Deno.test("parseIntentResponse - parses chat_pdf_markdown intent", () => {
  const raw = JSON.stringify({ intent: "chat_pdf_markdown", topics: ["ML"], keywords: [] });
  const result = parseIntentResponse(raw, "--- paper.pdf ---\ntext");
  assertEquals(result.intent, "chat_pdf_markdown");
});

Deno.test("parseIntentResponse - parses chat_no_pdf_markdown intent", () => {
  const raw = JSON.stringify({ intent: "chat_no_pdf_markdown", topics: [], keywords: [] });
  const result = parseIntentResponse(raw, "Hello");
  assertEquals(result.intent, "chat_no_pdf_markdown");
});

Deno.test("parseIntentResponse - handles markdown code block", () => {
  const raw = '```json\n{"intent":"paper_search","topics":["ML"],"keywords":[]}\n```';
  const result = parseIntentResponse(raw, "Find ML papers");
  assertEquals(result.intent, "paper_search");
  assertEquals(result.topics, ["ML"]);
});

Deno.test("parseIntentResponse - malformed JSON falls back using hasDocuments (with docs)", () => {
  const result = parseIntentResponse("not json", "--- research.pdf ---\nExtracted text");
  assertEquals(result.intent, "chat_pdf_markdown");
  assertEquals(result.topics, []);
});

Deno.test("parseIntentResponse - malformed JSON falls back using hasDocuments (no docs)", () => {
  const result = parseIntentResponse("not json", "Hello, how are you?");
  assertEquals(result.intent, "chat_no_pdf_markdown");
});

Deno.test("parseIntentResponse - unknown intent defaults based on document presence (with docs)", () => {
  const raw = JSON.stringify({ intent: "unknown_intent", topics: ["AI"], keywords: [] });
  const result = parseIntentResponse(raw, "--- paper.pdf ---\ncontent");
  assertEquals(result.intent, "chat_pdf_markdown");
  assertEquals(result.topics, ["AI"]);
});

Deno.test("parseIntentResponse - general_chat defaults based on document presence (no docs)", () => {
  const raw = JSON.stringify({ intent: "general_chat", topics: [], keywords: [] });
  const result = parseIntentResponse(raw, "Hello");
  assertEquals(result.intent, "chat_no_pdf_markdown");
});

Deno.test("parseIntentResponse - extracts JSON from surrounding text", () => {
  const raw = 'Here is the analysis:\n{"intent":"paper_search","topics":["RL"],"keywords":["policy gradient"]}';
  const result = parseIntentResponse(raw, "Find RL papers");
  assertEquals(result.intent, "paper_search");
  assertEquals(result.topics, ["RL"]);
});

Deno.test("parseIntentResponse - filters non-string array items", () => {
  const raw = JSON.stringify({
    intent: "paper_search",
    topics: ["valid", 123, null, "also valid"],
    keywords: [],
  });
  const result = parseIntentResponse(raw, "Find papers");
  assertEquals(result.topics, ["valid", "also valid"]);
});

Deno.test("parseIntentResponse - normalizes missing fields", () => {
  const raw = JSON.stringify({ intent: "paper_search" });
  const result = parseIntentResponse(raw, "Find papers");
  assertEquals(result.intent, "paper_search");
  assertEquals(result.topics, []);
  assertEquals(result.keywords, []);
  assertEquals(result.authors, undefined);
});
