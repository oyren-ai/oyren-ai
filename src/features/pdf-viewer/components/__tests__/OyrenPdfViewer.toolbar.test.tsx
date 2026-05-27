import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import React from 'react';
import OyrenPdfViewer from '../OyrenPdfViewer';
import { ScrollPersistenceProvider } from '@/contexts/ScrollPersistenceContext';

// Mock lucide-react icons
vi.mock('lucide-react', async () => {
  const actual = await vi.importActual('lucide-react');
  return {
    ...actual,
    ZoomIn: () => <span>ZoomIn</span>,
    ZoomOut: () => <span>ZoomOut</span>,
    RotateCw: () => <span>RotateCw</span>,
    Download: () => <span>Download</span>,
    ChevronLeft: () => <span>ChevronLeft</span>,
    ChevronRight: () => <span>ChevronRight</span>,
    Search: () => <span>Search</span>,
    BookOpen: () => <span>BookOpen</span>,
    Bookmark: () => <span>Bookmark</span>,
    Sparkles: () => <span>Sparkles</span>,
    X: () => <span>X</span>,
    ChevronUp: () => <span>ChevronUp</span>,
    ChevronDown: () => <span>ChevronDown</span>,
  };
});

// Mock hooks
vi.mock('../../../pdf-viewer/hooks/usePdfLoader', () => ({
  usePdfLoader: () => ({
    pdfUrl: 'blob:mock-pdf-url',
    handleDocumentLoad: vi.fn()
  })
}));

// usePdfZoom is no longer used - replaced by useSmoothPdfZoom and useSmoothGestureZoom

vi.mock('../../../pdf-viewer/hooks/useSnippetMode', () => ({
  useSnippetMode: () => ({
    isSnippetMode: false,
    setIsSnippetMode: vi.fn(),
    handleSnippetClick: vi.fn()
  })
}));

const mockZoomTo = vi.fn();
const mockJumpToMatch = vi.fn();
const mockHighlight = vi.fn().mockResolvedValue([{ pageIndex: 0 }, { pageIndex: 1 }]);
const mockClearHighlights = vi.fn();

// Track onScaleChange callback to simulate Viewer onZoom event
// Using an object to allow the mock function to access the current value
const mockOnScaleChangeRef = { current: null as ((scale: number) => void) | null };

vi.mock('../../../pdf-viewer/hooks/usePdfViewerPlugins', () => ({
  usePdfViewerPlugins: () => ({
    zoomPlugin: {
      zoomTo: (scale: number) => {
        mockZoomTo(scale);
        // Simulate Viewer onZoom event - trigger state update
        // For tests, we'll make it synchronous to avoid timing features
        // In real usage, this would be async via the Viewer's onZoom event
        if (mockOnScaleChangeRef.current) {
          // Use act to wrap the state update for React
          act(() => {
            mockOnScaleChangeRef.current?.(scale);
          });
        }
      }
    },
    bookmarkPlugin: {
      Bookmarks: () => <div>Bookmarks</div>
    },
    searchPlugin: {
      highlight: mockHighlight,
      clearHighlights: mockClearHighlights,
      jumpToMatch: mockJumpToMatch
    },
    highlightPlugin: {},
    pageNavigationPlugin: {
      jumpToPage: vi.fn(),
      CurrentPageInput: () => <input readOnly value="5" aria-label="Page" />,
      NumberOfPages: () => <span>10</span>,
      GoToNextPage: ({ children }: any) => children({ onClick: vi.fn(), isDisabled: false }),
      GoToPreviousPage: ({ children }: any) => children({ onClick: vi.fn(), isDisabled: false }),
    },
    rotatePlugin: {
      Rotate: ({ children }: any) =>
        typeof children === 'function' ? children({ onClick: vi.fn() }) : children,
    },
  })
}));

vi.mock('../PdfContainer', () => ({
  default: ({ onScaleChange, currentScale }: any) => {
    // Store the callback so zoomPlugin.zoomTo can trigger it
    mockOnScaleChangeRef.current = onScaleChange;
    return <div data-testid="pdf-container">PDF Content (scale: {currentScale})</div>;
  }
}));

vi.mock('../BookmarksDropdown', () => ({
  default: () => <div data-testid="bookmarks-dropdown">Bookmarks</div>
}));

