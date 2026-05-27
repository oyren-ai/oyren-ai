// @ts-ignore
import { assertEquals, assertRejects, assertStringIncludes } from "@std/assert";
import { searchArxiv, searchArxivWithIntent } from "./searchArxiv.ts";
import { UserIntent } from "@/intent/types.ts";

const SINGLE_PAPER_XML = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom"
      xmlns:opensearch="http://a9.com/-/spec/opensearch/1.1/">
  <opensearch:totalResults>1</opensearch:totalResults>
  <entry>
    <id>http://arxiv.org/abs/2401.00001v1</id>
    <title>Test Paper</title>
    <summary>A test summary.</summary>
    <published>2024-01-01T00:00:00Z</published>
    <author><name>Alice</name></author>
    <category term="cs.AI" />
  </entry>
</feed>`;

function mockFetchXml(xml: string) {
  const original = globalThis.fetch;
  const calls: string[] = [];
  globalThis.fetch = (input: string | URL | Request, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input.toString();
    calls.push(url);
    // HEAD requests from filterWithdrawnPapers
    if (init?.method === "HEAD") {
      return Promise.resolve(new Response("", { status: 200 }));
    }
    return Promise.resolve(new Response(xml, { status: 200 }));
  };
  return { restore: () => { globalThis.fetch = original; }, calls };
}

function mockFetchError(status: number) {
  const original = globalThis.fetch;
  globalThis.fetch = () =>
    Promise.resolve(new Response("error", { status }));
  return () => { globalThis.fetch = original; };
}

Deno.test("searchArxiv - returns parsed papers", async () => {
  const { restore } = mockFetchXml(SINGLE_PAPER_XML);
  const result = await searchArxiv("test query", 5);
  assertEquals(result.papers.length, 1);
  assertEquals(result.papers[0].title, "Test Paper");
  assertEquals(result.total_results, 1);
  restore();
});

Deno.test("searchArxiv - clamps maxResults to minimum 1", async () => {
  const { restore, calls } = mockFetchXml(SINGLE_PAPER_XML);
  await searchArxiv("test", 0);
  assertStringIncludes(calls[0], "max_results=1");
  restore();
});

Deno.test("searchArxiv - clamps maxResults to maximum 10", async () => {
  const { restore, calls } = mockFetchXml(SINGLE_PAPER_XML);
  await searchArxiv("test", 15);
  assertStringIncludes(calls[0], "max_results=10");
  restore();
});

Deno.test("searchArxiv - passes through valid maxResults", async () => {
  const { restore, calls } = mockFetchXml(SINGLE_PAPER_XML);
  await searchArxiv("test", 5);
  assertStringIncludes(calls[0], "max_results=5");
  restore();
});

Deno.test("searchArxiv - throws on HTTP error", async () => {
  const restore = mockFetchError(500);
  await assertRejects(
    () => searchArxiv("test", 5),
    Error,
    "ArXiv API error",
  );
  restore();
});

Deno.test("searchArxiv - URL encodes query", async () => {
  const { restore, calls } = mockFetchXml(SINGLE_PAPER_XML);
  await searchArxiv("machine learning & AI", 5);
  assertStringIncludes(calls[0], "machine%20learning%20%26%20AI");
  restore();
});

Deno.test("searchArxivWithIntent - returns empty for no queries", async () => {
  const intent = new UserIntent({
    intent: "paper_search",
    topics: [],
    keywords: [],
  });
  const result = await searchArxivWithIntent(intent);
  assertEquals(result.papers.length, 0);
  assertEquals(result.total_results, 0);
});

Deno.test("searchArxivWithIntent - runs parallel search with queries", async () => {
  const { restore } = mockFetchXml(SINGLE_PAPER_XML);
  const intent = new UserIntent({
    intent: "paper_search",
    topics: ["transformers"],
    keywords: ["attention"],
  });
  const result = await searchArxivWithIntent(intent);
  assertEquals(result.papers.length > 0, true);
  assertEquals(result.papers[0].title, "Test Paper");
  restore();
});
