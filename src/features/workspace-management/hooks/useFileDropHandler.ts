import { useCallback } from 'react';
import { workspaceFilesApi } from '@/api/workspaceFilesApi';
import type { Workspace } from '@/types/workspace';

const normalizePath = (path?: string | null) => (path ?? "").replace(/\\/g, "/");

interface UseFileDropHandlerOptions {
  workspace: Workspace | null | undefined;
  setCurrentPdfPath: (path: string | null) => void;
  setCurrentWorkspaceFileId: (fileId: string | null) => void;
  setError: (error: string | null) => void;
}

export function useFileDropHandler({
  workspace,
  setCurrentPdfPath,
  setCurrentWorkspaceFileId,
  setError,
}: UseFileDropHandlerOptions) {
  const handleFilesDropped = useCallback(async (paths: string[]) => {
    if (!workspace?.id || paths.length === 0) return;

    setError(null);
    try {
      // Fetch fresh file list inside handler (avoids stale closure)
      const existingFiles = await workspaceFilesApi.listWorkspaceFiles(workspace.id, false);
      const existingPaths = new Set(existingFiles.map(f => normalizePath(f.file_path)));

      const newPaths = paths.filter(path => !existingPaths.has(normalizePath(path)));

      if (newPaths.length === 0) {
        const firstPath = paths[0];
        const existingFile = existingFiles.find(
          f => normalizePath(f.file_path) === normalizePath(firstPath)
        );
        if (existingFile) {
          setCurrentPdfPath(existingFile.file_path);
          setCurrentWorkspaceFileId(existingFile.id);
        }
        return;
      }

      const results = [];
      for (const path of newPaths) {
        const result = await workspaceFilesApi.addFile(workspace.id, path);
        results.push(result);
      }

      if (results.length > 0) {
        setCurrentPdfPath(results[0].workspace_file_path);
        setCurrentWorkspaceFileId(results[0].workspace_file_id);
      }

      window.dispatchEvent(new CustomEvent('workspace-files-changed'));
    } catch (e) {
      console.error("Failed to add dropped files:", e);
      setError("Failed to add dropped files. Please try again.");
    }
  }, [workspace?.id, setCurrentPdfPath, setCurrentWorkspaceFileId, setError]);

  return { handleFilesDropped };
}
