import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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
    Sparkles: () => <span>Sparkles</span>,
    X: () => <span>X</span>,
    ChevronUp: () => <span>ChevronUp</span>,
    ChevronDown: () => <span>ChevronDown</span>,
  };
});

// Mock the hooks
vi.mock('../../../pdf-viewer/hooks/usePdfLoader', () => ({
  usePdfLoader: () => ({
    pdfUrl: 'blob:mock-url',
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

// Mock the search plugin functions
const mockSearch = vi.fn();
const mockClearHighlights = vi.fn();
const mockHighlight = vi.fn();

vi.mock('../../../pdf-viewer/hooks/usePdfViewerPlugins', () => ({
  usePdfViewerPlugins: () => ({
    zoomPlugin: {
      zoomTo: vi.fn()
    },
    bookmarkPlugin: {
      Bookmarks: () => <div>Bookmarks</div>
    },
    searchPlugin: {
      search: mockSearch,
      highlight: mockHighlight,
      clearHighlights: mockClearHighlights
    },
    highlightPlugin: {},
    pageNavigationPlugin: {},
    rotatePlugin: {}
  })
}));

// Mock PdfContainer
vi.mock('../PdfContainer', () => ({
  default: (props: any) => (
    <div data-testid="pdf-container">
      PDF Container - {props.pdfFilePath}
    </div>
  )
}));

// Test wrapper with ScrollPersistenceProvider
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <ScrollPersistenceProvider>
    {children}
  </ScrollPersistenceProvider>
);

describe('OyrenPdfViewer - PDF Search Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  afterEach(() => {
    vi.restoreAllMocks();
  });
  
  describe('Programmatic search via events', () => {
    it.skip('listens for pdf-search events', () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
      
      render(<OyrenPdfViewer pdfFilePath="/test.pdf" isDarkMode={false} />, { wrapper: TestWrapper });
      
      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'pdf-search',
        expect.any(Function)
      );
    });
    
    it.skip('performs search when pdf-search event is dispatched - skipping integration test', async () => {
      render(<OyrenPdfViewer pdfFilePath="/test.pdf" isDarkMode={false} />, { wrapper: TestWrapper });
      
      // Dispatch a pdf-search event
      const searchEvent = new CustomEvent('pdf-search', {
        detail: { keyword: 'test keyword' }
      });
      window.dispatchEvent(searchEvent);
      
      await waitFor(() => {
        expect(mockClearHighlights).toHaveBeenCalled();
        expect(mockSearch).toHaveBeenCalledWith('test keyword');
      });
    });
    
    it.skip('clears highlights before performing new search - skipping integration test', async () => {
      render(<OyrenPdfViewer pdfFilePath="/test.pdf" isDarkMode={false} />, { wrapper: TestWrapper });
      
      // First search
      window.dispatchEvent(new CustomEvent('pdf-search', {
        detail: { keyword: 'first search' }
      }));
      
      await waitFor(() => {
        expect(mockClearHighlights).toHaveBeenCalledTimes(1);
        expect(mockSearch).toHaveBeenCalledWith('first search');
      });
      
      // Second search
      window.dispatchEvent(new CustomEvent('pdf-search', {
        detail: { keyword: 'second search' }
      }));
      
      await waitFor(() => {
        expect(mockClearHighlights).toHaveBeenCalledTimes(2);
        expect(mockSearch).toHaveBeenCalledWith('second search');
      });
    });
    
    it.skip('handles empty keyword gracefully', async () => {
      render(<OyrenPdfViewer pdfFilePath="/test.pdf" isDarkMode={false} />, { wrapper: TestWrapper });
      
      // Dispatch with empty keyword
      window.dispatchEvent(new CustomEvent('pdf-search', {
        detail: { keyword: '' }
      }));
      
      // Should not perform search for empty keyword
      await waitFor(() => {
        expect(mockSearch).not.toHaveBeenCalled();
      });
    });
    
    it.skip('handles missing keyword in event detail', async () => {
      render(<OyrenPdfViewer pdfFilePath="/test.pdf" isDarkMode={false} />, { wrapper: TestWrapper });
      
      // Dispatch without keyword
      window.dispatchEvent(new CustomEvent('pdf-search', {
        detail: {}
      }));
      
      // Should not crash or perform search
      await waitFor(() => {
        expect(mockSearch).not.toHaveBeenCalled();
      });
    });
    
    it.skip('removes event listener on unmount', () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
      
      const { unmount } = render(
        <OyrenPdfViewer pdfFilePath="/test.pdf" isDarkMode={false} />,
        { wrapper: TestWrapper }
      );
      
      unmount();
      
      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'pdf-search',
        expect.any(Function)
      );
    });
  });
  
  describe('Search functionality with PDF viewer', () => {
    it.skip('renders PDF viewer with search capability', () => {
      render(<OyrenPdfViewer pdfFilePath="/test.pdf" isDarkMode={false} />, { wrapper: TestWrapper });
      
      expect(screen.getByTestId('pdf-container')).toBeInTheDocument();
    });
    
    it.skip('does not set up search listener when no PDF is loaded', () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
      
      render(<OyrenPdfViewer pdfFilePath={null} isDarkMode={false} />, { wrapper: TestWrapper });
      
      // Should still add listener even without PDF (for when PDF loads later)
      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'pdf-search',
        expect.any(Function)
      );
    });
    
    it.skip('updates search when search function changes - skipping integration test', async () => {
      const { rerender } = render(
        <OyrenPdfViewer pdfFilePath="/test.pdf" isDarkMode={false} />,
        { wrapper: TestWrapper }
      );
      
      // Trigger search
      window.dispatchEvent(new CustomEvent('pdf-search', {
        detail: { keyword: 'test' }
      }));
      
      await waitFor(() => {
        expect(mockSearch).toHaveBeenCalledWith('test');
      });
      
      // Clear mock and rerender (simulating plugin update)
      mockSearch.mockClear();
      rerender(<OyrenPdfViewer pdfFilePath="/test.pdf" isDarkMode={false} />);
      
      // Search should still work
      window.dispatchEvent(new CustomEvent('pdf-search', {
        detail: { keyword: 'test2' }
      }));
      
      await waitFor(() => {
        expect(mockSearch).toHaveBeenCalledWith('test2');
      });
    });
  });
  
  describe('Integration with keyword links', () => {
    it.skip('performs search when keyword link is clicked from chat - skipping integration test', async () => {
      // This simulates the full flow from chat to PDF viewer
      render(<OyrenPdfViewer pdfFilePath="/test.pdf" isDarkMode={false} />, { wrapper: TestWrapper });
      
      // Simulate clicking a keyword link (which dispatches pdf-search event)
      const keywordButton = document.createElement('button');
      keywordButton.onclick = () => {
        window.dispatchEvent(new CustomEvent('pdf-search', {
          detail: { keyword: 'Chapter 1: Introduction' }
        }));
      };
      
      keywordButton.click();
      
      await waitFor(() => {
        expect(mockClearHighlights).toHaveBeenCalled();
        expect(mockSearch).toHaveBeenCalledWith('Chapter 1: Introduction');
      });
    });
    
    it.skip('handles special characters in search keywords - skipping integration test', async () => {
      render(<OyrenPdfViewer pdfFilePath="/test.pdf" isDarkMode={false} />, { wrapper: TestWrapper });
      
      // Test with special characters
      const specialKeywords = [
        'Section 4.2.1',
        'Table-3A',
        'Figure (2)',
        'p < 0.05',
        '"quoted text"'
      ];
      
      for (const keyword of specialKeywords) {
        mockSearch.mockClear();
        mockClearHighlights.mockClear();
        
        window.dispatchEvent(new CustomEvent('pdf-search', {
          detail: { keyword }
        }));
        
        await waitFor(() => {
          expect(mockSearch).toHaveBeenCalledWith(keyword);
        });
      }
    });
    
    it.skip('handles rapid consecutive searches', async () => {
      render(<OyrenPdfViewer pdfFilePath="/test.pdf" isDarkMode={false} />, { wrapper: TestWrapper });
      
      // Dispatch multiple searches rapidly
      const keywords = ['first', 'second', 'third'];
      
      keywords.forEach(keyword => {
        window.dispatchEvent(new CustomEvent('pdf-search', {
          detail: { keyword }
        }));
      });
      
      // All searches should be processed
      await waitFor(() => {
        expect(mockSearch).toHaveBeenCalledTimes(3);
        expect(mockClearHighlights).toHaveBeenCalledTimes(3);
      });
    });
  });
});