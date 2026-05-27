import { invoke } from '@tauri-apps/api/core';

export interface WorkspaceFileBookmark {
  id: string;
  workspace_id: string;
  workspace_file_id: string;
  bookmark_page: number;
  bookmark_description: string;
  date_created: string;
  metadata: string | null;
}

export const workspaceFileBookmarkApi = {
  create: async (
    workspaceId: string,
    workspaceFileId: string,
    bookmarkPage: number,
    bookmarkDescription: string,
    metadata?: string | null
  ): Promise<WorkspaceFileBookmark> => {
    return await invoke('create_bookmark', {
      workspaceId,
      workspaceFileId,
      bookmarkPage,
      bookmarkDescription,
      metadata: metadata ?? null,
    });
  },

  delete: async (id: string): Promise<void> => {
    return await invoke('delete_bookmark', { id });
  },

  listByFile: async (
    workspaceFileId: string
  ): Promise<WorkspaceFileBookmark[]> => {
    return await invoke('list_bookmarks_by_file', { workspaceFileId });
  },

  listByWorkspace: async (
    workspaceId: string
  ): Promise<WorkspaceFileBookmark[]> => {
    return await invoke('list_bookmarks_by_workspace', { workspaceId });
  },
};