// @ts-ignore
import { assertEquals } from "@std/assert";
import { arxivSearchTool } from "./arxivSearchTool.ts";

const SINGLE_PAPER_XML = `<?xml version="1.0"?>
<feed xmlns="http://www.w3.org/2005/Atom"
      xmlns:opensearch="http://a9.com/-/spec/opensearch/1.1/">
  <opensearch:totalResults>1</opensearch:totalResults>
  <entry>
    <id>http://arxiv.org/abs/2401.00001v1</id>
    <title>Test Paper</title>
    <summary>A summary.</summary>
    <published>2024-01-01T00:00:00Z</published>
    <author><name>Alice Smith</name></author>
    <author><name>Bob Jones</name></author>
    <author><name>Carol White</name></author>
    <author><name>Dave Brown</name></author>
    <author><name>Eve Black</name></author>
    <author><name>Frank Green</name></author>
    <category term="cs.AI" />
    <category term="cs.LG" />
    <category term="cs.CL" />
    <category term="cs.CV" />
  </entry>
</feed>`;

function mockFetch() {
  const original = globalThis.fetch;
  globalThis.fetch = (_input: string | URL | Request, init?: RequestInit) => {
    if (init?.method === "HEAD") {
      return Promise.resolve(new Response("", { status: 200 }));
    }
    return Promise.resolve(new Response(SINGLE_PAPER_XML, { status: 200 }));
  };
  return () => { globalThis.fetch = original; };
}

Deno.test("arxivSearchTool - returns formatted JSON", async () => {
  const restore = mockFetch();
  const result = await arxivSearchTool.invoke({ query: "transformers", maxResults: 5 });
  const parsed = JSON.parse(result);
  assertEquals(parsed.total_results, 1);
  assertEquals(parsed.papers.length, 1);
  assertEquals(parsed.papers[0].title, "Test Paper");
  restore();
});

Deno.test("arxivSearchTool - keeps authors as array (not string)", async () => {
  const restore = mockFetch();
  const result = await arxivSearchTool.invoke({ query: "test", maxResults: 5 });
  const parsed = JSON.parse(result);
  assertEquals(Array.isArray(parsed.papers[0].authors), true);
  restore();
});

Deno.test("arxivSearchTool - slices authors to 5", async () => {
  const restore = mockFetch();
  const result = await arxivSearchTool.invoke({ query: "test", maxResults: 5 });
  const parsed = JSON.parse(result);
  assertEquals(parsed.papers[0].authors.length, 5);
  assertEquals(parsed.papers[0].authors[4], "Eve Black");
  restore();
});

Deno.test("arxivSearchTool - slices categories to 3", async () => {
  const restore = mockFetch();
  const result = await arxivSearchTool.invoke({ query: "test", maxResults: 5 });
  const parsed = JSON.parse(result);
  assertEquals(parsed.papers[0].categories.length, 3);
  restore();
});

Deno.test("arxivSearchTool - has correct name", () => {
  assertEquals(arxivSearchTool.name, "arxiv_search");
});
