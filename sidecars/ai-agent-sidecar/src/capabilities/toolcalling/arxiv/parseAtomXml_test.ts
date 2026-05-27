// @ts-ignore
import { assertEquals } from "@std/assert";
import { parseAtomResponse } from "@/capabilities/toolcalling/arxiv/parseAtomXml.ts";

const TESTDATA = new URL("./testdata/", import.meta.url).pathname;

function readFixture(name: string): string {
  return Deno.readTextFileSync(`${TESTDATA}${name}`);
}

Deno.test("parses single paper with all fields", () => {
  const result = parseAtomResponse(readFixture("singlePaper.xml"));

  assertEquals(result.total_results, 1);
  assertEquals(result.papers.length, 1);

  const paper = result.papers[0];
  assertEquals(paper.id, "1706.03762");
  assertEquals(paper.title, "Attention Is All You Need");
  assertEquals(paper.summary, "We propose a new simple network architecture, the Transformer.");
  assertEquals(paper.published, "2017-06-12T17:57:34Z");
  assertEquals(paper.authors, ["Ashish Vaswani", "Noam Shazeer"]);
  assertEquals(paper.categories, ["cs.CL", "cs.LG"]);
});

Deno.test("constructs correct arxiv_url and pdf_url", () => {
  const paper = parseAtomResponse(readFixture("singlePaper.xml")).papers[0];

  assertEquals(paper.arxiv_url, "https://arxiv.org/abs/1706.03762");
  assertEquals(paper.pdf_url, "https://arxiv.org/pdf/1706.03762");
});

Deno.test("strips version suffix from arxiv ID", () => {
  const paper = parseAtomResponse(readFixture("singlePaper.xml")).papers[0];
  assertEquals(paper.id, "1706.03762");
});

Deno.test("parses ID without version suffix", () => {
  const papers = parseAtomResponse(readFixture("multiplePapers.xml")).papers;
  assertEquals(papers[0].id, "2301.07041");
});

Deno.test("parses multiple papers", () => {
  const result = parseAtomResponse(readFixture("multiplePapers.xml"));

  assertEquals(result.total_results, 2);
  assertEquals(result.papers.length, 2);
  assertEquals(result.papers[0].title, "Paper One");
  assertEquals(result.papers[1].title, "Paper Two");
});

Deno.test("handles empty results with zero entries", () => {
  const result = parseAtomResponse(readFixture("emptyResults.xml"));

  assertEquals(result.total_results, 0);
  assertEquals(result.papers, []);
});

Deno.test("handles missing totalResults tag", () => {
  const result = parseAtomResponse(readFixture("missingFields.xml"));
  assertEquals(result.total_results, 0);
});

Deno.test("handles entry with no authors", () => {
  const paper = parseAtomResponse(readFixture("missingFields.xml")).papers[0];
  assertEquals(paper.authors, []);
});

Deno.test("handles entry with no categories", () => {
  const paper = parseAtomResponse(readFixture("missingFields.xml")).papers[0];
  assertEquals(paper.categories, []);
});

Deno.test("returns empty string for missing tag", () => {
  const paper = parseAtomResponse(readFixture("missingFields.xml")).papers[0];
  assertEquals(paper.published, "");
});

Deno.test("normalizes whitespace in title and summary", () => {
  const paper = parseAtomResponse(readFixture("whitespace.xml")).papers[0];

  assertEquals(paper.title, "Messy Title With Whitespace");
  assertEquals(paper.summary, "Summary with lots of extra spaces");
});

Deno.test("falls back for non-standard ID format", () => {
  const paper = parseAtomResponse(readFixture("nonStandardId.xml")).papers[0];

  assertEquals(paper.id, "hep-th/9901001");
  assertEquals(paper.arxiv_url, "https://arxiv.org/abs/hep-th/9901001");
  assertEquals(paper.pdf_url, "https://arxiv.org/pdf/hep-th/9901001");
});

Deno.test("parses large batch of 25 papers", () => {
  const result = parseAtomResponse(readFixture("largeBatch.xml"));

  assertEquals(result.total_results, 25);
  assertEquals(result.papers.length, 25);
});

Deno.test("large batch - first paper has correct fields", () => {
  const paper = parseAtomResponse(readFixture("largeBatch.xml")).papers[0];

  assertEquals(paper.id, "2401.00001");
  assertEquals(paper.title, "Scalable Transformer Architectures for Long Documents");
  assertEquals(paper.authors, ["Alice Zhang", "Bob Smith"]);
  assertEquals(paper.categories, ["cs.CL", "cs.LG"]);
  assertEquals(paper.published, "2024-01-01T00:00:00Z");
});

Deno.test("large batch - last paper has correct fields", () => {
  const paper = parseAtomResponse(readFixture("largeBatch.xml")).papers[24];

  assertEquals(paper.id, "2401.00025");
  assertEquals(paper.title, "Neural Architecture Search with Hardware Constraints");
  assertEquals(paper.authors, ["Maria Santos"]);
  assertEquals(paper.categories, ["cs.LG", "cs.AR"]);
});

Deno.test("large batch - every paper has valid urls", () => {
  const papers = parseAtomResponse(readFixture("largeBatch.xml")).papers;

  for (const paper of papers) {
    assertEquals(paper.arxiv_url, `https://arxiv.org/abs/${paper.id}`);
    assertEquals(paper.pdf_url, `https://arxiv.org/pdf/${paper.id}`);
  }
});

Deno.test("large batch - all IDs are unique", () => {
  const papers = parseAtomResponse(readFixture("largeBatch.xml")).papers;
  const ids = papers.map((p) => p.id);
  const uniqueIds = new Set(ids);

  assertEquals(uniqueIds.size, 25);
});

Deno.test("large batch - version suffixes stripped from all IDs", () => {
  const papers = parseAtomResponse(readFixture("largeBatch.xml")).papers;

  for (const paper of papers) {
    assertEquals(paper.id.match(/v\d+$/), null);
  }
});
