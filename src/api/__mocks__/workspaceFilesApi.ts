import { vi } from 'vitest';

export const workspaceFilesApi = {
  listWorkspaceFiles: vi.fn(),
  createMdxNote: vi.fn(),
  listMdxNotes: vi.fn(),
  exportMdxNote: vi.fn(),
  readFile: vi.fn(),
  updateFile: vi.fn(),
  addFile: vi.fn(),
  removeFile: vi.fn(),
  getWorkspaceFile: vi.fn().mockResolvedValue({ content: '' }),
};
