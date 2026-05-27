import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import MainContentArea from '../MainContentArea';
import { PdfCacheProvider } from '@/contexts/PdfCacheContext';
import React from 'react';

// Mock child components
vi.mock('@/components/layout/WelcomeScreen', () => ({
  default: ({ onOpenPdf, onOpenPdfPath }: any) => (
    <div data-testid="welcome-screen">
      <button onClick={onOpenPdf}>Open PDF</button>
      <button onClick={() => onOpenPdfPath('/test.pdf')}>Open Path</button>
    </div>
  ),
}));

vi.mock('@/components/pdf/OyrenPdfViewer', () => ({
  default: ({ pdfFilePath }: { pdfFilePath: string }) => (
    <div data-testid="oyren-pdf-viewer">Viewing: {pdfFilePath}</div>
  ),
}));

vi.mock('@/features/pdf-viewer/components/PdfLoadingStates', () => ({
  PdfLoading: ({ fileName }: { fileName?: string }) => (
    <div data-testid="pdf-loading">
      Loading{fileName ? `: ${fileName}` : '...'}
    </div>
  ),
}));

// Mock scanned PDF detection
vi.mock('../../hooks/useScannedPdfDetection', () => ({
  useScannedPdfDetection: () => ({ isPdfScanned: () => false }),
}));

// Mock Tauri API
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

// Mock useAppContext to provide openPdfs
const mockOpenPdfs: Array<{ path: string; name: string }> = [];
vi.mock('@/contexts/AppContext', () => ({
  useAppContext: () => ({
    openPdfs: mockOpenPdfs,
  }),
}));

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <PdfCacheProvider>
    {children}
  </PdfCacheProvider>
);

describe('MainContentArea', () => {
  const mockHandleOpenPdf = vi.fn();
  const mockHandleOpenPdfPath = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // Clear mockOpenPdfs array
    mockOpenPdfs.length = 0;
  });

  it('shows WelcomeScreen when no PDF path is provided', () => {
    render(
      <MainContentArea
        currentPdfPath={null}
        isDarkMode={false}
        onOpenPdf={mockHandleOpenPdf}
        onOpenPdfPath={mockHandleOpenPdfPath}
      />,
      { wrapper: TestWrapper }
    );

    expect(screen.getByTestId('welcome-screen')).toBeInTheDocument();
    expect(screen.queryByTestId('pdf-loading')).not.toBeInTheDocument();
    expect(screen.queryByTestId('oyren-pdf-viewer')).not.toBeInTheDocument();
  });

  it('shows PdfLoading with filename when path exists but PDF not loaded', () => {
    // Add PDF to openPdfs so component doesn't show welcome screen
    mockOpenPdfs.push({ path: '/workspace/research-paper.pdf', name: 'research-paper.pdf' });

    render(
      <MainContentArea
        currentPdfPath="/workspace/research-paper.pdf"
        isDarkMode={false}
        onOpenPdf={mockHandleOpenPdf}
        onOpenPdfPath={mockHandleOpenPdfPath}
      />,
      { wrapper: TestWrapper }
    );

    expect(screen.getByTestId('pdf-loading')).toBeInTheDocument();
    expect(screen.getByText('Loading: research-paper.pdf')).toBeInTheDocument();
    expect(screen.queryByTestId('welcome-screen')).not.toBeInTheDocument();
    expect(screen.queryByTestId('oyren-pdf-viewer')).not.toBeInTheDocument();
  });

  it('shows OyrenPdfViewer when PDF is loaded', async () => {
    const { invoke } = await import('@tauri-apps/api/core');
    vi.mocked(invoke).mockResolvedValue(new Uint8Array([1, 2, 3]));

    // Add PDF to openPdfs
    mockOpenPdfs.push({ path: '/workspace/document.pdf', name: 'document.pdf' });

    render(
      <MainContentArea
        currentPdfPath="/workspace/document.pdf"
        isDarkMode={false}
        onOpenPdf={mockHandleOpenPdf}
        onOpenPdfPath={mockHandleOpenPdfPath}
      />,
      { wrapper: TestWrapper }
    );

    // Should initially show loading
    expect(screen.getByTestId('pdf-loading')).toBeInTheDocument();
  });

  it('transitions from welcome to loading to viewer', () => {
    const { rerender } = render(
      <MainContentArea
        currentPdfPath={null}
        isDarkMode={false}
        onOpenPdf={mockHandleOpenPdf}
        onOpenPdfPath={mockHandleOpenPdfPath}
      />,
      { wrapper: TestWrapper }
    );

    expect(screen.getByTestId('welcome-screen')).toBeInTheDocument();

    // Path selected, loading - add PDF to openPdfs
    mockOpenPdfs.push({ path: '/test.pdf', name: 'test.pdf' });

    rerender(
      <MainContentArea
        currentPdfPath="/test.pdf"
        isDarkMode={false}
        onOpenPdf={mockHandleOpenPdf}
        onOpenPdfPath={mockHandleOpenPdfPath}
      />
    );

    expect(screen.getByTestId('pdf-loading')).toBeInTheDocument();
  });

  it('extracts filename from full path for loading message', () => {
    // Add PDF to openPdfs
    mockOpenPdfs.push({ path: '/very/long/path/to/my-document.pdf', name: 'my-document.pdf' });

    render(
      <MainContentArea
        currentPdfPath="/very/long/path/to/my-document.pdf"
        isDarkMode={false}
        onOpenPdf={mockHandleOpenPdf}
        onOpenPdfPath={mockHandleOpenPdfPath}
      />,
      { wrapper: TestWrapper }
    );

    expect(screen.getByText('Loading: my-document.pdf')).toBeInTheDocument();
  });

  it('passes isDarkMode to child components', async () => {
    const { invoke } = await import('@tauri-apps/api/core');
    vi.mocked(invoke).mockResolvedValue(new Uint8Array([1]));

    // Add PDF to openPdfs
    mockOpenPdfs.push({ path: '/test.pdf', name: 'test.pdf' });

    render(
      <MainContentArea
        currentPdfPath="/test.pdf"
        isDarkMode={true}
        onOpenPdf={mockHandleOpenPdf}
        onOpenPdfPath={mockHandleOpenPdfPath}
      />,
      { wrapper: TestWrapper }
    );

    // Should initially show loading
    expect(screen.getByTestId('pdf-loading')).toBeInTheDocument();
  });
});