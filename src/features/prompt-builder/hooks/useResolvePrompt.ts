import { useState, useCallback } from 'react';
import { writeText } from '@tauri-apps/plugin-clipboard-manager';
import { workspacePromptApi } from '@/api/workspacePromptApi';

export function useResolvePrompt() {
    const [isResolving, setIsResolving] = useState(false);
    const [resolved, setResolved] = useState(false);

    const resolveAndCopy = useCallback(async (promptId: string) => {
        setIsResolving(true);
        try {
            const content = await workspacePromptApi.resolve(promptId);
            await writeText(content);
            setResolved(true);
            setTimeout(() => setResolved(false), 2000);
        } catch (e) {
            console.error('Failed to resolve prompt:', e);
        } finally {
            setIsResolving(false);
        }
    }, []);

    return { isResolving, resolved, resolveAndCopy };
}
