// @ts-ignore
import { assertEquals } from "@std/assert";
import { filterWithdrawnPapers, isPdfAccessible } from "./filterWithdrawnPapers.ts";
import type { ArxivPaper } from "./types.ts";

const makePaper = (id: string): ArxivPaper => ({
  id, title: "Paper", authors: ["Author"], summary: "Summary",
  published: "2024-01-01", arxiv_url: `https://arxiv.org/abs/${id}`,
  pdf_url: `https://arxiv.org/pdf/${id}`, categories: ["cs.AI"],
});

function mockFetch(statusByUrl: Record<string, number | "error">) {
  const original = globalThis.fetch;
  globalThis.fetch = (input: string | URL | Request, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input.toString();
    const status = Object.entries(statusByUrl).find(([k]) => url.includes(k));
    if (status && status[1] === "error") {
      return Promise.reject(new Error("network error"));
    }
    const code = status ? status[1] as number : 200;
    return Promise.resolve(new Response("", { status: code }));
  };
  return () => { globalThis.fetch = original; };
}

Deno.test("filterWithdrawnPapers - keeps papers with 200 status", async () => {
  const restore = mockFetch({ "2401.001": 200, "2401.002": 200 });
  const result = await filterWithdrawnPapers([makePaper("2401.001"), makePaper("2401.002")]);
  assertEquals(result.length, 2);
  restore();
});

Deno.test("filterWithdrawnPapers - filters out 404 papers", async () => {
  const restore = mockFetch({ "2401.001": 200, "2401.002": 404 });
  const result = await filterWithdrawnPapers([makePaper("2401.001"), makePaper("2401.002")]);
  assertEquals(result.length, 1);
  assertEquals(result[0].id, "2401.001");
  restore();
});

Deno.test({
  name: "filterWithdrawnPapers - keeps papers on fetch error",
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const restore = mockFetch({ "2401.001": "error" });
    const result = await filterWithdrawnPapers([makePaper("2401.001")]);
    assertEquals(result.length, 1);
    restore();
  },
});

Deno.test("filterWithdrawnPapers - handles empty array", async () => {
  const result = await filterWithdrawnPapers([]);
  assertEquals(result.length, 0);
});

Deno.test("isPdfAccessible - returns true on timeout (abort fires)", async () => {
  const original = globalThis.fetch;
  globalThis.fetch = (_input: string | URL | Request, init?: RequestInit) =>
    new Promise((_resolve, reject) => {
      init?.signal?.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")));
    });
  const result = await isPdfAccessible("https://example.com/test.pdf", 10);
  assertEquals(result, true);
  globalThis.fetch = original;
});