// Test wrapper with ScrollPersistenceProvider
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <ScrollPersistenceProvider>
    {children}
  </ScrollPersistenceProvider>
);

describe('OyrenPdfViewer - Inline Toolbar Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOnScaleChangeRef.current = null;
  });

  describe('Pagination Controls', () => {
    it('renders page navigation with current page and total pages', () => {
      render(<OyrenPdfViewer pdfFilePath="/test.pdf" isDarkMode={false} />, { wrapper: TestWrapper });

      expect(screen.getByDisplayValue('5')).toBeInTheDocument();
      expect(screen.getByText('10')).toBeInTheDocument();
      expect(screen.getByText('/')).toBeInTheDocument();
    });

    it('renders previous and next page buttons', () => {
      render(<OyrenPdfViewer pdfFilePath="/test.pdf" isDarkMode={false} />, { wrapper: TestWrapper });

      const prevButton = screen.getByTitle('Previous page');
      const nextButton = screen.getByTitle('Next page');

      expect(prevButton).toBeInTheDocument();
      expect(nextButton).toBeInTheDocument();
    });
  });

  describe('Zoom Controls', () => {
    it('renders zoom in and zoom out buttons', () => {
      render(<OyrenPdfViewer pdfFilePath="/test.pdf" isDarkMode={false} />, { wrapper: TestWrapper });

      expect(screen.getByTitle('Zoom In')).toBeInTheDocument();
      expect(screen.getByTitle('Zoom Out')).toBeInTheDocument();
    });

    it('displays current zoom level as percentage', () => {
      render(<OyrenPdfViewer pdfFilePath="/test.pdf" isDarkMode={false} />, { wrapper: TestWrapper });

      // Default scale is 1 (100%)
      expect(screen.getByText('100%')).toBeInTheDocument();
    });

    it('increases zoom level when zoom in button is clicked', async () => {
      render(<OyrenPdfViewer pdfFilePath="/test.pdf" isDarkMode={false} />, { wrapper: TestWrapper });

      const zoomInBtn = screen.getByTitle('Zoom In');
      fireEvent.click(zoomInBtn);

      await waitFor(() => {
        expect(mockZoomTo).toHaveBeenCalledWith(1.2);
        expect(screen.getByText('120%')).toBeInTheDocument();
      });
    });

    it('decreases zoom level when zoom out button is clicked', async () => {
      render(<OyrenPdfViewer pdfFilePath="/test.pdf" isDarkMode={false} />, { wrapper: TestWrapper });

      const zoomOutBtn = screen.getByTitle('Zoom Out');
      fireEvent.click(zoomOutBtn);

      await waitFor(() => {
        expect(mockZoomTo).toHaveBeenCalledWith(0.8);
        expect(screen.getByText('80%')).toBeInTheDocument();
      });
    });

    it('does not zoom in beyond 300%', async () => {
      render(<OyrenPdfViewer pdfFilePath="/test.pdf" isDarkMode={false} />, { wrapper: TestWrapper });

      const zoomInBtn = screen.getByTitle('Zoom In');

      // Click 15 times to try to exceed 300%
      // Wait for each click to process to ensure state updates
      for (let i = 0; i < 15; i++) {
        fireEvent.click(zoomInBtn);
        // Small delay to allow coordinator to process
        await act(async () => {
          await new Promise(resolve => setTimeout(resolve, 10));
        });
      }

      await waitFor(() => {
        expect(screen.getByText('300%')).toBeInTheDocument();
      });
    });

    it('does not zoom out below 50%', async () => {
      render(<OyrenPdfViewer pdfFilePath="/test.pdf" isDarkMode={false} />, { wrapper: TestWrapper });

      const zoomOutBtn = screen.getByTitle('Zoom Out');

      // Click 10 times to try to go below 50%
      // Wait for each click to process to ensure state updates
      for (let i = 0; i < 10; i++) {
        fireEvent.click(zoomOutBtn);
        // Small delay to allow coordinator to process
        await act(async () => {
          await new Promise(resolve => setTimeout(resolve, 10));
        });
      }

      await waitFor(() => {
        expect(screen.getByText('50%')).toBeInTheDocument();
      });
    });
  });

  describe('Bookmarks Button', () => {
    it('renders bookmarks button', () => {
      render(<OyrenPdfViewer pdfFilePath="/test.pdf" isDarkMode={false} />, { wrapper: TestWrapper });

      // "Bookmarks" appears in both the button and the dropdown, so use getAllByText
      expect(screen.getAllByText('Bookmarks').length).toBeGreaterThan(0);
    });

    it('shows bookmarks dropdown initially', () => {
      render(<OyrenPdfViewer pdfFilePath="/test.pdf" isDarkMode={false} />, { wrapper: TestWrapper });

      // Bookmarks dropdown is shown by default in our mock
      expect(screen.getByTestId('bookmarks-dropdown')).toBeInTheDocument();
    });
  });

  describe('Search Functionality', () => {
    it('initially shows search button in collapsed state', () => {
      render(<OyrenPdfViewer pdfFilePath="/test.pdf" isDarkMode={false} />, { wrapper: TestWrapper });

      const searchBtn = screen.getByTitle('Find in document (Ctrl+F)');
      expect(searchBtn).toBeInTheDocument();
      expect(screen.queryByPlaceholderText('Type or paste to search…')).not.toBeInTheDocument();
    });

    it('expands search input when search button is clicked', async () => {
      render(<OyrenPdfViewer pdfFilePath="/test.pdf" isDarkMode={false} />, { wrapper: TestWrapper });

      const searchBtn = screen.getByTitle('Find in document (Ctrl+F)');
      fireEvent.click(searchBtn);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Type or paste to search…')).toBeInTheDocument();
      });
    });

    // Find button test removed as it is replaced by auto-search/Enter key

    it('performs search when Enter key is pressed', async () => {
      render(<OyrenPdfViewer pdfFilePath="/test.pdf" isDarkMode={false} />, { wrapper: TestWrapper });

      fireEvent.click(screen.getByTitle('Find in document (Ctrl+F)'));

      const searchInput = screen.getByPlaceholderText('Type or paste to search…');
      fireEvent.change(searchInput, { target: { value: 'enter search' } });
      fireEvent.keyDown(searchInput, { key: 'Enter', code: 'Enter', shiftKey: false });

      await waitFor(() => {
        expect(mockHighlight).toHaveBeenCalled();
      });
    });

    it('updates search input value when typing', () => {
      render(<OyrenPdfViewer pdfFilePath="/test.pdf" isDarkMode={false} />, { wrapper: TestWrapper });

      fireEvent.click(screen.getByTitle('Find in document (Ctrl+F)'));

      const searchInput = screen.getByPlaceholderText('Type or paste to search…');
      fireEvent.change(searchInput, { target: { value: 'test query' } });

      expect(searchInput).toHaveValue('test query');
    });

    it('shows search input when search button is clicked', () => {
      render(<OyrenPdfViewer pdfFilePath="/test.pdf" isDarkMode={false} />, { wrapper: TestWrapper });

      fireEvent.click(screen.getByTitle('Find in document (Ctrl+F)'));

      const searchInput = screen.getByPlaceholderText('Type or paste to search…');
      expect(searchInput).toBeInTheDocument();
    });

    it('does not search for empty or whitespace-only keywords', async () => {
      render(<OyrenPdfViewer pdfFilePath="/test.pdf" isDarkMode={false} />, { wrapper: TestWrapper });

      fireEvent.click(screen.getByTitle('Find in document (Ctrl+F)'));

      const searchInput = screen.getByPlaceholderText('Type or paste to search…');
      fireEvent.change(searchInput, { target: { value: '   ' } });
      fireEvent.keyDown(searchInput, { key: 'Enter', shiftKey: false });

      await waitFor(() => {
        expect(mockHighlight).not.toHaveBeenCalled();
      });
    });

    it.skip('clears highlights and collapses search when Clear is clicked', async () => {
      render(<OyrenPdfViewer pdfFilePath="/test.pdf" isDarkMode={false} />, { wrapper: TestWrapper });

      fireEvent.click(screen.getByTitle('Find in document (Ctrl+F)'));
      const searchInput = screen.getByPlaceholderText('Type or paste to search…');
      fireEvent.change(searchInput, { target: { value: 'abc' } });

      const clearBtn = screen.getByTitle('Clear');
      fireEvent.click(clearBtn);

      await waitFor(() => {
        expect(mockClearHighlights).toHaveBeenCalled();
      });

      expect(screen.getByTitle('Find in document (Ctrl+F)')).toBeInTheDocument();
    });
  });

  describe('Rotate & Download Controls', () => {
    it('renders rotate backward and forward buttons', () => {
      render(<OyrenPdfViewer pdfFilePath="/test.pdf" isDarkMode={false} />, { wrapper: TestWrapper });

      expect(screen.getByTitle('Rotate left (all pages)')).toBeInTheDocument();
      expect(screen.getByTitle('Rotate right (all pages)')).toBeInTheDocument();
    });

    it('renders download button', () => {
      render(<OyrenPdfViewer pdfFilePath="/test.pdf" isDarkMode={false} />, { wrapper: TestWrapper });

      expect(screen.getByTitle('Download')).toBeInTheDocument();
    });

    // rotate plugin handles rotation; no console log expected now

    it('creates download link when download button is clicked', () => {
      const createElementSpy = vi.spyOn(document, 'createElement');
      render(<OyrenPdfViewer pdfFilePath="/test.pdf" isDarkMode={false} />, { wrapper: TestWrapper });

      const downloadBtn = screen.getByTitle('Download');
      fireEvent.click(downloadBtn);

      expect(createElementSpy).toHaveBeenCalledWith('a');
    });
  });

  describe('Snippet Mode', () => {
    it('renders snippet button in toolbar', () => {
      render(<OyrenPdfViewer pdfFilePath="/test.pdf" isDarkMode={false} />, { wrapper: TestWrapper });

      // SnippetButton should be rendered
      const snippetBtn = screen.getByRole('button', { name: /snippet/i });
      expect(snippetBtn).toBeInTheDocument();
    });
  });

  describe('Dark Mode Support', () => {
    it('renders toolbar with dark mode support', () => {
      render(<OyrenPdfViewer pdfFilePath="/test.pdf" isDarkMode={true} />, { wrapper: TestWrapper });

      expect(screen.getByDisplayValue('5')).toBeInTheDocument();
    });
  });

  describe('Responsive toolbar controls', () => {
    beforeEach(() => {
      // Varsayılan ölçü: 1400px (2xl-dən kiçik)
      window.innerWidth = 1400;
      window.dispatchEvent(new Event('resize'));
    });

    it.skip('does not show rotate and download buttons below 2xl', () => {
      render(<OyrenPdfViewer pdfFilePath="/test.pdf" isDarkMode={false} />, { wrapper: TestWrapper });
      expect(screen.queryByTitle('Download')).not.toBeInTheDocument();
      // Rotate button-lar icin alternativ aria-label yoxla
      expect(screen.queryByLabelText(/rotate/i)).not.toBeInTheDocument();
    });

    it.skip('shows rotate and download buttons only on 2xl and above', () => {
      window.innerWidth = 1536; // 2xl
      window.dispatchEvent(new Event('resize'));
      render(<OyrenPdfViewer pdfFilePath="/test.pdf" isDarkMode={false} />, { wrapper: TestWrapper });
      expect(screen.getByTitle('Download')).toBeInTheDocument();
      expect(screen.getByLabelText(/rotate counterclockwise/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/rotate clockwise/i)).toBeInTheDocument();
    });

    it.skip('shows text labels for Contents and Search only on 2xl and above', () => {
      // Aşağı ölçüdə text olmamalı
      render(<OyrenPdfViewer pdfFilePath="/test.pdf" isDarkMode={false} />, { wrapper: TestWrapper });
      expect(screen.queryByText('Contents')).not.toBeInTheDocument();
      expect(screen.queryByText('Search')).not.toBeInTheDocument();
      // 2xl və üzərində isə text görünsün
      window.innerWidth = 1536;
      window.dispatchEvent(new Event('resize'));
      render(<OyrenPdfViewer pdfFilePath="/test.pdf" isDarkMode={false} />, { wrapper: TestWrapper });
      expect(screen.getByText('Contents')).toBeInTheDocument();
      expect(screen.getByText('Search')).toBeInTheDocument();
    });
  });
});

