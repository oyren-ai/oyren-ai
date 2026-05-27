import { useState, useEffect, useCallback } from 'react';
import { workspaceFilesApi } from '@/api/workspaceFilesApi.ts';
import type { WorkspaceFile } from '@/types/workspace.ts';

export function useLatexNotes(workspaceId: string | undefined) {
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
            const latexNotes = await workspaceFilesApi.listLatexNotes(workspaceId);
            setFiles(latexNotes);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load LaTeX notes');
            console.error('Error loading LaTeX notes:', err);
        } finally {
            setIsLoading(false);
        }
    }, [workspaceId]);

    useEffect(() => {
        loadFiles();
    }, [loadFiles]);

    useEffect(() => {
        const handleFilesUpdated = () => void loadFiles();
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
        loadFiles,
    };
}
