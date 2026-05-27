import { useState, useCallback } from 'react';
import { workspaceFilesApi } from '@/api/workspaceFilesApi';
import type { WorkspaceFile } from '@/types/workspace';

export function useNoteActions() {
  const [selectedFile, setSelectedFile] = useState<WorkspaceFile | null>(null);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const handleRenameNote = useCallback((file: WorkspaceFile) => {
    setSelectedFile(file);
    setRenameDialogOpen(true);
  }, []);

  const handleDeleteNote = useCallback((file: WorkspaceFile) => {
    setSelectedFile(file);
    setDeleteDialogOpen(true);
  }, []);

  const handleRenameConfirm = useCallback(async (file: WorkspaceFile, newName: string) => {
    await workspaceFilesApi.updateFileName(file.id, newName);
    window.dispatchEvent(new CustomEvent('workspace-file-created'));
    window.dispatchEvent(new CustomEvent('workspace-files-changed'));
  }, []);

  const handleDeleteConfirm = useCallback(async (file: WorkspaceFile) => {
    await workspaceFilesApi.removeFile(file.id);
    window.dispatchEvent(new CustomEvent('workspace-file-created'));
    window.dispatchEvent(new CustomEvent('workspace-files-changed'));
  }, []);

  const closeRenameDialog = useCallback(() => {
    setRenameDialogOpen(false);
    setSelectedFile(null);
  }, []);

  const closeDeleteDialog = useCallback(() => {
    setDeleteDialogOpen(false);
    setSelectedFile(null);
  }, []);

  return {
    selectedFile,
    renameDialogOpen,
    deleteDialogOpen,
    handleRenameNote,
    handleDeleteNote,
    handleRenameConfirm,
    handleDeleteConfirm,
    closeRenameDialog,
    closeDeleteDialog,
  };
}
