import { useCallback } from 'react';
import type { Workspace } from '@/types/workspace';
import { useAddFilesToWorkspace } from '@/features/workspace-management/hooks/useAddFilesToWorkspace';

interface RecentPdf {
  path: string;
  name: string;
  lastOpened: number;
}

export function usePdfOperations(
  setCurrentPdfPath: (path: string | null) => void,
  setCurrentSessionId: (id: string | null) => void,
  workspace?: Workspace,
  setCurrentWorkspaceFileId?: (fileId: string | null) => void
) {
  const { loading, addFilesToWorkspace } = useAddFilesToWorkspace(workspace, setCurrentPdfPath, setCurrentWorkspaceFileId);

  const savePdfToRecents = useCallback((path: string) => {
    const filename = path.split('/').pop() || 'Unknown';
    const recentPdf: RecentPdf = {
      path,
      name: filename,
      lastOpened: Date.now()
    };

    try {
      const stored = localStorage.getItem('recent-pdfs');
      let recents: RecentPdf[] = stored ? JSON.parse(stored) : [];

      // Remove if already exists (to update timestamp)
      recents = recents.filter((pdf) => pdf.path !== path);

      // Add to beginning
      recents.unshift(recentPdf);

      // Keep only last 20
      recents = recents.slice(0, 20);

      localStorage.setItem('recent-pdfs', JSON.stringify(recents));
    } catch (error) {
      console.error('Error saving to recents:', error);
    }
  }, []);

  const handleOpenPdf = useCallback(async () => {
    try {
      const results = await addFilesToWorkspace({
        allowedExtensions: ['pdf'],
        filterName: 'PDF Files'
      });

      // Clear session ID and save to recents
      if (results.length > 0) {
        setCurrentSessionId(null);
        results.forEach(result => savePdfToRecents(result.workspace_file_path));
      }
    } catch (error) {
      console.error('Error copying PDF to workspace:', error);
    }
  }, [addFilesToWorkspace, setCurrentSessionId, savePdfToRecents]);

  const handleOpenPdfPath = useCallback((path: string, workspaceFileId: string) => {
    if (!workspaceFileId) {
      throw new Error('workspaceFileId is required when opening a PDF');
    }

    // Clear session ID to start fresh when opening a new PDF
    setCurrentSessionId(null);
    setCurrentPdfPath(path);

    // Set workspace file ID for bookmark creation
    if (setCurrentWorkspaceFileId) {
      setCurrentWorkspaceFileId(workspaceFileId);
    }

    savePdfToRecents(path);
  }, [setCurrentPdfPath, setCurrentSessionId, setCurrentWorkspaceFileId, savePdfToRecents]);

  return {
    loading,
    handleOpenPdf,
    handleOpenPdfPath
  };
}
