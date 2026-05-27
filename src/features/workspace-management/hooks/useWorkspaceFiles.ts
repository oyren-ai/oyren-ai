import * as React from "react";
import { workspaceFilesApi } from "@/api/workspaceFilesApi";
import type { Workspace, WorkspaceFile } from "@/types/workspace";

/**
 * Custom hook to manage workspace files loading and state
 *
 * @param workspace - The selected workspace (null/undefined if no workspace selected)
 * @returns Object containing files array and loading state
 */
export function useWorkspaceFiles(workspace: Workspace | null | undefined) {
  const [files, setFiles] = React.useState<WorkspaceFile[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);

  const loadFiles = React.useCallback(async () => {
    if (!workspace?.id) {
      setFiles([]);
      return;
    }

    setIsLoading(true);
    try {
      const loadedFiles = await workspaceFilesApi.listWorkspaceFiles(workspace.id, false);
      const fileNames = loadedFiles.map((file) => file.file_name);
      console.log(JSON.stringify(fileNames) + " is the file names");
      setFiles(loadedFiles);
    } catch (error) {
      console.error("Failed to load workspace files:", error);
      setFiles([]);
    } finally {
      setIsLoading(false);
    }
  }, [workspace?.id]);

  React.useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  // Listen for workspace file changes from other components
  React.useEffect(() => {
    const handleFilesChanged = () => {
      loadFiles();
    };

    window.addEventListener('workspace-files-changed', handleFilesChanged);
    return () => window.removeEventListener('workspace-files-changed', handleFilesChanged);
  }, [loadFiles]);

  return {
    files,
    isLoading,
    refresh: loadFiles,
  };
}
