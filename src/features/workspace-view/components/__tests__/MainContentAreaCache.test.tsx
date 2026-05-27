import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, waitFor } from '@testing-library/react';
import MainContentArea from '../MainContentArea';
import { AppProvider } from '@/contexts/AppContext';
import { ScrollPersistenceProvider } from '@/contexts/ScrollPersistenceContext';
import React from 'react';

// Mock child components
vi.mock('@/components/layout/WelcomeScreen', () => ({
  default: ({ onOpenPdf }: any) => (
    <div data-testid="welcome-screen">
      <button onClick={onOpenPdf}>Open PDF</button>
    </div>
  ),
}));

// Mock OyrenPdfViewer to capture props
vi.mock('@/features/pdf-viewer/components/OyrenPdfViewer', () => ({
  default: ({ pdfFilePath, pdfUrl, initialZoom, onZoomChange }: any) => {
    return (
      <div data-testid="oyren-pdf-viewer">
        <div data-testid="viewer-path">{pdfFilePath}</div>
        <div data-testid="viewer-url">{pdfUrl ?? ''}</div>
        <div data-testid="viewer-zoom">{initialZoom}</div>
        <button
          data-testid="trigger-zoom"
          onClick={() => onZoomChange?.(1.5)}
        >
          Zoom to 1.5
        </button>
      </div>
    );
  },
}));

vi.mock('@/features/pdf-viewer/components/PdfLoadingStates', () => ({
  PdfLoading: ({ fileName }: { fileName?: string }) => (
    <div data-testid="pdf-loading">
      Loading{fileName ? `: ${fileName}` : '...'}
    </div>
  ),
}));

// Mock Context
const mockLoadPdf = vi.fn();
const mockGetCachedPdf = vi.fn();
const mockGetZoomLevel = vi.fn();
const mockSetZoomLevel = vi.fn();
const mockPreloadAdjacentPdfs = vi.fn();

vi.mock('@/contexts/PdfCacheContext', () => ({
  usePdfCacheContext: () => ({
    loadPdf: mockLoadPdf,
    getCachedPdf: mockGetCachedPdf,
    getZoomLevel: mockGetZoomLevel,
    setZoomLevel: mockSetZoomLevel,
    preloadAdjacentPdfs: mockPreloadAdjacentPdfs,
  }),
}));

