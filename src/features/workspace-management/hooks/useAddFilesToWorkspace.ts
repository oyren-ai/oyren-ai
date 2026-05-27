import { useState, useCallback } from 'react';
import { open } from '@tauri-apps/plugin-dialog';
import { workspaceFilesApi } from '@/api/workspaceFilesApi';
import type { Workspace } from '@/types/workspace';

interface AddFilesOptions {
  allowedExtensions?: string[];
  filterName?: string;
}

export function useAddFilesToWorkspace(
  workspace: Workspace | null | undefined,
  setCurrentPdfPath: (path: string | null) => void,
  setCurrentWorkspaceFileId?: (fileId: string | null) => void
) {
  const [loading, setLoading] = useState(false);

  const addFilesToWorkspace = useCallback(async (options?: AddFilesOptions) => {
    if (!workspace?.id) {
      throw new Error('No workspace selected. Please select a workspace first.');
    }

    setLoading(true);
    try {
      const selectedPaths = await open({
        multiple: true,
        filters: [{
          name: options?.filterName || 'Files',
          extensions: options?.allowedExtensions || ['pdf', 'md', 'txt']
        }]
      });

      if (!selectedPaths) return [];

      const paths = Array.isArray(selectedPaths) ? selectedPaths : [selectedPaths];

      const results = [];
      for (const path of paths) {
        const result = await workspaceFilesApi.addFile(workspace.id, path);
        results.push(result);
      }

      // Set first file as current
      if (results.length > 0) {
        setCurrentPdfPath(results[0].workspace_file_path);
        setCurrentWorkspaceFileId?.(results[0].workspace_file_id);
        console.log(`Added ${results.length} file(s) to workspace. Opening first file.`);
      }

      // Notify other components
      window.dispatchEvent(new CustomEvent('workspace-files-changed'));

      return results;
    } finally {
      setLoading(false);
    }
  }, [workspace, setCurrentPdfPath, setCurrentWorkspaceFileId]);

  return {
    loading,
    addFilesToWorkspace
  };
}