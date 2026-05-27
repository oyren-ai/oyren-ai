import type { ArxivPaper, ArxivSearchResult } from "./types.ts";

export function parseAtomResponse(xml: string): ArxivSearchResult {
  const totalMatch = xml.match(
    /<opensearch:totalResults[^>]*>(\d+)<\/opensearch:totalResults>/,
  );
  const total_results = totalMatch ? parseInt(totalMatch[1], 10) : 0;

  const papers = parseEntries(xml);
  return { papers, total_results };
}

function parseEntries(xml: string): ArxivPaper[] {
  const entries = xml.match(/<entry>([\s\S]*?)<\/entry>/g);
  if (!entries) return [];
  return entries.map(parseEntry);
}

function parseEntry(entry: string): ArxivPaper {
  const id = extractArxivId(entry);
  const title = extractTag(entry, "title").replace(/\s+/g, " ").trim();
  const summary = extractTag(entry, "summary").replace(/\s+/g, " ").trim();
  const published = extractTag(entry, "published").trim();
  const authors = extractAuthors(entry);
  const categories = extractCategories(entry);

  return {
    id, title, authors, summary, published,
    arxiv_url: `https://arxiv.org/abs/${id}`,
    pdf_url: `https://arxiv.org/pdf/${id}`,
    categories,
  };
}

function extractArxivId(entry: string): string {
  const idTag = extractTag(entry, "id");
  const match = idTag.match(/(\d{4}\.\d{4,5})(v\d+)?$/);
  return match ? match[1] : idTag.replace("http://arxiv.org/abs/", "");
}

function extractTag(xml: string, tag: string): string {
  const match = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`));
  return match ? match[1] : "";
}

function extractAuthors(entry: string): string[] {
  const authorMatches = entry.match(/<author>[\s\S]*?<\/author>/g);
  if (!authorMatches) return [];
  return authorMatches.map((a) => extractTag(a, "name").trim());
}

function extractCategories(entry: string): string[] {
  const catMatches = entry.match(/term="([^"]+)"/g);
  if (!catMatches) return [];
  return catMatches.map((c) => c.replace('term="', "").replace('"', ""));
}
