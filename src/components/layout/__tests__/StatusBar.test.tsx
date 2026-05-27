import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { StatusBar } from '../StatusBar';

// Mock contexts
const mockAppContextValue = {
  openPdfs: [],
  currentPdfPath: null as string | null,
  setCurrentPdfPath: vi.fn(),
  closePdfTab: vi.fn(),
  isDarkMode: false,
  toggleTheme: vi.fn(),
  isSidebarCollapsed: false,
  setIsSidebarCollapsed: vi.fn(),
  isNotesCollapsed: false,
  toggleNotes: vi.fn(),
  isAiChatCollapsed: false,
  toggleAiChat: vi.fn(),
};

const mockVersionCheckValue = {
  version: '1.0.0',
  loadVersion: vi.fn(),
  isChecking: false,
  updateInfo: null,
  checkForUpdates: vi.fn(),
  installUpdate: vi.fn(),
};

vi.mock('@/contexts/AppContext', () => ({
  useAppContext: () => mockAppContextValue,
}));

vi.mock('../hooks/useVersionCheck', () => ({
  useVersionCheck: () => mockVersionCheckValue,
}));

vi.mock('../UpdateDialog', () => ({
  UpdateDialog: () => null,
}));

describe('StatusBar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAppContextValue.currentPdfPath = null;
  });

  it('should render the status bar', () => {
    const { container } = render(<StatusBar />);
    const statusBar = container.querySelector('div');
    expect(statusBar).toBeInTheDocument();
    expect(statusBar).toHaveClass('h-6', 'bg-neutral-100', 'dark:bg-neutral-900');
  });

  it('should show "No PDF Selected" when no PDF is loaded', () => {
    mockAppContextValue.currentPdfPath = null;
    render(<StatusBar />);
    expect(screen.getByText('No PDF Selected')).toBeInTheDocument();
  });

  it('should display PDF filename when PDF is loaded', () => {
    mockAppContextValue.currentPdfPath = '/path/to/my-document.pdf';
    render(<StatusBar />);
    expect(screen.getByText('My PDF: my-document.pdf')).toBeInTheDocument();
  });

  it('should handle Windows-style paths correctly', () => {
    mockAppContextValue.currentPdfPath = 'C:\\Users\\Documents\\test-file.pdf';
    render(<StatusBar />);
    expect(screen.getByText('My PDF: test-file.pdf')).toBeInTheDocument();
  });

  it('should display "Report Issue" button', () => {
    render(<StatusBar />);
    expect(screen.getByText('Report Issue')).toBeInTheDocument();
  });

  it('should display version number', () => {
    render(<StatusBar />);
    expect(screen.getByText('v1.0.0')).toBeInTheDocument();
  });

  it('should open report page when "Report Issue" is clicked', async () => {
    const user = userEvent.setup();
    const mockInvoke = (global as any).mockInvoke;
    render(<StatusBar />);

    const reportButton = screen.getByText('Report Issue');
    await user.click(reportButton);

    expect(mockInvoke).toHaveBeenCalledWith('open_url_in_browser', { url: 'https://oyren.ai/report' });
  });

  it('should render FileText icon when PDF is loaded', () => {
    mockAppContextValue.currentPdfPath = '/test.pdf';
    const { container } = render(<StatusBar />);
    const icons = container.querySelectorAll('svg');
    expect(icons.length).toBeGreaterThan(0);
  });

  it('should render ExternalLink icon for Report Issue', () => {
    const { container } = render(<StatusBar />);
    const icons = container.querySelectorAll('svg');
    // Should have FileText and ExternalLink icons
    expect(icons.length).toBeGreaterThanOrEqual(2);
  });

  it('should have proper flex layout', () => {
    const { container } = render(<StatusBar />);
    const statusBar = container.firstChild as HTMLElement;
    expect(statusBar).toHaveClass('flex', 'items-center', 'justify-between');
  });

  it('should have proper border styling', () => {
    const { container } = render(<StatusBar />);
    const statusBar = container.firstChild as HTMLElement;
    expect(statusBar).toHaveClass('border-t', 'border-gray-200', 'dark:border-gray-800');
  });

  it('should display all status indicators simultaneously', () => {
    mockAppContextValue.currentPdfPath = '/test.pdf';
    render(<StatusBar />);

    expect(screen.getByText('My PDF: test.pdf')).toBeInTheDocument();
    expect(screen.getByText('Report Issue')).toBeInTheDocument();
    expect(screen.getByText('v1.0.0')).toBeInTheDocument();
  });
});

