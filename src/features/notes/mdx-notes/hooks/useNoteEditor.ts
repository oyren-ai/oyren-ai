import { useState, useEffect, useCallback, useRef } from 'react';
import { workspaceFilesApi } from '@/api/workspaceFilesApi.ts';
import type { WorkspaceFile } from '@/types/workspace.ts';

export function useNoteEditor(file: WorkspaceFile | null) {
    const [content, setContent] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Load file content when file changes
    useEffect(() => {
        if (!file) {
            setContent('');
            return;
        }

        const loadContent = async () => {
            setIsLoading(true);
            setError(null);

            try {
                const data = await workspaceFilesApi.readFile(file.id);
                setContent(data);
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : 'Failed to load file';
                setError(errorMessage);
                console.error('Error loading file content:', err);
            } finally {
                setIsLoading(false);
            }
        };

        void loadContent();
    }, [file?.id]);

    // Debounced save
    const saveContent = useCallback(async (newContent: string) => {
        if (!file) return;

        setIsSaving(true);
        setError(null);

        try {
            await workspaceFilesApi.updateFile(file.id, newContent);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to save file';
            setError(errorMessage);
            console.error('Error saving file:', err);
        } finally {
            setIsSaving(false);
        }
    }, [file?.id]);

    const debouncedSave = useCallback((newContent: string) => {
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }

        saveTimeoutRef.current = setTimeout(() => {
            void saveContent(newContent);
        }, 1000);
    }, [saveContent]);

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
        };
    }, []);

    const handleContentChange = useCallback((newContent: string) => {
        setContent(newContent);
        debouncedSave(newContent);
    }, [debouncedSave]);

    return {
        content,
        setContent: handleContentChange,
        isLoading,
        isSaving,
        error
    };
}
