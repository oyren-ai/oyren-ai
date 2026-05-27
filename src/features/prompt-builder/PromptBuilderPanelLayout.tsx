import React, { useState, useCallback } from 'react';
import { workspacePromptApi } from '@/api/workspacePromptApi';
import { usePromptList } from './hooks/usePromptList';
import { usePromptEditor } from './hooks/usePromptEditor';
import PromptListView from './components/PromptListView';
import PromptEditorView from './components/PromptEditorView';

interface PromptBuilderPanelLayoutProps {
    workspaceId: string;
}

const PromptBuilderPanelLayout: React.FC<PromptBuilderPanelLayoutProps> = ({ workspaceId }) => {
    const [view, setView] = useState<'list' | 'editor'>('list');
    const { prompts, isLoading, reloadPrompts } = usePromptList(workspaceId);

    const handleSaved = useCallback(() => {
        reloadPrompts();
        setView('list');
    }, [reloadPrompts]);

    const editor = usePromptEditor(workspaceId, handleSaved);

    const handleNew = useCallback(() => {
        editor.startNew();
        setView('editor');
    }, [editor]);

    const handleDelete = useCallback(async () => {
        if (!editor.editingPrompt) return;
        await workspacePromptApi.delete(editor.editingPrompt.id);
        handleSaved();
    }, [editor.editingPrompt, handleSaved]);

    if (view === 'editor') {
        return (
            <PromptEditorView workspaceId={workspaceId} title={editor.title}
                setTitle={editor.setTitle} blocks={editor.blocks} setBlocks={editor.setBlocks}
                isSaving={editor.isSaving} promptId={editor.editingPrompt?.id ?? null}
                onSave={editor.save} onDelete={handleDelete}
                onBack={() => setView('list')} />
        );
    }

    return (
        <PromptListView prompts={prompts} isLoading={isLoading}
            onSelect={(p) => { editor.startEdit(p); setView('editor'); }}
            onNew={handleNew} />
    );
};

export default PromptBuilderPanelLayout;
