import {invoke} from '@tauri-apps/api/core';
import type {AiProviderKey} from '../types/aiProviderKey';

export const aiProviderApi = {
    create: async (providerId: string, name: string, key: string): Promise<AiProviderKey> => {
        return await invoke('create_ai_provider_key', {providerId, name, key});
    },

    get: async (id: string): Promise<AiProviderKey | null> => {
        return await invoke('get_ai_provider_key', {id});
    },

    list: async (): Promise<AiProviderKey[]> => {
        return await invoke('list_ai_provider_keys');
    },

    update: async (id: string, name: string): Promise<AiProviderKey> => {
        return await invoke('update_ai_provider_key', {id, name});
    },

    delete: async (id: string): Promise<void> => {
        return await invoke('delete_ai_provider_key', {id});
    },
};