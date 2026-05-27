import { invoke } from '@tauri-apps/api/core';
import type { WorkspacePrompt } from '@/types/workspacePrompt';

export const workspacePromptApi = {
    create: async (workspaceId: string, title: string, blocks: string): Promise<WorkspacePrompt> => {
        return await invoke('create_workspace_prompt', { workspaceId, title, blocks });
    },
    list: async (workspaceId: string): Promise<WorkspacePrompt[]> => {
        return await invoke('list_workspace_prompts', { workspaceId });
    },
    update: async (promptId: string, title: string, blocks: string): Promise<void> => {
        return await invoke('update_workspace_prompt', { promptId, title, blocks });
    },
    delete: async (promptId: string): Promise<void> => {
        return await invoke('delete_workspace_prompt', { promptId });
    },
    resolve: async (promptId: string): Promise<string> => {
        return await invoke('resolve_workspace_prompt', { promptId });
    },
};