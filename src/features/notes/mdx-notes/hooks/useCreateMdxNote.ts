import { useState, useCallback } from 'react';
import { workspaceFilesApi } from '@/api/workspaceFilesApi.ts';
import type { WorkspaceFile } from '@/types/workspace.ts';

export function useCreateMdxNote(workspaceId: string | undefined) {
    const [isCreating, setIsCreating] = useState(false);
    const [createError, setCreateError] = useState<string | null>(null);

    const createNote = useCallback(async (noteName: string): Promise<WorkspaceFile | null> => {
        if (!workspaceId) {
            setCreateError('No workspace selected');
            return null;
        }

        if (!noteName.trim()) {
            setCreateError('Note name cannot be empty');
            return null;
        }

        setIsCreating(true);
        setCreateError(null);

        try {
            const file = await workspaceFilesApi.createMdxNote(workspaceId, noteName);

            // Notify other components (e.g. detail view)
            window.dispatchEvent(new CustomEvent('workspace-file-created', {
                detail: { file }
            }));
            // Refresh left sidebar file tree
            window.dispatchEvent(new CustomEvent('workspace-files-changed'));

            return file;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to create note';
            setCreateError(errorMessage);
            console.error('Error creating note:', error);
            return null;
        } finally {
            setIsCreating(false);
        }
    }, [workspaceId]);

    return {
        createNote,
        isCreating,
        createError
    };
}