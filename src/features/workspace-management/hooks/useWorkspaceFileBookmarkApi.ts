import { useState, useCallback, useEffect } from 'react';
import {
  workspaceFileBookmarkApi,
  type WorkspaceFileBookmark,
} from '@/api/WorkspaceFileBookmarkApi';

export function useWorkspaceFileBookmarkApi(
  workspaceId: string,
  workspaceFileId: string
) {
  const [bookmarks, setBookmarks] = useState<WorkspaceFileBookmark[]>([]);
  const [loading, setLoading] = useState(false);

  const loadBookmarks = useCallback(async () => {
    if (!workspaceFileId) return;

    setLoading(true);
    try {
      const data = await workspaceFileBookmarkApi.listByFile(workspaceFileId);
      setBookmarks(data);
    } catch (error) {
      console.error('Failed to load bookmarks:', error);
    } finally {
      setLoading(false);
    }
  }, [workspaceFileId]);

  const createBookmark = useCallback(
    async (
      page: number,
      description: string,
      metadata?: string
    ): Promise<void> => {
      try {
        await workspaceFileBookmarkApi.create(
          workspaceId,
          workspaceFileId,
          page,
          description,
          metadata
        );
        await loadBookmarks();
      } catch (error) {
        console.error('Failed to create bookmark:', error);
        throw error;
      }
    },
    [workspaceId, workspaceFileId, loadBookmarks]
  );

  const deleteBookmark = useCallback(
    async (id: string): Promise<void> => {
      try {
        await workspaceFileBookmarkApi.delete(id);
        await loadBookmarks();
      } catch (error) {
        console.error('Failed to delete bookmark:', error);
        throw error;
      }
    },
    [loadBookmarks]
  );

  useEffect(() => {
    void loadBookmarks();
  }, [loadBookmarks]);

  useEffect(() => {
    const handlers = {
      created: () => void loadBookmarks(),
      deleted: () => void loadBookmarks(),
    };

    window.addEventListener('bookmark-created', handlers.created);
    window.addEventListener('bookmark-deleted', handlers.deleted);

    return () => {
      window.removeEventListener('bookmark-created', handlers.created);
      window.removeEventListener('bookmark-deleted', handlers.deleted);
    };
  }, [loadBookmarks]);

  return {
    bookmarks,
    loading,
    createBookmark,
    deleteBookmark,
    reloadBookmarks: loadBookmarks,
  };
}