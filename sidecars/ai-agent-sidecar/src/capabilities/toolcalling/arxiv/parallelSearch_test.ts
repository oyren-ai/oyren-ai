// @ts-ignore
import { assertEquals } from "@std/assert";
import { parallelArxivSearch } from "./parallelSearch.ts";

const makeXml = (id: string, title: string) => `<?xml version="1.0"?>
<feed xmlns="http://www.w3.org/2005/Atom"
      xmlns:opensearch="http://a9.com/-/spec/opensearch/1.1/">
  <opensearch:totalResults>1</opensearch:totalResults>
  <entry>
    <id>http://arxiv.org/abs/${id}v1</id>
    <title>${title}</title>
    <summary>Summary</summary>
    <published>2024-01-01T00:00:00Z</published>
    <author><name>Author</name></author>
    <category term="cs.AI" />
  </entry>
</feed>`;

function mockFetchByQuery(queryToXml: Record<string, string>) {
  const original = globalThis.fetch;
  globalThis.fetch = (input: string | URL | Request, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input.toString();
    if (init?.method === "HEAD") {
      return Promise.resolve(new Response("", { status: 200 }));
    }
    for (const [query, xml] of Object.entries(queryToXml)) {
      if (url.includes(encodeURIComponent(query))) {
        return Promise.resolve(new Response(xml, { status: 200 }));
      }
    }
    return Promise.resolve(new Response("", { status: 500 }));
  };
  return () => { globalThis.fetch = original; };
}

Deno.test("parallelArxivSearch - combines results from multiple queries", async () => {
  const restore = mockFetchByQuery({
    "query1": makeXml("2401.001", "Paper One"),
    "query2": makeXml("2401.002", "Paper Two"),
  });
  const result = await parallelArxivSearch(["query1", "query2"], 5);
  assertEquals(result.papers.length, 2);
  restore();
});

Deno.test("parallelArxivSearch - deduplicates papers", async () => {
  const xml = makeXml("2401.001", "Same Paper");
  const restore = mockFetchByQuery({ "q1": xml, "q2": xml });
  const result = await parallelArxivSearch(["q1", "q2"], 5);
  assertEquals(result.papers.length, 1);
  assertEquals(result.total_results, 1);
  restore();
});

Deno.test("parallelArxivSearch - handles partial failures", async () => {
  const restore = mockFetchByQuery({
    "good": makeXml("2401.001", "Good Paper"),
  });
  const result = await parallelArxivSearch(["good", "bad_query"], 5);
  assertEquals(result.papers.length, 1);
  assertEquals(result.papers[0].title, "Good Paper");
  restore();
});

Deno.test("parallelArxivSearch - returns empty on total failure", async () => {
  const original = globalThis.fetch;
  globalThis.fetch = () => Promise.resolve(new Response("", { status: 500 }));
  const result = await parallelArxivSearch(["a", "b"], 5);
  assertEquals(result.papers.length, 0);
  globalThis.fetch = original;
});
