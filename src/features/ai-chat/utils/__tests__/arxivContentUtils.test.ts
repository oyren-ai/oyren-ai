import { describe, it, expect } from 'vitest';
import { embedArxivPapers, extractArxivPapers } from '../arxivContentUtils';
import type { ArxivPaperMeta } from '@/api/types/ai';

const mockPaper: ArxivPaperMeta = {
  id: '2401.00001', title: 'Test Paper', authors: ['Author A'],
  summary: 'A test summary', arxiv_url: 'https://arxiv.org/abs/2401.00001',
  pdf_url: 'https://arxiv.org/pdf/2401.00001', published: '2024-01-01',
};

describe('arxivContentUtils', () => {
  describe('embedArxivPapers', () => {
    it('appends HTML comment block with JSON', () => {
      const result = embedArxivPapers('Hello', [mockPaper]);
      expect(result).toContain('Hello');
      expect(result).toContain('<!-- arxiv-papers');
      expect(result).toContain('-->');
      expect(result).toContain('"id":"2401.00001"');
    });

    it('returns content unchanged when no papers', () => {
      expect(embedArxivPapers('Hello', undefined)).toBe('Hello');
      expect(embedArxivPapers('Hello', [])).toBe('Hello');
    });
  });

  describe('extractArxivPapers', () => {
    it('extracts papers and strips block', () => {
      const embedded = embedArxivPapers('Hello world', [mockPaper]);
      const { displayContent, papers } = extractArxivPapers(embedded);
      expect(displayContent).toBe('Hello world');
      expect(papers).toHaveLength(1);
      expect(papers[0].id).toBe('2401.00001');
    });

    it('returns original content when no block present', () => {
      const { displayContent, papers } = extractArxivPapers('Just text');
      expect(displayContent).toBe('Just text');
      expect(papers).toEqual([]);
    });

    it('handles malformed JSON gracefully', () => {
      const content = 'Hello\n<!-- arxiv-papers\n{invalid json\n-->';
      const { displayContent, papers } = extractArxivPapers(content);
      expect(displayContent).toBe('Hello');
      expect(papers).toEqual([]);
    });

    it('round-trips multiple papers', () => {
      const paper2: ArxivPaperMeta = { ...mockPaper, id: '2401.00002', title: 'Second' };
      const embedded = embedArxivPapers('Content', [mockPaper, paper2]);
      const { displayContent, papers } = extractArxivPapers(embedded);
      expect(displayContent).toBe('Content');
      expect(papers).toHaveLength(2);
      expect(papers[1].title).toBe('Second');
    });
  });
});