// Mock useAppContext to provide openPdfs and other required fields
const mockOpenPdfs: Array<{ path: string; name: string }> = [];
vi.mock('@/contexts/AppContext', () => ({
  useAppContext: () => ({
    openPdfs: mockOpenPdfs,
    currentMarkdownPath: null,
    currentMarkdownPdfName: null,
    setCurrentMarkdown: vi.fn(),
  }),
  AppProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock scanned PDF detection
vi.mock('../../hooks/useScannedPdfDetection', () => ({
  useScannedPdfDetection: () => ({ isPdfScanned: () => false }),
}));

// Mock NavigationContext
vi.mock('@/contexts/NavigationContext', () => ({
  useViewNavigation: () => ({
    currentView: 'workspace',
    selectedWorkspace: { id: 'test-workspace', name: 'Test' },
    navigateToWorkspace: vi.fn(),
    navigateToSettings: vi.fn(),
    navigateToHome: vi.fn(),
    navigateBack: vi.fn(),
    settingsTab: null,
    clearSettingsTab: vi.fn(),
  }),
}));

// Test wrapper with ScrollPersistenceProvider
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <ScrollPersistenceProvider>
    {children}
  </ScrollPersistenceProvider>
);

describe('MainContentArea Caching & Zoom', () => {
  const mockHandleOpenPdf = vi.fn();
  const mockHandleOpenPdfPath = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // Clear mockOpenPdfs array
    mockOpenPdfs.length = 0;

    // Simulate a simple cache: when loadPdf is called, update getCachedPdf to return the blob URL
    const cache: Record<string, string> = {};

    mockLoadPdf.mockImplementation(async (path) => {
      const blobUrl = `blob:${path}`;
      cache[path] = blobUrl;
      // Update getCachedPdf to return from cache
      mockGetCachedPdf.mockImplementation((p) => cache[p] || null);
      return blobUrl;
    });

    mockGetCachedPdf.mockReturnValue(null);
    mockGetZoomLevel.mockReturnValue(1);
  });

  it('loads PDF and sets initial state correctly', async () => {
    // Add PDF to openPdfs so component doesn't show welcome screen
    mockOpenPdfs.push({ path: '/test.pdf', name: 'test.pdf' });

    render(
      <MainContentArea
        currentPdfPath="/test.pdf"
        isDarkMode={false}
        onOpenPdf={mockHandleOpenPdf}
        onOpenPdfPath={mockHandleOpenPdfPath}
      />,
      { wrapper: TestWrapper }
    );

    // Should start loading
    expect(screen.getByTestId('pdf-loading')).toBeInTheDocument();
    expect(mockLoadPdf).toHaveBeenCalledWith('/test.pdf');

    // Wait for load and viewer to show with URL (async cache update)
    await waitFor(() => {
      expect(screen.getByTestId('oyren-pdf-viewer')).toBeInTheDocument();
      expect(screen.getByTestId('viewer-url')).toHaveTextContent('blob:/test.pdf');
      expect(screen.getByTestId('viewer-zoom')).toHaveTextContent('1');
    });
  });

  it('uses cached URL if available immediately', () => {
    mockGetCachedPdf.mockReturnValue('blob:cached-url');
    mockGetZoomLevel.mockReturnValue(1.2);

    // Add PDF to openPdfs
    mockOpenPdfs.push({ path: '/cached.pdf', name: 'cached.pdf' });

    render(
      <MainContentArea
        currentPdfPath="/cached.pdf"
        isDarkMode={false}
        onOpenPdf={mockHandleOpenPdf}
        onOpenPdfPath={mockHandleOpenPdfPath}
      />,
      { wrapper: TestWrapper }
    );

    // Should show viewer immediately without loading state
    expect(screen.queryByTestId('pdf-loading')).not.toBeInTheDocument();
    expect(screen.getByTestId('oyren-pdf-viewer')).toBeInTheDocument();
    expect(screen.getByTestId('viewer-url')).toHaveTextContent('blob:cached-url');
    expect(screen.getByTestId('viewer-zoom')).toHaveTextContent('1.2');
  });

  it('persists zoom level when switching tabs', async () => {
    // Add both PDFs to openPdfs
    mockOpenPdfs.push(
      { path: '/a.pdf', name: 'a.pdf' },
      { path: '/b.pdf', name: 'b.pdf' }
    );

    // 1. Load Tab A
    mockGetCachedPdf.mockImplementation((path) => path === '/a.pdf' ? 'blob:a' : null);
    mockGetZoomLevel.mockReturnValue(1);

    const { rerender } = render(
      <MainContentArea
        currentPdfPath="/a.pdf"
        isDarkMode={false}
        onOpenPdf={mockHandleOpenPdf}
        onOpenPdfPath={mockHandleOpenPdfPath}
      />,
      { wrapper: TestWrapper }
    );

    await waitFor(() => expect(screen.getByTestId('oyren-pdf-viewer')).toBeInTheDocument());

    // 2. Zoom in Tab A
    const zoomButton = screen.getByTestId('trigger-zoom');
    act(() => {
      zoomButton.click();
    });

    expect(mockSetZoomLevel).toHaveBeenCalledWith('/a.pdf', 1.5);

    // Update mock to reflect zoom change (simulating context behavior)
    mockGetZoomLevel.mockImplementation((path) => path === '/a.pdf' ? 1.5 : 1);

    // 3. Switch to Tab B
    mockGetCachedPdf.mockImplementation((path) => {
      if (path === '/a.pdf') return 'blob:a';
      if (path === '/b.pdf') return 'blob:b';
      return null;
    });

    rerender(
      <MainContentArea
        currentPdfPath="/b.pdf"
        isDarkMode={false}
        onOpenPdf={mockHandleOpenPdf}
        onOpenPdfPath={mockHandleOpenPdfPath}
      />
    );

    // Wait for B to load (if not cached/mocked to be instant)
    // Here we mocked getCachedPdf to return blob:b, so it should be instant
    // Since both PDFs are rendered, we need to find the visible one
    const viewerPaths = screen.getAllByTestId('viewer-path');
    const viewerZooms = screen.getAllByTestId('viewer-zoom');

    // Find the visible viewer (B)
    const visiblePathB = viewerPaths.find(el => el.textContent === '/b.pdf');
    const visibleZoomB = viewerZooms.find((el, idx) => viewerPaths[idx].textContent === '/b.pdf');

    expect(visiblePathB).toHaveTextContent('/b.pdf');
    expect(visibleZoomB).toHaveTextContent('1'); // Default for B

    // 4. Switch back to Tab A
    rerender(
      <MainContentArea
        currentPdfPath="/a.pdf"
        isDarkMode={false}
        onOpenPdf={mockHandleOpenPdf}
        onOpenPdfPath={mockHandleOpenPdfPath}
      />
    );

    const viewerPathsAfter = screen.getAllByTestId('viewer-path');
    const viewerZoomsAfter = screen.getAllByTestId('viewer-zoom');

    // Find the visible viewer (A)
    const visiblePathA = viewerPathsAfter.find(el => el.textContent === '/a.pdf');
    const visibleZoomA = viewerZoomsAfter.find((el, idx) => viewerPathsAfter[idx].textContent === '/a.pdf');

    expect(visiblePathA).toHaveTextContent('/a.pdf');
    // This is the key check: did it remember zoom?
    expect(visibleZoomA).toHaveTextContent('1.5');
  });
});

