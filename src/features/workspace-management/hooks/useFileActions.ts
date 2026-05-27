import { useState, useCallback } from 'react';
import { writeText } from '@tauri-apps/plugin-clipboard-manager';
import { workspaceFilesApi } from '@/api/workspaceFilesApi';
import type { WorkspaceFile } from '@/types/workspace';

const normalizePath = (path?: string | null) => (path ?? "").replace(/\\/g, "/");

interface UseFileActionsOptions {
  currentPdfPath: string | null;
  closePdfTab: (path: string) => void;
  setError: (error: string | null) => void;
}

export function useFileActions({ currentPdfPath, closePdfTab, setError }: UseFileActionsOptions) {
  const [isMutating, setIsMutating] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [copyDialogOpen, setCopyDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<WorkspaceFile | null>(null);

  const handleDeleteFile = useCallback((file: WorkspaceFile) => {
    setError(null);
    setSelectedFile(file);
    setDeleteDialogOpen(true);
  }, [setError]);

  const handleDeleteConfirm = useCallback(async (file: WorkspaceFile) => {
    setIsMutating(true);
    try {
      await workspaceFilesApi.removeFile(file.id);
      if (normalizePath(currentPdfPath) === normalizePath(file.file_path)) {
        closePdfTab(file.file_path);
      }
      setError(null);
      window.dispatchEvent(new CustomEvent('workspace-files-changed'));
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : "Failed to delete file. Please try again.";
      console.error("Failed to delete file:", e);
      setError(errorMessage);
      throw e;
    } finally {
      setIsMutating(false);
    }
  }, [closePdfTab, currentPdfPath, setError]);

  const handleRenameFile = useCallback((file: WorkspaceFile) => {
    setError(null);
    setSelectedFile(file);
    setRenameDialogOpen(true);
  }, [setError]);

  const handleRenameConfirm = useCallback(async (file: WorkspaceFile, newName: string) => {
    setIsMutating(true);
    try {
      await workspaceFilesApi.updateFileName(file.id, newName);
      setError(null);
      window.dispatchEvent(new CustomEvent('workspace-files-changed'));
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : "Failed to rename file. Please try again.";
      console.error("Failed to rename file:", e);
      setError(errorMessage);
      throw e;
    } finally {
      setIsMutating(false);
    }
  }, [setError]);

  const closeDeleteDialog = useCallback(() => { setDeleteDialogOpen(false); setSelectedFile(null); }, []);
  const closeRenameDialog = useCallback(() => { setRenameDialogOpen(false); setSelectedFile(null); }, []);
  const closeCopyDialog = useCallback(() => { setCopyDialogOpen(false); setSelectedFile(null); }, []);

  const handleCopyFile = useCallback((file: WorkspaceFile) => {
    setError(null);
    setSelectedFile(file);
    setCopyDialogOpen(true);
  }, [setError]);

  const handleCopyContent = useCallback(async (file: WorkspaceFile) => {
    try {
      const content = await workspaceFilesApi.readFile(file.id);
      await writeText(content);
    } catch (e) {
      console.error("Failed to copy content:", e);
      setError("Failed to copy content. Please try again.");
    }
  }, [setError]);

  return {
    isMutating,
    selectedFile,
    deleteDialogOpen,
    renameDialogOpen,
    handleDeleteFile,
    handleDeleteConfirm,
    handleRenameFile,
    handleRenameConfirm,
    closeDeleteDialog,
    closeRenameDialog,
    copyDialogOpen,
    handleCopyFile,
    closeCopyDialog,
    handleCopyContent,
  };
}
