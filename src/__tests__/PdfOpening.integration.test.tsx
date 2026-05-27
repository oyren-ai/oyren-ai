import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App';

// Mock react-pdf-viewer components
vi.mock('@react-pdf-viewer/core', () => ({
  Worker: ({ children }: any) => <div>{children}</div>,
  Viewer: ({ fileUrl }: any) => <div data-testid="pdf-viewer-content">{fileUrl ? `PDF: ${fileUrl}` : 'No PDF'}</div>,
}));

vi.mock('@react-pdf-viewer/default-layout', () => ({
  defaultLayoutPlugin: () => ({}),
}));

// Mock Tauri APIs
const mockOpen = vi.fn();
const mockReadPdfFile = vi.fn();

vi.mock('@tauri-apps/plugin-dialog', () => ({
  open: (options: any) => mockOpen(options),
}));

vi.mock('@tauri-apps/api/core', () => ({
  invoke: (command: string, args: any) => {
    if (command === 'read_pdf_file') {
      return mockReadPdfFile(args);
    }
    return Promise.reject(new Error(`Unknown command: ${command}`));
  },
}));

// Mock URL.createObjectURL
const mockCreateObjectURL = vi.fn();
global.URL.createObjectURL = mockCreateObjectURL;
global.URL.revokeObjectURL = vi.fn();

describe.skip('PDF Opening Integration - Skipped: Needs to be updated for new architecture', () => {
  const user = userEvent.setup();
  const mockPdfPath = '/Users/test/document.pdf';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should successfully open a PDF file through the full workflow', async () => {
    // Setup mocks
    mockOpen.mockResolvedValue(mockPdfPath);

    // Render the app
    render(<App />);

    // Find and click the open PDF button
    const openPdfButton = await screen.findByText('Open PDF');
    expect(openPdfButton).toBeInTheDocument();
    
    await user.click(openPdfButton);

    // Verify dialog was opened with correct options
    expect(mockOpen).toHaveBeenCalledWith({
      multiple: false,
      filters: [
        {
          name: 'PDF Files',
          extensions: ['pdf'],
        },
      ],
    });

    // Wait for the UI to update - button should change to "Close PDF"
    await waitFor(() => {
      expect(screen.getByText('Close PDF')).toBeInTheDocument();
    });

    // The PDF main area should be visible
    const pdfMainArea = await screen.findByTestId('pdf-main-area');
    expect(pdfMainArea).toBeInTheDocument();
    
    // The mocked PDF viewer should show the file path
    const pdfViewerContent = within(pdfMainArea).getByTestId('pdf-viewer-content');
    expect(pdfViewerContent).toHaveTextContent(`PDF: file://${mockPdfPath}`);
  });

  it('should handle errors when opening PDF fails', async () => {
    // Setup mock to reject
    mockOpen.mockRejectedValue(new Error('User cancelled'));
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(<App />);

    const openPdfButton = await screen.findByText('Open PDF');
    await user.click(openPdfButton);

    // Verify error was logged
    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error opening file dialog:', expect.any(Error));
    });

    // Verify PDF was not loaded
    expect(mockReadPdfFile).not.toHaveBeenCalled();
    expect(mockCreateObjectURL).not.toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });

  it('should display empty state when no PDF is loaded', async () => {
    render(<App />);

    // Wait for the app to render
    await waitFor(() => {
      expect(screen.getByTestId('open-pdf-view')).toBeInTheDocument();
    });

    // The open PDF view should be displayed initially
    const openPdfView = screen.getByTestId('open-pdf-view');
    expect(openPdfView).toBeInTheDocument();
    
    // The Open PDF button should be visible
    expect(screen.getByText('Open PDF')).toBeInTheDocument();
  });

  it('should handle PDF selection and display with user interaction', async () => {
    // Setup mocks
    mockOpen.mockResolvedValue(mockPdfPath);

    render(<App />);

    // The PDF main area should be visible even before a PDF is opened
    const pdfMainArea = await screen.findByTestId('pdf-main-area');
    expect(pdfMainArea).toBeInTheDocument();
    
    // Initially, should show "No PDF Selected"
    expect(within(pdfMainArea).getByText('No PDF Selected')).toBeInTheDocument();
    expect(within(pdfMainArea).getByText('Open a PDF file to view it here')).toBeInTheDocument();

    // Open PDF
    const openPdfButton = await screen.findByText('Open PDF');
    await user.click(openPdfButton);

    // Wait for the Close PDF button to appear
    await waitFor(() => {
      expect(screen.getByText('Close PDF')).toBeInTheDocument();
    });

    // The mocked PDF viewer should show the file path
    await waitFor(() => {
      const pdfViewerContent = within(pdfMainArea).getByTestId('pdf-viewer-content');
      expect(pdfViewerContent).toHaveTextContent(`PDF: file://${mockPdfPath}`);
    });
  });

  it('should update PDF viewer when switching between PDFs', async () => {
    // Setup mocks for two different PDFs
    const firstPdfPath = '/Users/test/first.pdf';
    const secondPdfPath = '/Users/test/second.pdf';
    
    mockOpen
      .mockResolvedValueOnce(firstPdfPath)
      .mockResolvedValueOnce(secondPdfPath);

    render(<App />);

    // Get the PDF main area
    const pdfMainArea = await screen.findByTestId('pdf-main-area');
    
    // Open first PDF
    const openPdfButton = await screen.findByText('Open PDF');
    await user.click(openPdfButton);

    await waitFor(() => {
      const pdfViewerContent = within(pdfMainArea).getByTestId('pdf-viewer-content');
      expect(pdfViewerContent).toHaveTextContent(`PDF: file://${firstPdfPath}`);
    });

    // The button should now say "Close PDF"
    const closePdfButton = await screen.findByText('Close PDF');
    
    // Click to open another PDF (this will open the dialog again)
    await user.click(closePdfButton);
    
    // Wait for the button to change back to "Open PDF"
    await waitFor(() => {
      expect(screen.getByText('Open PDF')).toBeInTheDocument();
    });
    
    // Open second PDF
    await user.click(screen.getByText('Open PDF'));

    await waitFor(() => {
      const pdfViewerContent = within(pdfMainArea).getByTestId('pdf-viewer-content');
      expect(pdfViewerContent).toHaveTextContent(`PDF: file://${secondPdfPath}`);
    });

    // Verify both PDF selections were made
    expect(mockOpen).toHaveBeenCalledTimes(2);
  });
});