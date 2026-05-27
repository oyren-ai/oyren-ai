// @ts-ignore
import { assertEquals } from "@std/assert";
import { paperToMeta } from "./types.ts";
import type { ArxivPaper } from "./types.ts";

const makePaper = (id: string): ArxivPaper => ({
  id,
  title: "Test Paper",
  authors: ["Alice", "Bob"],
  summary: "A summary",
  published: "2024-06-01",
  arxiv_url: `https://arxiv.org/abs/${id}`,
  pdf_url: `https://arxiv.org/pdf/${id}`,
  categories: ["cs.AI", "cs.LG"],
});

Deno.test("paperToMeta - maps all fields correctly", () => {
  const paper = makePaper("2401.12345");
  const meta = paperToMeta(paper);
  assertEquals(meta.id, "2401.12345");
  assertEquals(meta.title, "Test Paper");
  assertEquals(meta.authors, ["Alice", "Bob"]);
  assertEquals(meta.summary, "A summary");
  assertEquals(meta.arxiv_url, "https://arxiv.org/abs/2401.12345");
  assertEquals(meta.pdf_url, "https://arxiv.org/pdf/2401.12345");
  assertEquals(meta.published, "2024-06-01");
});

Deno.test("paperToMeta - drops categories field", () => {
  const paper = makePaper("2401.12345");
  const meta = paperToMeta(paper);
  // deno-lint-ignore no-explicit-any
  assertEquals((meta as any).categories, undefined);
});

Deno.test("paperToMeta - preserves empty authors array", () => {
  const paper = { ...makePaper("2401.12345"), authors: [] };
  const meta = paperToMeta(paper);
  assertEquals(meta.authors, []);
});
