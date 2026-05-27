import { useEffect } from 'react';
import { workspaceFilesApi } from '@/api/workspaceFilesApi.ts';
import { DEFAULT_NOTE_TEMPLATE } from '@/features/notes/mdx-notes/utils/defaultNoteTemplate.ts';

function getStorageKey(workspaceId: string): string {
    return `notes-initialized-${workspaceId}`;
}

export function useInitializeDefaultNote(
    workspaceId: string | undefined,
    filesCount: number,
    isLoading: boolean
) {
    useEffect(() => {
        if (!workspaceId || isLoading || filesCount > 0) return;

        const alreadyInitialized = localStorage.getItem(getStorageKey(workspaceId));
        if (alreadyInitialized) return;

        const initializeNote = async () => {
            try {
                localStorage.setItem(getStorageKey(workspaceId), 'true');

                const file = await workspaceFilesApi.createMdxNote(workspaceId, 'Getting Started');
                await workspaceFilesApi.updateFile(file.id, DEFAULT_NOTE_TEMPLATE);

                window.dispatchEvent(new CustomEvent('workspace-file-created', {
                    detail: { file }
                }));
            } catch (error) {
                console.error('Failed to create default note:', error);
                localStorage.removeItem(getStorageKey(workspaceId));
            }
        };

        void initializeNote();
    }, [workspaceId, filesCount, isLoading]);
}
