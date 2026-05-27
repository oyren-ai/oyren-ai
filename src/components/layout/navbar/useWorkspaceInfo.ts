import { useState, useCallback } from 'react';
import { writeText } from '@tauri-apps/plugin-clipboard-manager';
import { useViewNavigation } from '@/contexts/NavigationContext';
import { workspaceApi } from '@/api/workspaceApi';

export function useWorkspaceInfo() {
    const { selectedWorkspace, updateSelectedWorkspace } = useViewNavigation();
    const [copied, setCopied] = useState(false);
    const [editingName, setEditingName] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const handleCopy = useCallback(async () => {
        if (!selectedWorkspace) return;
        await writeText(selectedWorkspace.id);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }, [selectedWorkspace]);

    const handleOpenChange = useCallback((open: boolean) => {
        if (open && selectedWorkspace) {
            setEditingName(selectedWorkspace.name);
        }
    }, [selectedWorkspace]);

    const handleSaveName = useCallback(async () => {
        if (!selectedWorkspace || !editingName.trim() || editingName === selectedWorkspace.name) return;
        setIsSaving(true);
        try {
            await workspaceApi.update(selectedWorkspace.id, editingName.trim());
            updateSelectedWorkspace({ name: editingName.trim() });
            window.dispatchEvent(new CustomEvent('workspace-updated'));
        } finally {
            setIsSaving(false);
        }
    }, [selectedWorkspace, editingName, updateSelectedWorkspace]);

    const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
        if (event.key === 'Enter') handleSaveName();
    }, [handleSaveName]);

    return {
        selectedWorkspace, copied, editingName, isSaving,
        setEditingName, handleCopy, handleOpenChange, handleSaveName, handleKeyDown,
    };
}
