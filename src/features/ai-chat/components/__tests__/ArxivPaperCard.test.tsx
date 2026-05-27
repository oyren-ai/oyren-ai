import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import ArxivPaperCard from '../ArxivPaperCard';
import type { ArxivPaperMeta } from '@/api/types/ai';

vi.mock('@/api/browserApi', () => ({
  browserApi: { openUrl: vi.fn() },
}));

vi.mock('lucide-react', async () => {
  const actual = await vi.importActual('lucide-react');
  return {
    ...actual,
    ExternalLink: () => React.createElement('svg', { 'data-testid': 'icon-external-link' }),
    Download: () => React.createElement('svg', { 'data-testid': 'icon-download' }),
    ChevronDown: () => React.createElement('svg', { 'data-testid': 'icon-chevron-down' }),
    ChevronUp: () => React.createElement('svg', { 'data-testid': 'icon-chevron-up' }),
  };
});

const longSummary = 'A'.repeat(200);

const mockPaper: ArxivPaperMeta = {
  id: '2401.00001',
  title: 'Attention Is All You Need',
  authors: ['Vaswani', 'Shazeer', 'Parmar', 'Jones'],
  summary: longSummary,
  arxiv_url: 'https://arxiv.org/abs/2401.00001',
  pdf_url: 'https://arxiv.org/pdf/2401.00001',
  published: '2024-01-15',
};

const shortPaper: ArxivPaperMeta = {
  ...mockPaper,
  id: '2401.00002',
  summary: 'Short abstract.',
  authors: ['Author A', 'Author B'],
};

describe('ArxivPaperCard', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders title, authors, and formatted date', () => {
    render(<ArxivPaperCard paper={shortPaper} />);
    expect(screen.getByText('Attention Is All You Need')).toBeInTheDocument();
    expect(screen.getByText('Author A, Author B')).toBeInTheDocument();
    expect(screen.getByText('Jan 15, 2024')).toBeInTheDocument();
  });

  it('truncates authors when more than 3', () => {
    render(<ArxivPaperCard paper={mockPaper} />);
    expect(screen.getByText('Vaswani, Shazeer, Parmar +1 more')).toBeInTheDocument();
  });

  it('shows line-clamp-3 on abstract by default for long summaries', () => {
    const { container } = render(<ArxivPaperCard paper={mockPaper} />);
    const abstractEl = container.querySelector('.line-clamp-3');
    expect(abstractEl).toBeInTheDocument();
    expect(abstractEl?.classList.contains('overflow-hidden')).toBe(true);
  });

  it('shows "Show more" button for long summaries', () => {
    render(<ArxivPaperCard paper={mockPaper} />);
    expect(screen.getByText('Show more')).toBeInTheDocument();
  });

  it('clicking "Show more" removes line-clamp-3 and shows "Show less"', () => {
    const { container } = render(<ArxivPaperCard paper={mockPaper} />);
    fireEvent.click(screen.getByText('Show more'));

    expect(screen.getByText('Show less')).toBeInTheDocument();
    expect(container.querySelector('.line-clamp-3')).not.toBeInTheDocument();
  });

  it('clicking "Show less" restores line-clamp-3', () => {
    const { container } = render(<ArxivPaperCard paper={mockPaper} />);
    fireEvent.click(screen.getByText('Show more'));
    fireEvent.click(screen.getByText('Show less'));

    expect(container.querySelector('.line-clamp-3')).toBeInTheDocument();
  });

  it('does not show toggle button for short summaries', () => {
    render(<ArxivPaperCard paper={shortPaper} />);
    expect(screen.queryByText('Show more')).not.toBeInTheDocument();
  });

  it('Save PDF button calls onSave with paper', () => {
    const onSave = vi.fn();
    render(<ArxivPaperCard paper={mockPaper} onSave={onSave} />);
    fireEvent.click(screen.getByText('Save PDF'));
    expect(onSave).toHaveBeenCalledWith(mockPaper);
  });

  it('Save PDF button disabled when isSaving', () => {
    const onSave = vi.fn();
    render(<ArxivPaperCard paper={mockPaper} onSave={onSave} isSaving />);
    const btn = screen.getByText('Save PDF').closest('button');
    expect(btn).toBeDisabled();
  });

  it('ArXiv button calls browserApi.openUrl', async () => {
    const { browserApi } = await import('@/api/browserApi');
    render(<ArxivPaperCard paper={mockPaper} />);
    fireEvent.click(screen.getByText('ArXiv'));
    expect(browserApi.openUrl).toHaveBeenCalledWith('https://arxiv.org/abs/2401.00001');
  });
});
