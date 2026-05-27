import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import WorkspaceView from '@/features/workspace-view/WorkspaceView';
import { AppProvider } from '@/contexts/AppContext';
import { ApiProvider } from '@/contexts/ApiContext';
import { ModalProvider } from '@/contexts/ModalContext';
import { PdfCacheProvider } from '@/contexts/PdfCacheContext';
import { AuthProvider } from '@/contexts/AuthContext';

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn().mockResolvedValue([]),
}));

vi.mock('@tauri-apps/plugin-dialog', () => ({
  open: vi.fn(),
}));

const mockNavigationContext = {
  currentView: 'workspace' as const,
  selectedWorkspace: {
    id: '1',
    name: 'Test Workspace',
    description: '',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    last_accessed_at: '2024-01-01T00:00:00Z',
    is_pinned: false,
    is_archived: false,
    is_favourite: false,
    is_active: true,
  },
  navigateToWorkspace: vi.fn(),
  navigateToSettings: vi.fn(),
  navigateToHome: vi.fn(),
  navigateBack: vi.fn(),
  settingsTab: null,
  clearSettingsTab: vi.fn(),
};

vi.mock('@/contexts/NavigationContext', () => ({
  ViewNavigationProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useViewNavigation: () => mockNavigationContext,
}));

vi.mock('../layout/navbar/NavbarActions', () => ({
  default: ({ onOpenPdf, onToggleSidebar, loading }: any) => (
    <div data-testid="navbar-actions">
      <button data-testid="navbar-open-pdf" disabled={loading} onClick={onOpenPdf}>Open PDF</button>
      <button data-testid="navbar-toggle" onClick={onToggleSidebar}>Toggle</button>
    </div>
  ),
}));

vi.mock('../layout/WelcomeScreen', () => ({
  default: ({ onOpenPdf, onOpenPdfPath }: any) => (
    <div data-testid="welcome-screen">
      <button data-testid="welcome-open-pdf" onClick={onOpenPdf}>Open PDF</button>
      <button data-testid="welcome-open-path" onClick={() => onOpenPdfPath('/from-welcome.pdf')}>
        Open Path
      </button>
    </div>
  ),
}));

vi.mock('../pdf/OyrenPdfViewer', () => ({
  default: ({ pdfFilePath }: { pdfFilePath: string }) => (
    <div data-testid="pdf-viewer">PDF: {pdfFilePath}</div>
  ),
}));

vi.mock('../layout/sidebar/AiSidebar', () => ({
  default: () => <div data-testid="ai-sidebar">AI Sidebar</div>,
}));

vi.mock('@/api/pdfApi', () => ({
  pdfApi: {
    processPdfFile: vi.fn().mockResolvedValue({
      pages: [{ page_number: 1, text: 'Example' }],
      total_pages: 1,
      extractable_pages: 1,
    }),
  },
}));

vi.mock('@/api/workspaceFilesApi', () => ({
  workspaceFilesApi: {
    addFile: vi.fn(),
    listWorkspaceFiles: vi.fn().mockResolvedValue([]),
  },
}));

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <AppProvider>
    <AuthProvider>
      <PdfCacheProvider>
        <ApiProvider>
          <ModalProvider>{children}</ModalProvider>
        </ApiProvider>
      </PdfCacheProvider>
    </AuthProvider>
  </AppProvider>
);

describe('WorkspaceView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('shows welcome screen when no PDF is loaded', () => {
    render(<WorkspaceView />, { wrapper: TestWrapper });

    expect(screen.getByText('Welcome to Oyren')).toBeInTheDocument();
    expect(screen.queryByTestId('pdf-viewer')).not.toBeInTheDocument();
  });

  it.skip('opens PDF via dialog and stores it in recents', async () => {
    const { open } = await import('@tauri-apps/plugin-dialog');
    const { invoke } = await import('@tauri-apps/api/core');
    const { workspaceFilesApi } = await import('@/api/workspaceFilesApi');
    const externalPath = '/path/to/test.pdf';
    const workspacePath = '/app_data/workspaces/1/test.pdf';

    vi.mocked(open).mockResolvedValue(externalPath);
    vi.mocked(invoke).mockResolvedValueOnce([1, 2, 3]);
    vi.mocked(workspaceFilesApi.addFile).mockResolvedValue({
      workspace_file_id: 'file-123',
      workspace_file_path: workspacePath,
      original_filename: 'test.pdf',
      was_deduplicated: false,
    });

    render(<WorkspaceView />, { wrapper: TestWrapper });

    fireEvent.click(screen.getByText('Open PDF Document'));

    await waitFor(() => {
      expect(open).toHaveBeenCalledWith({
        multiple: false,
        filters: [{
          name: 'PDF Files',
          extensions: ['pdf'],
        }],
      });
    });

    await waitFor(() => {
      expect(workspaceFilesApi.addFile).toHaveBeenCalledWith('1', externalPath);
    });

    // Check PDF viewer is rendered with the workspace path
    await waitFor(() => {
      expect(screen.getByTestId('pdf-viewer')).toHaveTextContent(workspacePath);
    });

    const stored = localStorage.getItem('recent-pdfs');
    expect(stored).not.toBeNull();
    const recents = JSON.parse(stored as string);
    expect(recents[0].path).toBe(workspacePath);
    expect(recents[0].name).toBe('test.pdf');
  });

});
