// @ts-ignore
import { assertEquals } from "@std/assert";
import { deduplicatePapers } from "./deduplicateResults.ts";
import type { ArxivPaper } from "./types.ts";

const makePaper = (id: string, title = "Paper"): ArxivPaper => ({
  id, title, authors: ["Author"], summary: "Summary",
  published: "2024-01-01", arxiv_url: `https://arxiv.org/abs/${id}`,
  pdf_url: `https://arxiv.org/pdf/${id}`, categories: ["cs.AI"],
});

Deno.test("deduplicatePapers - removes duplicate IDs", () => {
  const papers = [makePaper("1"), makePaper("1"), makePaper("2")];
  const result = deduplicatePapers(papers);
  assertEquals(result.length, 2);
});

Deno.test("deduplicatePapers - sorts by occurrence count descending", () => {
  const papers = [
    makePaper("A"), makePaper("B"), makePaper("A"),
    makePaper("B"), makePaper("B"), makePaper("C"),
  ];
  const result = deduplicatePapers(papers);
  assertEquals(result[0].id, "B"); // 3 occurrences
  assertEquals(result[1].id, "A"); // 2 occurrences
  assertEquals(result[2].id, "C"); // 1 occurrence
});

Deno.test("deduplicatePapers - handles empty array", () => {
  assertEquals(deduplicatePapers([]).length, 0);
});

Deno.test("deduplicatePapers - keeps first paper when duplicated", () => {
  const p1 = makePaper("1", "First");
  const p2 = makePaper("1", "Second");
  const result = deduplicatePapers([p1, p2]);
  assertEquals(result[0].title, "First");
});
