// @ts-ignore
import { assertEquals } from "@std/assert";
import { AIMessage } from "@langchain/core/messages";
import {
  collectPapersFromSearch,
  buildToolCallResult,
} from "./toolCallResultBuilder.ts";
import type { ArxivPaperMeta } from "./arxiv/types.ts";

Deno.test("collectPapersFromSearch - parses JSON papers into meta array", () => {
  const papers: ArxivPaperMeta[] = [];
  const json = JSON.stringify({
    papers: [{
      id: "2401.001", title: "Paper 1",
      authors: ["Alice", "Bob"], summary: "Sum",
      arxiv_url: "https://arxiv.org/abs/2401.001",
      pdf_url: "https://arxiv.org/pdf/2401.001",
      published: "2024-01-01",
    }],
  });

  collectPapersFromSearch(json, papers);
  assertEquals(papers.length, 1);
  assertEquals(papers[0].id, "2401.001");
  assertEquals(papers[0].authors, ["Alice", "Bob"]);
});

Deno.test("collectPapersFromSearch - wraps string authors in array", () => {
  const papers: ArxivPaperMeta[] = [];
  const json = JSON.stringify({
    papers: [{
      id: "2401.001", title: "Paper 1",
      authors: "Solo Author", summary: "Sum",
      arxiv_url: "url", pdf_url: "url", published: "2024-01-01",
    }],
  });

  collectPapersFromSearch(json, papers);
  assertEquals(papers[0].authors, ["Solo Author"]);
});

Deno.test("collectPapersFromSearch - skips duplicate papers by id", () => {
  const papers: ArxivPaperMeta[] = [{
    id: "2401.001", title: "Existing", authors: ["Alice"],
    summary: "S", arxiv_url: "u", pdf_url: "p", published: "2024",
  }];
  const json = JSON.stringify({
    papers: [
      { id: "2401.001", title: "Duplicate", authors: ["Bob"], summary: "S2", arxiv_url: "u2", pdf_url: "p2", published: "2024" },
      { id: "2401.002", title: "New", authors: ["Carol"], summary: "S3", arxiv_url: "u3", pdf_url: "p3", published: "2024" },
    ],
  });

  collectPapersFromSearch(json, papers);
  assertEquals(papers.length, 2);
  assertEquals(papers[0].title, "Existing");
  assertEquals(papers[1].id, "2401.002");
});

Deno.test("collectPapersFromSearch - deduplicates within same batch", () => {
  const papers: ArxivPaperMeta[] = [];
  const json = JSON.stringify({
    papers: [
      { id: "2401.001", title: "First", authors: ["A"], summary: "S", arxiv_url: "u", pdf_url: "p", published: "2024" },
      { id: "2401.001", title: "Dupe", authors: ["B"], summary: "S", arxiv_url: "u", pdf_url: "p", published: "2024" },
    ],
  });

  collectPapersFromSearch(json, papers);
  assertEquals(papers.length, 1);
  assertEquals(papers[0].title, "First");
});

Deno.test("collectPapersFromSearch - skips non-JSON input", () => {
  const papers: ArxivPaperMeta[] = [];
  collectPapersFromSearch("not json", papers);
  assertEquals(papers.length, 0);
});

Deno.test("collectPapersFromSearch - skips JSON without papers key", () => {
  const papers: ArxivPaperMeta[] = [];
  collectPapersFromSearch(JSON.stringify({ results: [] }), papers);
  assertEquals(papers.length, 0);
});

Deno.test("buildToolCallResult - returns empty string for null response", () => {
  const result = buildToolCallResult(null, []);
  assertEquals(result.finalResponse, "");
  assertEquals(result.arxivPapers, []);
  assertEquals(result.usageMetadata, undefined);
});

Deno.test("buildToolCallResult - extracts string content", () => {
  const msg = new AIMessage({ content: "Hello world" });
  const result = buildToolCallResult(msg, []);
  assertEquals(result.finalResponse, "Hello world");
});

Deno.test("buildToolCallResult - extracts text from array content parts", () => {
  const msg = new AIMessage({ content: [{ type: "text", text: "hi" }] });
  const result = buildToolCallResult(msg, []);
  assertEquals(result.finalResponse, "hi");
});

Deno.test("buildToolCallResult - joins multiple text parts", () => {
  const msg = new AIMessage({
    content: [
      { type: "text", text: "first" },
      { type: "text", text: "second" },
    ],
  });
  const result = buildToolCallResult(msg, []);
  assertEquals(result.finalResponse, "first\nsecond");
});

Deno.test("buildToolCallResult - passes usage_metadata", () => {
  const msg = new AIMessage({ content: "ok" });
  msg.usage_metadata = { input_tokens: 10, output_tokens: 5, total_tokens: 15 };
  const result = buildToolCallResult(msg, []);
  assertEquals(result.usageMetadata?.input_tokens, 10);
  assertEquals(result.usageMetadata?.output_tokens, 5);
  assertEquals(result.usageMetadata?.total_tokens, 15);
});

Deno.test("buildToolCallResult - includes collected papers", () => {
  const papers: ArxivPaperMeta[] = [{
    id: "2401.001", title: "T", authors: ["A"],
    summary: "S", arxiv_url: "u", pdf_url: "p", published: "2024",
  }];
  const msg = new AIMessage({ content: "done" });
  const result = buildToolCallResult(msg, papers);
  assertEquals(result.arxivPapers.length, 1);
  assertEquals(result.arxivPapers[0].id, "2401.001");
});
