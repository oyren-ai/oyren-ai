import { invoke } from '@tauri-apps/api/core';
import type { WorkspaceFile, AddFileResult } from '../types/workspace';
import { categorizeWorkspaceFile } from '@/features/workspace-management/utils/categorizeWorkspaceFile.ts';

export const workspaceFilesApi = {
  listWorkspaceFiles: async (workspaceId: string, isNotIntersection: boolean): Promise<WorkspaceFile[]> => {
    return await invoke('list_workspace_files', { workspaceId: workspaceId, isNotIntersection });
  },

  getWorkspaceFile: async (fileId: string, withContent: boolean = false): Promise<WorkspaceFile> => {
    return await invoke('get_workspace_file', { fileId, withContent });
  },

  createMdxNote: async (workspaceId: string, noteName: string): Promise<WorkspaceFile> => {
    return await invoke('create_workspace_note', { workspaceId, noteName });
  },

  createLatexNote: async (workspaceId: string, noteName: string): Promise<WorkspaceFile> => {
    return await invoke('create_workspace_latex_note', { workspaceId, noteName });
  },

  listMdxNotes: async (workspaceId: string): Promise<WorkspaceFile[]> => {
    const files = await invoke<WorkspaceFile[]>('list_workspace_files', { workspaceId });
    return files.filter(f => categorizeWorkspaceFile(f) === 'Notes');
  },

  listLatexNotes: async (workspaceId: string): Promise<WorkspaceFile[]> => {
    const files = await invoke<WorkspaceFile[]>('list_workspace_files', { workspaceId });
    return files.filter(f => categorizeWorkspaceFile(f) === 'LatexNotes');
  },

  exportMdxNote: async (workspaceId: string, noteName: string): Promise<string> => {
    // Backend command 'export_mdx_note' not yet implemented
    console.warn('Export functionality not yet implemented on backend');
    throw new Error('Export functionality not available');
  },

  readFile: async (fileId: string): Promise<string> => {
    return await invoke('read_workspace_file', { fileId });
  },

  updateFile: async (fileId: string, content: string): Promise<void> => {
    return await invoke('update_workspace_file', { fileId, content });
  },

  addFile: async (workspaceId: string, sourceFilePath: string): Promise<AddFileResult> => {
    return await invoke('create_workspace_file', { workspaceId, sourceFilePath });
  },

  removeFile: async (workspaceFileId: string): Promise<void> => {
    return await invoke('delete_workspace_file', { workspaceFileId });
  },

  updateFileName: async (workspaceFileId: string, newFileName: string): Promise<void> => {
    return await invoke('rename_workspace_file', { workspaceFileId, newFileName });
  },

  copyFile: async (workspaceFileId: string, destinationWorkspaceId: string): Promise<AddFileResult> => {
    return await invoke('copy_workspace_file', { workspaceFileId, destinationWorkspaceId });
  },

  updateFileMetadata: async (workspaceFileId: string, metadata: string | null): Promise<void> => {
    return await invoke('update_workspace_file_metadata', { workspaceFileId, metadata });
  },
};
