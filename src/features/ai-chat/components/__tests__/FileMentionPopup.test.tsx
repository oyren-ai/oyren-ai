import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import FileMentionPopup from '../FileMentionPopup';
import type { WorkspaceFile } from '@/types/workspace';

describe('FileMentionPopup', () => {
  const mockFiles: WorkspaceFile[] = [
    {
      id: '1',
      file_name: 'document.pdf',
      file_path: '/path/to/document.pdf',
      workspace_id: 'ws-1',
      added_at: '2024-01-01',
      last_accessed_at: '2024-01-01',
      is_visible: true,
      is_read_only: false,
    },
    {
      id: '2',
      file_name: 'notes.pdf',
      file_path: '/path/to/notes.pdf',
      workspace_id: 'ws-1',
      added_at: '2024-01-01',
      last_accessed_at: '2024-01-01',
      is_visible: true,
      is_read_only: false,
    },
    {
      id: '3',
      file_name: 'research.pdf',
      file_path: '/path/to/research.pdf',
      workspace_id: 'ws-1',
      added_at: '2024-01-01',
      last_accessed_at: '2024-01-01',
      is_visible: true,
      is_read_only: false,
    },
  ];

  const defaultProps = {
    files: mockFiles,
    searchQuery: '',
    selectedFileIds: [],
    currentPdfPath: null,
    onSelect: vi.fn(),
    onClose: vi.fn(),
  };

  it('should render all files when no search query', () => {
    render(<FileMentionPopup {...defaultProps} />);

    expect(screen.getByText('document.pdf')).toBeInTheDocument();
    expect(screen.getByText('notes.pdf')).toBeInTheDocument();
    expect(screen.getByText('research.pdf')).toBeInTheDocument();
  });

  it('should filter files based on search query', () => {
    render(<FileMentionPopup {...defaultProps} searchQuery="doc" />);

    expect(screen.getByText('document.pdf')).toBeInTheDocument();
    expect(screen.queryByText('notes.pdf')).not.toBeInTheDocument();
    expect(screen.queryByText('research.pdf')).not.toBeInTheDocument();
  });

  it('should show "No matching files" when no files match search', () => {
    render(<FileMentionPopup {...defaultProps} searchQuery="xyz" />);

    expect(screen.getByText('No matching files')).toBeInTheDocument();
  });

  it('should show "No files in workspace" when files array is empty', () => {
    render(<FileMentionPopup {...defaultProps} files={[]} />);

    expect(screen.getByText('No files in workspace')).toBeInTheDocument();
  });

  it('should call onSelect when file is clicked', () => {
    const onSelect = vi.fn();
    render(<FileMentionPopup {...defaultProps} onSelect={onSelect} />);

    fireEvent.click(screen.getByText('document.pdf'));

    expect(onSelect).toHaveBeenCalledWith(mockFiles[0]);
  });

  it('should show "Current" badge for currently open file', () => {
    render(
      <FileMentionPopup
        {...defaultProps}
        currentPdfPath="/path/to/document.pdf"
      />
    );

    expect(screen.getByText('Current')).toBeInTheDocument();
  });

  it('should highlight selected files', () => {
    render(
      <FileMentionPopup {...defaultProps} selectedFileIds={['1', '2']} />
    );

    // Check for check icons (selected files show a checkmark)
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBe(3);
  });

  it('should show header text', () => {
    render(<FileMentionPopup {...defaultProps} />);

    expect(screen.getByText('Select file to mention')).toBeInTheDocument();
  });

  it('should filter by partial match', () => {
    render(<FileMentionPopup {...defaultProps} searchQuery="res" />);

    expect(screen.getByText('research.pdf')).toBeInTheDocument();
    expect(screen.queryByText('document.pdf')).not.toBeInTheDocument();
    expect(screen.queryByText('notes.pdf')).not.toBeInTheDocument();
  });
});
