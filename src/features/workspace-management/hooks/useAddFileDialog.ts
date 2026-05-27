import { useCallback, useState } from 'react';
import type { Workspace } from '@/types/workspace';
import { useAddFilesToWorkspace } from './useAddFilesToWorkspace';
import { useAddFileFromUrl } from './useAddFileFromUrl';

export function useAddFileDialog(
  workspace: Workspace | null | undefined,
  setCurrentPdfPath: (path: string | null) => void,
  setCurrentWorkspaceFileId: (fileId: string | null) => void,
) {
  const [isOpen, setIsOpen] = useState(false);
  const { addFilesToWorkspace } = useAddFilesToWorkspace(workspace, setCurrentPdfPath, setCurrentWorkspaceFileId);
  const { loading: isDownloading, error: urlError, downloadFromUrl, resetError } = useAddFileFromUrl(workspace?.id);

  const openDialog = useCallback(() => setIsOpen(true), []);
  const closeDialog = useCallback(() => setIsOpen(false), []);

  const handleBrowseFiles = useCallback(async () => {
    try { await addFilesToWorkspace(); }
    catch (e) { console.error('Failed to add file:', e); }
  }, [addFilesToWorkspace]);

  return {
    isOpen, openDialog, closeDialog,
    handleBrowseFiles, handleDownloadFromUrl: downloadFromUrl,
    isDownloading, urlError, resetUrlError: resetError,
  };
}
