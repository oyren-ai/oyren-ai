import { describe, it, expect } from 'vitest';
import { categorizeWorkspaceFile } from '../categorizeWorkspaceFile';
import type { WorkspaceFile } from '@/types/workspace';

const createMockFile = (overrides: Partial<WorkspaceFile>): WorkspaceFile => ({
  id: 'file-1',
  workspace_id: 'ws-1',
  file_path: '/path/to/file',
  file_name: 'test.pdf',
  added_at: '2024-01-01T00:00:00Z',
  last_accessed_at: '2024-01-01T00:00:00Z',
  is_visible: true,
  is_read_only: false,
  ...overrides,
});

describe('categorizeWorkspaceFile', () => {
  it('categorizes .pdf files as Documents', () => {
    expect(categorizeWorkspaceFile(createMockFile({ file_name: 'paper.pdf' }))).toBe('Documents');
    expect(categorizeWorkspaceFile(createMockFile({ file_name: 'paper.PDF' }))).toBe('Documents');
  });

  it('categorizes .md files without metadata as Notes', () => {
    expect(categorizeWorkspaceFile(createMockFile({ file_name: 'note.md' }))).toBe('Notes');
  });

  it('categorizes .md files with source_pdf_id as Scans', () => {
    const file = createMockFile({
      file_name: 'extracted.md',
      metadata: JSON.stringify({ source_pdf_id: 'pdf-123' }),
    });
    expect(categorizeWorkspaceFile(file)).toBe('Scans');
  });

  it('categorizes .md files with invalid JSON metadata as Notes', () => {
    const file = createMockFile({ file_name: 'note.md', metadata: 'not-json' });
    expect(categorizeWorkspaceFile(file)).toBe('Notes');
  });

  it('categorizes unknown extensions as Other', () => {
    expect(categorizeWorkspaceFile(createMockFile({ file_name: 'data.csv' }))).toBe('Other');
    expect(categorizeWorkspaceFile(createMockFile({ file_name: 'image.png' }))).toBe('Other');
  });
});
