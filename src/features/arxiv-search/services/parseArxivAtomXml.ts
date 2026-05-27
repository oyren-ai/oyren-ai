import type { ArxivPaperMeta } from '@/api/types/ai';

export interface ArxivSearchResult {
  papers: ArxivPaperMeta[];
  totalResults: number;
}

export function parseArxivAtomXml(xml: string): ArxivSearchResult {
  const totalMatch = xml.match(
    /<opensearch:totalResults[^>]*>(\d+)<\/opensearch:totalResults>/,
  );
  const totalResults = totalMatch ? parseInt(totalMatch[1], 10) : 0;
  const papers = parseEntries(xml);
  return { papers, totalResults };
}

function parseEntries(xml: string): ArxivPaperMeta[] {
  const entries = xml.match(/<entry>([\s\S]*?)<\/entry>/g);
  if (!entries) return [];
  return entries.map(parseEntry);
}

function parseEntry(entry: string): ArxivPaperMeta {
  const id = extractArxivId(entry);
  const title = extractTag(entry, 'title').replace(/\s+/g, ' ').trim();
  const summary = extractTag(entry, 'summary').replace(/\s+/g, ' ').trim();
  const published = extractTag(entry, 'published').trim();
  const authors = extractAuthors(entry);

  return {
    id,
    title,
    authors,
    summary,
    published,
    arxiv_url: `https://arxiv.org/abs/${id}`,
    pdf_url: `https://arxiv.org/pdf/${id}`,
  };
}

function extractArxivId(entry: string): string {
  const idTag = extractTag(entry, 'id');
  const match = idTag.match(/(\d{4}\.\d{4,5})(v\d+)?$/);
  return match ? match[1] : idTag.replace('http://arxiv.org/abs/', '');
}

function extractTag(xml: string, tag: string): string {
  const match = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`));
  return match ? match[1] : '';
}

function extractAuthors(entry: string): string[] {
  const authorMatches = entry.match(/<author>[\s\S]*?<\/author>/g);
  if (!authorMatches) return [];
  return authorMatches.map((a) => extractTag(a, 'name').trim());
}