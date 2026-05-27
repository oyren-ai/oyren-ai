// @ts-ignore
import { assertEquals, assertStringIncludes } from "@std/assert";
import { arxivFetchTool } from "./arxivFetchTool.ts";

function mockFetchHtml(html: string) {
  const original = globalThis.fetch;
  globalThis.fetch = () =>
    Promise.resolve(new Response(html, { status: 200 }));
  return () => { globalThis.fetch = original; };
}

function mockFetchError() {
  const original = globalThis.fetch;
  globalThis.fetch = () => Promise.reject(new Error("network error"));
  return () => { globalThis.fetch = original; };
}

Deno.test("arxivFetchTool - returns JSON with arxiv_id, source, text", async () => {
  const restore = mockFetchHtml("<p>Paper content here</p>");
  const result = await arxivFetchTool.invoke({ arxivId: "2401.12345" });
  const parsed = JSON.parse(result);
  assertEquals(parsed.arxiv_id, "2401.12345");
  assertEquals(parsed.source, "ar5iv");
  assertStringIncludes(parsed.text, "Paper content here");
  restore();
});

Deno.test("arxivFetchTool - falls back to abstract on error", async () => {
  const restore = mockFetchError();
  const result = await arxivFetchTool.invoke({
    arxivId: "2401.12345",
    abstract: "Fallback abstract",
  });
  const parsed = JSON.parse(result);
  assertEquals(parsed.source, "abstract-only");
  assertEquals(parsed.text, "Fallback abstract");
  restore();
});

Deno.test({
  name: "arxivFetchTool - default fallback when no abstract",
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const restore = mockFetchError();
    const result = await arxivFetchTool.invoke({ arxivId: "2401.12345" });
    const parsed = JSON.parse(result);
    assertEquals(parsed.source, "abstract-only");
    assertStringIncludes(parsed.text, "2401.12345");
    restore();
  },
});

Deno.test("arxivFetchTool - has correct name", () => {
  assertEquals(arxivFetchTool.name, "arxiv_fetch");
});
