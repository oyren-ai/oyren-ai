import { useMemo } from 'react';
import type { ChatMessage } from '../types';
import type { ArxivPaperMeta } from '@/api/types/ai';
import { extractArxivPapers } from '../utils/arxivContentUtils';

interface ArxivPapersResult {
  displayContent: string;
  arxivPapers: ArxivPaperMeta[];
}

export function useArxivPapersFromMessage(message: ChatMessage): ArxivPapersResult {
  return useMemo(() => {
    const { displayContent, papers: embeddedPapers } = extractArxivPapers(message.content);
    const arxivPapers = (message.arxiv_papers && message.arxiv_papers.length > 0)
      ? message.arxiv_papers
      : embeddedPapers;
    return { displayContent, arxivPapers };
  }, [message.content, message.arxiv_papers]);
}
