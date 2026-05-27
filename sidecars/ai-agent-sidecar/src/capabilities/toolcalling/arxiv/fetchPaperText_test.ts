// @ts-ignore
import { assertEquals, assertStringIncludes, assertRejects } from "@std/assert";
import { fetchPaperText, fetchAr5ivHtml } from "./fetchPaperText.ts";

function mockFetch(response: { ok: boolean; text: string; status?: number }) {
  const original = globalThis.fetch;
  globalThis.fetch = () =>
    Promise.resolve(
      new Response(response.text, {
        status: response.status ?? (response.ok ? 200 : 500),
      }),
    );
  return () => { globalThis.fetch = original; };
}

function mockFetchError() {
  const original = globalThis.fetch;
  globalThis.fetch = () => Promise.reject(new Error("network error"));
  return () => { globalThis.fetch = original; };
}

Deno.test("fetchPaperText - returns ar5iv text on success", async () => {
  const restore = mockFetch({ ok: true, text: "<p>Hello world</p>" });
  const result = await fetchPaperText("2401.12345");
  assertEquals(result.source, "ar5iv");
  assertStringIncludes(result.fullText, "Hello world");
  restore();
});

Deno.test("fetchPaperText - falls back to abstract on fetch error", async () => {
  const restore = mockFetchError();
  const result = await fetchPaperText("2401.12345", "Abstract fallback");
  assertEquals(result.source, "abstract-only");
  assertEquals(result.fullText, "Abstract fallback");
  restore();
});

Deno.test("fetchPaperText - falls back to abstract on HTTP error", async () => {
  const restore = mockFetch({ ok: false, text: "Not found", status: 404 });
  const result = await fetchPaperText("2401.12345", "My abstract");
  assertEquals(result.source, "abstract-only");
  assertEquals(result.fullText, "My abstract");
  restore();
});

Deno.test("fetchPaperText - default message when no abstract fallback", async () => {
  const restore = mockFetchError();
  const result = await fetchPaperText("2401.12345");
  assertEquals(result.source, "abstract-only");
  assertStringIncludes(result.fullText, "2401.12345");
  restore();
});

Deno.test("fetchPaperText - truncates long text", async () => {
  const longHtml = "<p>" + "a".repeat(10000) + "</p>";
  const restore = mockFetch({ ok: true, text: longHtml });
  const result = await fetchPaperText("2401.12345");
  assertEquals(result.source, "ar5iv");
  assertStringIncludes(result.fullText, "[...truncated]");
  restore();
});

Deno.test("fetchAr5ivHtml - aborts on timeout", async () => {
  const original = globalThis.fetch;
  globalThis.fetch = (_input: string | URL | Request, init?: RequestInit) =>
    new Promise((_resolve, reject) => {
      init?.signal?.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")));
    });
  await assertRejects(() => fetchAr5ivHtml("2401.12345", 10), DOMException);
  globalThis.fetch = original;
});
