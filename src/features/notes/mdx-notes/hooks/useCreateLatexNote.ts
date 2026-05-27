import { useState, useCallback } from 'react';
import { workspaceFilesApi } from '@/api/workspaceFilesApi.ts';
import type { WorkspaceFile } from '@/types/workspace.ts';

export function useCreateLatexNote(workspaceId: string | undefined) {
    const [isCreating, setIsCreating] = useState(false);
    const [createError, setCreateError] = useState<string | null>(null);

    const createLatexNote = useCallback(async (noteName: string): Promise<WorkspaceFile | null> => {
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
            const file = await workspaceFilesApi.createLatexNote(workspaceId, noteName);

            window.dispatchEvent(new CustomEvent('workspace-file-created', {
                detail: { file }
            }));
            // Refresh left sidebar file tree
            window.dispatchEvent(new CustomEvent('workspace-files-changed'));

            return file;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to create LaTeX note';
            setCreateError(errorMessage);
            console.error('Error creating LaTeX note:', error);
            return null;
        } finally {
            setIsCreating(false);
        }
    }, [workspaceId]);

    return {
        createLatexNote,
        isCreating,
        createError
    };
}
