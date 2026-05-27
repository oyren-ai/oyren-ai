import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import PdfLoadingStates, { NoPdfSelected, PdfLoading, EmptyState } from '../PdfLoadingStates';

// Mock LoadingSpinner
vi.mock('@/components/common/LoadingSpinner', () => ({
  default: () => <div data-testid="loading-spinner">Loading...</div>
}));

describe('PdfLoadingStates', () => {
  describe('NoPdfSelected Component', () => {
    it('renders no PDF loaded message', () => {
      render(<NoPdfSelected />);
      
      expect(screen.getByText('No PDF loaded')).toBeInTheDocument();
    });

    it('applies correct styling', () => {
      const { container } = render(<NoPdfSelected />);
      
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('flex', 'items-center', 'justify-center', 'h-full');
    });

    it('applies dark mode classes', () => {
      const { container } = render(<NoPdfSelected />);
      
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('bg-white', 'dark:bg-gray-800');
    });
  });

  describe('PdfLoading Component', () => {
    it('renders loading spinner', () => {
      render(<PdfLoading />);

      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });

    it('renders loading message', () => {
      render(<PdfLoading />);

      expect(screen.getByText('Loading PDF document...')).toBeInTheDocument();
    });

    it('renders loading message with filename when provided', () => {
      render(<PdfLoading fileName="research-paper.pdf" />);

      expect(screen.getByText('Loading research-paper.pdf...')).toBeInTheDocument();
    });

    it('applies correct layout styling', () => {
      const { container } = render(<PdfLoading />);
      
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('flex', 'items-center', 'justify-center', 'h-full');
    });

    it('centers content with text-center', () => {
      const { container } = render(<PdfLoading />);
      
      const textContainer = container.querySelector('.text-center');
      expect(textContainer).toBeInTheDocument();
    });
  });

  describe('EmptyState Component', () => {
    it('renders empty state message', () => {
      render(<EmptyState />);
      
      expect(screen.getByText(/No PDF selected/i)).toBeInTheDocument();
      expect(screen.getByText(/Click "Open PDF" to select a file/i)).toBeInTheDocument();
    });

    it('applies correct styling', () => {
      const { container } = render(<EmptyState />);
      
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('flex', 'items-center', 'justify-center', 'h-full');
    });
  });

  describe('PdfLoadingStates Main Component', () => {
    it('renders NoPdfSelected when pdfFilePath is null', () => {
      render(<PdfLoadingStates pdfFilePath={null} pdfUrl={null} />);
      
      expect(screen.getByText('No PDF loaded')).toBeInTheDocument();
    });

    it('renders PdfLoading when pdfFilePath exists but pdfUrl is null', () => {
      render(<PdfLoadingStates pdfFilePath="/test.pdf" pdfUrl={null} />);
      
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
      expect(screen.getByText('Loading PDF document...')).toBeInTheDocument();
    });

    it('renders nothing when both pdfFilePath and pdfUrl exist', () => {
      const { container } = render(<PdfLoadingStates pdfFilePath="/test.pdf" pdfUrl="blob:test" />);
      
      expect(container.firstChild).toBeNull();
    });

    it('renders NoPdfSelected when pdfFilePath is empty string', () => {
      render(<PdfLoadingStates pdfFilePath="" pdfUrl={null} />);
      
      expect(screen.getByText('No PDF loaded')).toBeInTheDocument();
    });
  });

  describe('State Transitions', () => {
    it('transitions from NoPdfSelected to PdfLoading', () => {
      const { rerender } = render(<PdfLoadingStates pdfFilePath={null} pdfUrl={null} />);
      
      expect(screen.getByText('No PDF loaded')).toBeInTheDocument();
      
      rerender(<PdfLoadingStates pdfFilePath="/test.pdf" pdfUrl={null} />);
      
      expect(screen.queryByText('No PDF loaded')).not.toBeInTheDocument();
      expect(screen.getByText('Loading PDF document...')).toBeInTheDocument();
    });

    it('transitions from PdfLoading to loaded (null)', () => {
      const { rerender, container } = render(
        <PdfLoadingStates pdfFilePath="/test.pdf" pdfUrl={null} />
      );
      
      expect(screen.getByText('Loading PDF document...')).toBeInTheDocument();
      
      rerender(<PdfLoadingStates pdfFilePath="/test.pdf" pdfUrl="blob:test-url" />);
      
      expect(container.firstChild).toBeNull();
    });

    it('transitions back to NoPdfSelected when PDF is unloaded', () => {
      const { rerender } = render(
        <PdfLoadingStates pdfFilePath="/test.pdf" pdfUrl="blob:test-url" />
      );
      
      rerender(<PdfLoadingStates pdfFilePath={null} pdfUrl={null} />);
      
      expect(screen.getByText('No PDF loaded')).toBeInTheDocument();
    });
  });

  describe('Dark Mode', () => {
    it('NoPdfSelected has dark mode support', () => {
      const { container } = render(<NoPdfSelected />);
      
      const text = screen.getByText('No PDF loaded');
      expect(text).toHaveClass('text-gray-500', 'dark:text-gray-400');
    });

    it('PdfLoading has dark mode support', () => {
      render(<PdfLoading />);
      const text = screen.getByText('Loading PDF document...');
      expect(text).toHaveClass('dark:text-gray-400');
    });
  });
});



