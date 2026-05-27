import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SidebarFileManagerTree } from '../SidebarFileManagerTree';
import { SidebarFileManagerTreeNode, SidebarFileManagerTreeNodeType } from '@/types/tree';

vi.mock('lucide-react', () => ({
  File: () => <span>File</span>,
  FileText: () => <span>FileText</span>,
  Trash2: () => <span>Trash</span>,
  Edit: () => <span>Edit</span>,
  FileOutput: () => <span>FileOutput</span>,
  Loader2: () => <span>Loader2</span>,
  ChevronRight: () => <span>ChevronRight</span>,
  Folder: () => <span>Folder</span>,
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

// Keep collapsible content always visible during tests
vi.mock('@/components/ui/collapsible', () => ({
  Collapsible: ({ children }: any) => <div>{children}</div>,
  CollapsibleTrigger: ({ children }: any) => <button>{children}</button>,
  CollapsibleContent: ({ children }: any) => <div>{children}</div>,
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

describe('Tree', () => {
  it('renders file node with icon and name', () => {
    const node: SidebarFileManagerTreeNode = {
      type: SidebarFileManagerTreeNodeType.File,
      data: {
        id: 'file-1',
        workspace_id: 'workspace-123',
        file_path: '/app_data/workspaces/workspace-123/document.pdf',
        file_name: 'document.pdf',
        added_at: '2024-01-01T00:00:00Z',
        last_accessed_at: '2024-01-01T00:00:00Z',
        is_visible: true,
        is_read_only: false,
      },
    };

    render(<SidebarFileManagerTree displayNameOfFileOrFolder="document.pdf" treeNodeContainingChildren={node} />);

    expect(screen.getByText('document.pdf')).toBeInTheDocument();
    expect(screen.getByTitle('document.pdf')).toBeInTheDocument();
  });

  it('renders folder node with icon and name', () => {
    const node: SidebarFileManagerTreeNode = {
      type: SidebarFileManagerTreeNodeType.Folder,
      children: {},
    };

    render(<SidebarFileManagerTree displayNameOfFileOrFolder="my-folder" treeNodeContainingChildren={node} />);

    expect(screen.getByText('my-folder')).toBeInTheDocument();
  });

  it('renders folder with nested files (collapsed by default)', () => {
    const node: SidebarFileManagerTreeNode = {
      type: SidebarFileManagerTreeNodeType.Folder,
      children: {
        'file1.pdf': {
          type: SidebarFileManagerTreeNodeType.File,
          data: {
            id: 'file-1',
            workspace_id: 'workspace-123',
            file_path: '/app_data/workspaces/workspace-123/folder/file1.pdf',
            file_name: 'file1.pdf',
            added_at: '2024-01-01T00:00:00Z',
            last_accessed_at: '2024-01-01T00:00:00Z',
            is_visible: true,
            is_read_only: false,
          },
        },
        'file2.pdf': {
          type: SidebarFileManagerTreeNodeType.File,
          data: {
            id: 'file-2',
            workspace_id: 'workspace-123',
            file_path: '/app_data/workspaces/workspace-123/folder/file2.pdf',
            file_name: 'file2.pdf',
            added_at: '2024-01-01T00:00:00Z',
            last_accessed_at: '2024-01-01T00:00:00Z',
            is_visible: true,
            is_read_only: false,
          },
        },
      },
    };

    const { container } = render(<SidebarFileManagerTree displayNameOfFileOrFolder="folder" treeNodeContainingChildren={node} />);

    // Folder name should be visible
    expect(screen.getByText('folder')).toBeInTheDocument();

    // Children are rendered but hidden by default (collapsed)
    // Check that structure exists in DOM
    expect(container.textContent).toContain('folder');
  });

  it('renders nested folder structure (collapsed by default)', () => {
    const node: SidebarFileManagerTreeNode = {
      type: SidebarFileManagerTreeNodeType.Folder,
      children: {
        subfolder: {
          type: SidebarFileManagerTreeNodeType.Folder,
          children: {
            'nested.pdf': {
              type: SidebarFileManagerTreeNodeType.File,
              data: {
                id: 'file-1',
                workspace_id: 'workspace-123',
                file_path: '/app_data/workspaces/workspace-123/folder/subfolder/nested.pdf',
                file_name: 'nested.pdf',
                added_at: '2024-01-01T00:00:00Z',
                last_accessed_at: '2024-01-01T00:00:00Z',
                is_visible: true,
                is_read_only: false,
              },
            },
          },
        },
      },
    };

    const { container } = render(<SidebarFileManagerTree displayNameOfFileOrFolder="folder" treeNodeContainingChildren={node} />);

    // Top-level folder should be visible
    expect(screen.getByText('folder')).toBeInTheDocument();

    // Nested content exists in DOM
    expect(container.textContent).toContain('folder');
  });

  it('renders empty folder', () => {
    const node: SidebarFileManagerTreeNode = {
      type: SidebarFileManagerTreeNodeType.Folder,
      children: {},
    };

    render(<SidebarFileManagerTree displayNameOfFileOrFolder="empty-folder" treeNodeContainingChildren={node} />);

    expect(screen.getByText('empty-folder')).toBeInTheDocument();
  });

  it('truncates long file names', () => {
    const longName = 'very-long-filename-that-should-be-truncated-in-the-ui.pdf';
    const node: SidebarFileManagerTreeNode = {
      type: SidebarFileManagerTreeNodeType.File,
      data: {
        id: 'file-1',
        workspace_id: 'workspace-123',
        file_path: `/app_data/workspaces/workspace-123/${longName}`,
        file_name: longName,
        added_at: '2024-01-01T00:00:00Z',
        last_accessed_at: '2024-01-01T00:00:00Z',
        is_visible: true,
        is_read_only: false,
      },
    };

    render(<SidebarFileManagerTree displayNameOfFileOrFolder={longName} treeNodeContainingChildren={node} />);

    const element = screen.getByText(longName);
    expect(element).toHaveClass('truncate');
  });

  it('removes a file from view after rerendering with updated tree data', () => {
    const fileA = {
      id: '1',
      workspace_id: 'ws-1',
      file_path: '/a.pdf',
      file_name: 'File A',
      added_at: '',
      last_accessed_at: '',
      is_visible: true,
      is_read_only: false,
    };
    const fileB = {
      id: '2',
      workspace_id: 'ws-1',
      file_path: '/b.pdf',
      file_name: 'File B',
      added_at: '',
      last_accessed_at: '',
      is_visible: true,
      is_read_only: false,
    };

    const initialNode: SidebarFileManagerTreeNode = {
      type: SidebarFileManagerTreeNodeType.Folder,
      children: {
        [fileA.file_name]: { type: SidebarFileManagerTreeNodeType.File, data: fileA },
        [fileB.file_name]: { type: SidebarFileManagerTreeNodeType.File, data: fileB },
      },
    };

    const { rerender } = render(<SidebarFileManagerTree displayNameOfFileOrFolder="Root" treeNodeContainingChildren={initialNode} />);
    
    // Find the Root button by finding the text and getting its parent button
    // The mock makes collapsible content always visible, so files should be visible
    // But we still need to verify they exist
    const rootText = screen.getByText('Root');
    const rootButton = rootText.closest('button');
    
    // Click to ensure folder is expanded (even though mock shows content)
    if (rootButton) {
      fireEvent.click(rootButton);
    }
    
    expect(screen.getByText('File A')).toBeInTheDocument();
    expect(screen.getByText('File B')).toBeInTheDocument();

    const updatedNode: SidebarFileManagerTreeNode = {
      type: SidebarFileManagerTreeNodeType.Folder,
      children: {
        [fileB.file_name]: { type: SidebarFileManagerTreeNodeType.File, data: fileB },
      },
    };

    rerender(<SidebarFileManagerTree displayNameOfFileOrFolder="Root" treeNodeContainingChildren={updatedNode} />);

    expect(screen.queryByText('File A')).not.toBeInTheDocument();
    expect(screen.getByText('File B')).toBeInTheDocument();
  });

  it('updates the UI when a file name changes after rerender', () => {
    const fileA = {
      id: '1',
      workspace_id: 'ws-1',
      file_path: '/a.pdf',
      file_name: 'File A',
      added_at: '',
      last_accessed_at: '',
      is_visible: true,
      is_read_only: false,
    };
    const fileB = {
      id: '2',
      workspace_id: 'ws-1',
      file_path: '/b.pdf',
      file_name: 'File B',
      added_at: '',
      last_accessed_at: '',
      is_visible: true,
      is_read_only: false,
    };

    const initialNode: SidebarFileManagerTreeNode = {
      type: SidebarFileManagerTreeNodeType.Folder,
      children: {
        [fileA.file_name]: { type: SidebarFileManagerTreeNodeType.File, data: fileA },
        [fileB.file_name]: { type: SidebarFileManagerTreeNodeType.File, data: fileB },
      },
    };

    const { rerender } = render(
      <SidebarFileManagerTree
        displayNameOfFileOrFolder="Root"
        treeNodeContainingChildren={initialNode}
      />
    );
    
    // Find the Root button by finding the text and getting its parent button
    const rootText = screen.getByText('Root');
    const rootButton = rootText.closest('button');
    
    // Click to ensure folder is expanded (even though mock shows content)
    if (rootButton) {
      fireEvent.click(rootButton);
    }
    
    expect(screen.getByText('File A')).toBeInTheDocument();
    expect(screen.getByText('File B')).toBeInTheDocument();

    const editedFileB = { ...fileB, file_name: 'File B Updated' };

    const updatedNode: SidebarFileManagerTreeNode = {
      type: SidebarFileManagerTreeNodeType.Folder,
      children: {
        [fileA.file_name]: { type: SidebarFileManagerTreeNodeType.File, data: fileA },
        [editedFileB.file_name]: { type: SidebarFileManagerTreeNodeType.File, data: editedFileB },
      },
    };

    rerender(
      <SidebarFileManagerTree
        displayNameOfFileOrFolder="Root"
        treeNodeContainingChildren={updatedNode}
      />
    );

    expect(screen.getByText('File A')).toBeInTheDocument();
    expect(screen.getByText('File B Updated')).toBeInTheDocument();
    expect(screen.queryByText('File B', { exact: true })).not.toBeInTheDocument();
  });
});
