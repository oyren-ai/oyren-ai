import { useState, useEffect, useCallback } from 'react';
import { workspaceFilesApi } from '@/api/workspaceFilesApi.ts';
import type { WorkspaceFile } from '@/types/workspace.ts';

export function useNotes(workspaceId: string | undefined) {
    const [files, setFiles] = useState<WorkspaceFile[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedFile, setSelectedFile] = useState<WorkspaceFile | null>(null);
    const [error, setError] = useState<string | null>(null);

    const loadFiles = useCallback(async () => {
        if (!workspaceId) {
            setFiles([]);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            // Use dedicated listMdxNotes command for better performance
            const mdxNotes = await workspaceFilesApi.listMdxNotes(workspaceId);
            setFiles(mdxNotes);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load files');
            console.error('Error loading MDX notes:', err);
        } finally {
            setIsLoading(false);
        }
    }, [workspaceId]);

    useEffect(() => {
        loadFiles();
    }, [loadFiles]);

    // Listen for file creation and change events
    useEffect(() => {
        const handleFilesUpdated = () => {
            void loadFiles();
        };

        window.addEventListener('workspace-file-created', handleFilesUpdated);
        window.addEventListener('workspace-files-changed', handleFilesUpdated);
        return () => {
            window.removeEventListener('workspace-file-created', handleFilesUpdated);
            window.removeEventListener('workspace-files-changed', handleFilesUpdated);
        };
    }, [loadFiles]);

    return {
        files,
        isLoading,
        selectedFile,
        setSelectedFile,
        error,
        loadFiles
    };
}
