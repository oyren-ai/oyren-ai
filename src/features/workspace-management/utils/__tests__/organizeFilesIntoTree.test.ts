import { describe, it, expect } from 'vitest';
import { organizeFilesIntoTree } from '../organizeFilesIntoTree';
import type { WorkspaceFile } from '@/types/workspace';
import { SidebarFileManagerTreeNodeType } from '@/types/tree';

describe('organizeFilesIntoTree', () => {
  const createMockFile = (overrides: Partial<WorkspaceFile>): WorkspaceFile => ({
    id: 'file-1',
    workspace_id: 'workspace-123',
    file_path: '/app_data/workspaces/workspace-123/document.pdf',
    file_name: 'document.pdf',
    added_at: '2024-01-01T00:00:00Z',
    last_accessed_at: '2024-01-01T00:00:00Z',
    is_visible: true,
    is_read_only: false,
    ...overrides,
  });

  it('groups a PDF file under Documents folder', () => {
    const files = [createMockFile({ file_name: 'document.pdf' })];
    const tree = organizeFilesIntoTree(files);

    expect(tree['Documents']).toBeDefined();
    expect(tree['Documents'].type).toBe(SidebarFileManagerTreeNodeType.Folder);
    if (tree['Documents'].type === SidebarFileManagerTreeNodeType.Folder) {
      expect(tree['Documents'].children['document.pdf']).toBeDefined();
    }
  });

  it('groups multiple PDFs under Documents', () => {
    const files = [
      createMockFile({ id: 'f1', file_name: 'doc1.pdf' }),
      createMockFile({ id: 'f2', file_name: 'doc2.pdf' }),
    ];
    const tree = organizeFilesIntoTree(files);

    if (tree['Documents'].type === SidebarFileManagerTreeNodeType.Folder) {
      expect(Object.keys(tree['Documents'].children)).toEqual(['doc1.pdf', 'doc2.pdf']);
    }
  });

  it('groups .md files without metadata under Notes', () => {
    const files = [createMockFile({ file_name: 'my-note.md' })];
    const tree = organizeFilesIntoTree(files);

    expect(tree['Notes']).toBeDefined();
    if (tree['Notes'].type === SidebarFileManagerTreeNodeType.Folder) {
      expect(tree['Notes'].children['my-note.md']).toBeDefined();
    }
  });

  it('groups .md files with source_pdf_id metadata under Scans', () => {
    const files = [
      createMockFile({
        file_name: 'scan-output.md',
        metadata: JSON.stringify({ source_pdf_id: 'pdf-123' }),
      }),
    ];
    const tree = organizeFilesIntoTree(files);

    expect(tree['Scans']).toBeDefined();
    if (tree['Scans'].type === SidebarFileManagerTreeNodeType.Folder) {
      expect(tree['Scans'].children['scan-output.md']).toBeDefined();
    }
  });

  it('returns empty tree for empty array', () => {
    expect(organizeFilesIntoTree([])).toEqual({});
  });

  it('skips files with missing file_name or workspace_id', () => {
    const files = [
      createMockFile({ file_name: '' }),
      createMockFile({ workspace_id: '' }),
      createMockFile({ id: 'f3', file_name: 'valid.pdf' }),
    ];
    const tree = organizeFilesIntoTree(files);

    if (tree['Documents'].type === SidebarFileManagerTreeNodeType.Folder) {
      expect(Object.keys(tree['Documents'].children)).toEqual(['valid.pdf']);
    }
  });

  it('handles null or undefined files gracefully', () => {
    const files: unknown[] = [null, undefined, createMockFile({ file_name: 'valid.pdf' })];
    const tree = organizeFilesIntoTree(files as WorkspaceFile[]);

    expect(tree['Documents']).toBeDefined();
  });

  it('omits empty categories', () => {
    const files = [createMockFile({ file_name: 'doc.pdf' })];
    const tree = organizeFilesIntoTree(files);

    expect(tree['Documents']).toBeDefined();
    expect(tree['Notes']).toBeUndefined();
    expect(tree['Scans']).toBeUndefined();
    expect(tree['Other']).toBeUndefined();
  });

  it('groups mixed file types into correct categories', () => {
    const files = [
      createMockFile({ id: 'f1', file_name: 'paper.pdf' }),
      createMockFile({ id: 'f2', file_name: 'notes.md' }),
      createMockFile({
        id: 'f3', file_name: 'extracted.md',
        metadata: JSON.stringify({ source_pdf_id: 'f1' }),
      }),
    ];
    const tree = organizeFilesIntoTree(files);

    expect(Object.keys(tree)).toEqual(['Documents', 'Scans', 'Notes']);
  });
});
