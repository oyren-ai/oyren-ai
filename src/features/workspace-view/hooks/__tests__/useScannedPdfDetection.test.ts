import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useScannedPdfDetection } from '../useScannedPdfDetection';
import type { WorkspaceFile } from '@/types/workspace';

const makeFile = (id: string, filePath: string, metadata?: string): WorkspaceFile => ({
  id,
  workspace_id: 'ws-1',
  file_path: filePath,
  file_name: filePath.split('/').pop() || '',
  added_at: '',
  last_accessed_at: '',
  is_visible: true,
  is_read_only: false,
  metadata,
});

const mockFiles: WorkspaceFile[] = [];

vi.mock('@/contexts/NavigationContext', () => ({
  useViewNavigation: () => ({
    selectedWorkspace: { id: 'ws-1', name: 'Test' },
  }),
}));

vi.mock('@/features/workspace-management/hooks/useWorkspaceFiles', () => ({
  useWorkspaceFiles: () => ({ files: mockFiles, isLoading: false, refresh: vi.fn() }),
}));

describe('useScannedPdfDetection', () => {
  it('returns false when no files match the path', () => {
    mockFiles.length = 0;
    mockFiles.push(makeFile('f1', '/other.pdf'));

    const { result } = renderHook(() => useScannedPdfDetection());
    expect(result.current.isPdfScanned('/nonexistent.pdf')).toBe(false);
  });

  it('returns true when matching file has a conversion', () => {
    mockFiles.length = 0;
    mockFiles.push(makeFile('pdf-1', '/paper.pdf'));
    mockFiles.push(
      makeFile('md-1', '/paper.md', JSON.stringify({ source_pdf_id: 'pdf-1' })),
    );

    const { result } = renderHook(() => useScannedPdfDetection());
    expect(result.current.isPdfScanned('/paper.pdf')).toBe(true);
  });

  it('returns false for file without conversion', () => {
    mockFiles.length = 0;
    mockFiles.push(makeFile('pdf-2', '/regular.pdf'));

    const { result } = renderHook(() => useScannedPdfDetection());
    expect(result.current.isPdfScanned('/regular.pdf')).toBe(false);
  });
});
