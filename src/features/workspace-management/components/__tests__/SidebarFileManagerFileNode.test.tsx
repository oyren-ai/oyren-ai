import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SidebarFileManagerFileNode from '../SidebarFileManagerFileNode';
import type { WorkspaceFile } from '@/types/workspace';

// Mock UI components
vi.mock('@/components/ui/sidebar.tsx', () => ({
  SidebarMenuItem: ({ children, ...props }: any) => <li {...props}>{children}</li>,
  SidebarMenuButton: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} {...props}>{children}</button>
  ),
}));

// Mock icons
vi.mock('@/components/icons/PdfIcon.tsx', () => ({
  default: () => <span>PDF</span>,
}));

vi.mock('lucide-react', () => ({
  File: () => <span>File</span>,
  FileText: () => <span>FileText</span>,
  Trash2: () => <span>Trash</span>,
  Edit: () => <span>Edit</span>,
  FileOutput: () => <span>FileOutput</span>,
  Loader2: () => <span>Loader2</span>,
  MoreHorizontal: () => <span>MoreHorizontal</span>,
  Copy: () => <span>Copy</span>,
  Code: () => <span>Code</span>,
  ClipboardCopy: () => <span>ClipboardCopy</span>,
  NotebookText: () => <span>NotebookText</span>,
  ScanText: () => <span>ScanText</span>,
}));

vi.mock('@/api/workspaceFilesApi', () => ({
  workspaceFilesApi: { updateFileMetadata: vi.fn() },
}));

vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open }: any) => open ? <div>{children}</div> : null,
  DialogContent: ({ children }: any) => <div>{children}</div>,
  DialogHeader: ({ children }: any) => <div>{children}</div>,
  DialogTitle: ({ children }: any) => <h2>{children}</h2>,
  DialogDescription: ({ children }: any) => <p>{children}</p>,
  DialogFooter: ({ children }: any) => <div>{children}</div>,
}));

vi.mock('@/components/ui/button', () => ({
  Button: (props: any) => <button {...props} />,
}));

vi.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: any) => <div>{children}</div>,
  DropdownMenuTrigger: ({ children }: any) => <div>{children}</div>,
  DropdownMenuContent: ({ children }: any) => <div>{children}</div>,
  DropdownMenuItem: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} {...props}>{children}</button>
  ),
  DropdownMenuSeparator: () => <hr />,
}));

// Mock AppContext
vi.mock('@/contexts/AppContext', () => ({
  useAppContext: () => ({
    setCurrentMarkdown: vi.fn(),
  }),
}));

// Mock MarkerMarkdownButton to avoid context issues
vi.mock('../MarkerMarkdownButton', () => ({
  MarkerMarkdownButton: () => null,
}));

describe('SidebarFileManagerFileNode', () => {
  const mockFileData: WorkspaceFile = {
    id: 'file-123',
    workspace_id: 'workspace-456',
    file_name: 'test.pdf',
    file_path: '/workspace/test.pdf',
    source_file_path: '/original/test.pdf',
    file_size: 1024,
    file_hash: 'abc123',
    date_added: '2024-01-01T00:00:00Z',
    last_accessed: '2024-01-01T00:00:00Z',
  };

  describe('file click handling', () => {
    it('calls onFileClick with file path and workspace file id', () => {
      const mockOnFileClick = vi.fn();

      render(
        <SidebarFileManagerFileNode
          name="test.pdf"
          filePath="/workspace/test.pdf"
          fileData={mockFileData}
          onFileClick={mockOnFileClick}
        />
      );

      const button = screen.getByTestId('file-node-test.pdf');
      fireEvent.click(button);

      expect(mockOnFileClick).toHaveBeenCalledWith('/workspace/test.pdf', 'file-123');
    });

    it('requires workspace file id when clicking on file', () => {
      const mockOnFileClick = vi.fn();

      render(
        <SidebarFileManagerFileNode
          name="test.pdf"
          filePath="/workspace/test.pdf"
          fileData={mockFileData}
          onFileClick={mockOnFileClick}
        />
      );

      const button = screen.getByTestId('file-node-test.pdf');
      fireEvent.click(button);

      // Should be called with 2 arguments: path and fileId
      expect(mockOnFileClick).toHaveBeenCalledTimes(1);
      expect(mockOnFileClick.mock.calls[0]).toHaveLength(2);
      expect(mockOnFileClick.mock.calls[0][1]).toBe('file-123');
    });

    it('does not call onFileClick when fileData is missing', () => {
      const mockOnFileClick = vi.fn();

      render(
        <SidebarFileManagerFileNode
          name="test.pdf"
          filePath="/workspace/test.pdf"
          onFileClick={mockOnFileClick}
        />
      );

      const button = screen.getByTestId('file-node-test.pdf');
      fireEvent.click(button);

      // Without fileData, we can't get workspace_file_id, so should not call
      expect(mockOnFileClick).not.toHaveBeenCalled();
    });
  });

  describe('rendering', () => {
    it('renders file name', () => {
      render(
        <SidebarFileManagerFileNode
          name="test.pdf"
          filePath="/workspace/test.pdf"
          fileData={mockFileData}
        />
      );

      expect(screen.getByText('test.pdf')).toBeInTheDocument();
    });
  });
});
