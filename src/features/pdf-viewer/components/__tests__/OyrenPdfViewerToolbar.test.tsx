import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import OyrenPdfViewerToolbar from '../OyrenPdfViewerToolbar';

// Mock the usePdfSearch hook
vi.mock('../hooks/usePdfSearch', () => ({
  usePdfSearch: () => ({
    showSearch: false,
    searchKeyword: '',
    currentMatchIndex: 0,
    totalMatches: 0,
    searchInputRef: { current: null },
    setSearchKeyword: vi.fn(),
    handleSearch: vi.fn(),
    handleSearchKeyPress: vi.fn(),
    handleClearSearch: vi.fn(),
    handleNextMatch: vi.fn(),
    handlePreviousMatch: vi.fn(),
    handleToggleSearch: vi.fn(),
    handleInputBlur: vi.fn(),
    searchOptions: {
      caseSensitive: false,
      wholeWords: false,
    },
    searchStatus: {
      isSearching: false,
      hasError: false,
      errorMessage: '',
    },
  })
}));

// Mock lucide-react icons
vi.mock('lucide-react', async () => {
  const actual = await vi.importActual('lucide-react');
  return {
    ...actual,
    Download: () => <span>Download</span>,
    BookOpen: () => <span>BookOpen</span>,
  };
});

describe('OyrenPdfViewerToolbar', () => {
  const defaultProps = {
    currentScale: 1,
    showBookmarks: false,
    isSnippetMode: false,
    pdfViewerPluginsInstance: {
      pageNavigationPlugin: {
        jumpToPage: vi.fn(),
        CurrentPageInput: () => <input readOnly value="1" aria-label="Page" />,
        NumberOfPages: () => <span>10</span>,
        GoToNextPage: ({ children }: any) => children({ onClick: vi.fn(), isDisabled: false }),
        GoToPreviousPage: ({ children }: any) => children({ onClick: vi.fn(), isDisabled: false }),
      },
      zoomPlugin: { zoomTo: vi.fn() },
      bookmarkPlugin: { Bookmarks: () => <div>Bookmarks</div> },
      searchPlugin: { highlight: vi.fn(), clearHighlights: vi.fn(), jumpToMatch: vi.fn() },
      highlightPlugin: {},
      rotatePlugin: {
        Rotate: ({ children }: any) =>
          typeof children === 'function' ? children({ onClick: vi.fn() }) : children,
      },
    } as any,
    pdfSearchState: {
      showSearch: false,
      searchKeyword: '',
      currentMatchIndex: 0,
      totalMatches: 0,
      searchInputRef: { current: null },
      setSearchKeyword: vi.fn(),
      handleSearch: vi.fn(),
      handleSearchKeyPress: vi.fn(),
      handleClearSearch: vi.fn(),
      handleNextMatch: vi.fn(),
      handlePreviousMatch: vi.fn(),
      handleToggleSearch: vi.fn(),
      handleInputBlur: vi.fn(),
      toggleCaseSensitive: vi.fn(),
      toggleWholeWords: vi.fn(),
      searchOptions: {
        caseSensitive: false,
        wholeWords: false,
      },
      searchStatus: {
        isSearching: false,
        hasError: false,
        errorMessage: '',
      },
    },
    onZoomIn: vi.fn(),
    onZoomOut: vi.fn(),
    onToggleBookmarks: vi.fn(),
    onSnippetClick: vi.fn(),
    onDownload: vi.fn(),
    isDarkMode: false,
    darkBackground: false,
    onToggleDarkBackground: vi.fn(),
  };

  it('renders all toolbar sections', () => {
    render(<OyrenPdfViewerToolbar {...defaultProps} />);

    expect(screen.getByDisplayValue('1')).toBeInTheDocument();

    expect(screen.getByTitle('Bookmarks & Table of Contents')).toBeInTheDocument();

    // Check for zoom buttons
    expect(screen.getByTitle('Zoom In')).toBeInTheDocument();
    expect(screen.getByTitle('Zoom Out')).toBeInTheDocument();

    // Check for download button
    expect(screen.getByTitle('Download')).toBeInTheDocument();
  });

  it('calls onToggleBookmarks when bookmarks button is clicked', () => {
    render(<OyrenPdfViewerToolbar {...defaultProps} />);

    const bookmarksButton = screen.getByTitle('Bookmarks & Table of Contents');
    fireEvent.click(bookmarksButton);

    expect(defaultProps.onToggleBookmarks).toHaveBeenCalledTimes(1);
  });

  it('calls onZoomIn when zoom in button is clicked', () => {
    render(<OyrenPdfViewerToolbar {...defaultProps} />);

    const zoomInButton = screen.getByTitle('Zoom In');
    fireEvent.click(zoomInButton);

    expect(defaultProps.onZoomIn).toHaveBeenCalledTimes(1);
  });

  it('calls onZoomOut when zoom out button is clicked', () => {
    render(<OyrenPdfViewerToolbar {...defaultProps} />);

    const zoomOutButton = screen.getByTitle('Zoom Out');
    fireEvent.click(zoomOutButton);

    expect(defaultProps.onZoomOut).toHaveBeenCalledTimes(1);
  });

  it('calls onDownload when download button is clicked', () => {
    render(<OyrenPdfViewerToolbar {...defaultProps} />);

    const downloadButton = screen.getByTitle('Download');
    fireEvent.click(downloadButton);

    expect(defaultProps.onDownload).toHaveBeenCalledTimes(1);
  });

  it('displays current zoom percentage', () => {
    render(<OyrenPdfViewerToolbar {...defaultProps} currentScale={1.5} />);

    expect(screen.getByText('150%')).toBeInTheDocument();
  });

  it('renders pagination controls with correct page numbers', () => {
    render(<OyrenPdfViewerToolbar {...defaultProps} />);

    expect(screen.getByDisplayValue('1')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
  });

  it('renders rotate buttons', () => {
    render(<OyrenPdfViewerToolbar {...defaultProps} />);

    expect(screen.getByTitle('Rotate left (all pages)')).toBeInTheDocument();
    expect(screen.getByTitle('Rotate right (all pages)')).toBeInTheDocument();
  });
});