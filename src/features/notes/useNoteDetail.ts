import { useState, useEffect, useCallback, useRef } from 'react';
import { notesApi } from '@/api/notesApi';

export function useNoteDetail(noteId: string | null) {
    const [content, setContentState] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Load note content when noteId changes
    useEffect(() => {
        if (!noteId) {
            setContentState('');
            return;
        }

        const loadContent = async () => {
            setIsLoading(true);
            setError(null);

            try {
                const note = await notesApi.readNote(noteId);
                setContentState(note.content);
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : 'Failed to load note';
                setError(errorMessage);
                console.error('Error loading note:', err);
            } finally {
                setIsLoading(false);
            }
        };

        void loadContent();
    }, [noteId]);

    // Save content with debounce
    const saveContent = useCallback(async (newContent: string) => {
        if (!noteId) return;

        setIsSaving(true);
        setError(null);

        try {
            await notesApi.updateNote(noteId, newContent);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to save note';
            setError(errorMessage);
            console.error('Error saving note:', err);
        } finally {
            setIsSaving(false);
        }
    }, [noteId]);

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

    const setContent = useCallback((newContent: string) => {
        setContentState(newContent);
        debouncedSave(newContent);
    }, [debouncedSave]);

    return {
        content,
        setContent,
        isLoading,
        isSaving,
        error
    };
}