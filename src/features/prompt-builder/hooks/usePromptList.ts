import { useState, useCallback, useEffect } from 'react';
import { workspacePromptApi } from '@/api/workspacePromptApi';
import type { WorkspacePrompt } from '@/types/workspacePrompt';

export function usePromptList(workspaceId: string | undefined) {
    const [prompts, setPrompts] = useState<WorkspacePrompt[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const loadPrompts = useCallback(async () => {
        if (!workspaceId) return;
        setIsLoading(true);
        try {
            const data = await workspacePromptApi.list(workspaceId);
            setPrompts(data);
        } catch (e) {
            console.error('Failed to load prompts:', e);
        } finally {
            setIsLoading(false);
        }
    }, [workspaceId]);

    useEffect(() => {
        loadPrompts();
    }, [loadPrompts]);

    return { prompts, isLoading, reloadPrompts: loadPrompts };
}