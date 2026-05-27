import type { ArxivPaperMeta } from '@/api/types/ai';

const ARXIV_BLOCK_START = '<!-- arxiv-papers';
const ARXIV_BLOCK_END = '-->';
const ARXIV_REGEX = /\n?<!-- arxiv-papers\n([\s\S]*?)\n-->\s*$/;

export function embedArxivPapers(content: string, papers: ArxivPaperMeta[] | undefined): string {
  if (!papers || papers.length === 0) return content;
  const json = JSON.stringify(papers);
  return `${content}\n${ARXIV_BLOCK_START}\n${json}\n${ARXIV_BLOCK_END}`;
}

export interface ExtractedArxivContent {
  displayContent: string;
  papers: ArxivPaperMeta[];
}

export function extractArxivPapers(content: string): ExtractedArxivContent {
  const match = content.match(ARXIV_REGEX);
  if (!match) return { displayContent: content, papers: [] };

  const displayContent = content.slice(0, match.index ?? content.length);
  try {
    const papers = JSON.parse(match[1]) as ArxivPaperMeta[];
    return { displayContent, papers: Array.isArray(papers) ? papers : [] };
  } catch {
    return { displayContent, papers: [] };
  }
}
