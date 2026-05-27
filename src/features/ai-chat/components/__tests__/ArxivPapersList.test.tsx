import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import ArxivPapersList from '../ArxivPapersList';
import type { ArxivPaperMeta } from '@/api/types/ai';

vi.mock('../ArxivPaperCard', () => ({
  default: ({ paper }: { paper: ArxivPaperMeta }) => (
    <div data-testid={`arxiv-card-${paper.id}`}>{paper.title}</div>
  ),
}));

vi.mock('lucide-react', async () => {
  const actual = await vi.importActual('lucide-react');
  return {
    ...actual,
    BookOpen: () => React.createElement('svg', { 'data-testid': 'icon-book-open' }),
  };
});

const makePaper = (id: string, title: string): ArxivPaperMeta => ({
  id,
  title,
  authors: ['Author'],
  summary: 'Summary',
  arxiv_url: `https://arxiv.org/abs/${id}`,
  pdf_url: `https://arxiv.org/pdf/${id}`,
  published: '2024-01-01',
});

describe('ArxivPapersList', () => {
  it('returns null when papers is empty', () => {
    const { container } = render(<ArxivPapersList papers={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders correct header count for single paper', () => {
    render(<ArxivPapersList papers={[makePaper('1', 'Paper A')]} />);
    expect(screen.getByText('Found 1 relevant paper:')).toBeInTheDocument();
  });

  it('renders correct header count for multiple papers', () => {
    const papers = [makePaper('1', 'A'), makePaper('2', 'B'), makePaper('3', 'C')];
    render(<ArxivPapersList papers={papers} />);
    expect(screen.getByText('Found 3 relevant papers:')).toBeInTheDocument();
  });

  it('renders one ArxivPaperCard per paper', () => {
    const papers = [makePaper('1', 'Alpha'), makePaper('2', 'Beta')];
    render(<ArxivPapersList papers={papers} />);
    expect(screen.getByTestId('arxiv-card-1')).toBeInTheDocument();
    expect(screen.getByTestId('arxiv-card-2')).toBeInTheDocument();
  });
});
