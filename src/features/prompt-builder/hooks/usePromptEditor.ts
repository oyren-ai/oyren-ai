import { useState, useCallback } from 'react';
import { workspacePromptApi } from '@/api/workspacePromptApi';
import type { WorkspacePrompt, PromptBlock } from '@/types/workspacePrompt';

export function usePromptEditor(workspaceId: string | undefined, onSaved: () => void) {
    const [editingPrompt, setEditingPrompt] = useState<WorkspacePrompt | null>(null);
    const [title, setTitle] = useState('');
    const [blocks, setBlocks] = useState<PromptBlock[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    const startNew = useCallback(() => {
        setEditingPrompt(null);
        setTitle('');
        setBlocks([{ type: 'text', content: '' }]);
    }, []);

    const startEdit = useCallback((prompt: WorkspacePrompt) => {
        setEditingPrompt(prompt);
        setTitle(prompt.title);
        setBlocks(JSON.parse(prompt.blocks) as PromptBlock[]);
    }, []);

    const save = useCallback(async () => {
        if (!workspaceId || !title.trim()) return;
        setIsSaving(true);
        try {
            const blocksJson = JSON.stringify(blocks);
            if (editingPrompt) {
                await workspacePromptApi.update(editingPrompt.id, title, blocksJson);
            } else {
                await workspacePromptApi.create(workspaceId, title, blocksJson);
            }
            onSaved();
        } catch (e) {
            console.error('Failed to save prompt:', e);
        } finally {
            setIsSaving(false);
        }
    }, [workspaceId, title, blocks, editingPrompt, onSaved]);

    const isEditing = editingPrompt !== null || blocks.length > 0;

    return {
        editingPrompt, title, setTitle, blocks, setBlocks,
        isSaving, isEditing, startNew, startEdit, save,
    };
}