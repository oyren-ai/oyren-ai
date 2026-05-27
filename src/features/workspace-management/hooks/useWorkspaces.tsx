import {useState, useEffect, useCallback} from 'react';
import {workspaceApi} from '@/api/workspaceApi.ts';
import type {Workspace, WorkspaceDisplay} from '@/types/workspace';

export function useWorkspaces() {
    const [workspaces, setWorkspaces] = useState<WorkspaceDisplay[]>([]);
    const [isLoadingWorkspaces, setIsLoadingWorkspaces] = useState(true);

    const loadWorkspaces = useCallback(async () => {
        try {
            setIsLoadingWorkspaces(true);
            const data = await workspaceApi.list_for_display();
            setWorkspaces(data);
        } catch (error) {
            console.error('Failed to load workspaces:', error);
        } finally {
            setIsLoadingWorkspaces(false);
        }
    }, []);

    const deleteWorkspace = useCallback(async (workspace: Workspace) => {
        if (confirm(`Are you sure you want to delete "${workspace.name}"?`)) {
            try {
                await workspaceApi.delete(workspace.id);
                await loadWorkspaces();
            } catch (error) {
                console.error('Failed to delete workspace:', error);
            }
        }
    }, [loadWorkspaces]);

    useEffect(() => {
        void loadWorkspaces();

        const handleWorkspaceCreated = () => {
            void loadWorkspaces();
        };

        const handleWorkspaceUpdated = (event: Event) => {
            const customEvent = event as CustomEvent<WorkspaceDisplay>;
            setWorkspaces(prev =>
                prev.map(w => w.id === customEvent.detail.id ? customEvent.detail : w)
            );
        };

        const handleWorkspaceDeleted = () => {
            void loadWorkspaces();
        };

        window.addEventListener('workspace-created', handleWorkspaceCreated);
        window.addEventListener('workspace-updated', handleWorkspaceUpdated);
        window.addEventListener('workspace-deleted', handleWorkspaceDeleted);

        return () => {
            window.removeEventListener('workspace-created', handleWorkspaceCreated);
            window.removeEventListener('workspace-updated', handleWorkspaceUpdated);
            window.removeEventListener('workspace-deleted', handleWorkspaceDeleted);
        };
    }, [loadWorkspaces]);

    return {
        workspaces,
        isLoadingWorkspaces,
        loadWorkspaces,
        deleteWorkspace,
    };
}