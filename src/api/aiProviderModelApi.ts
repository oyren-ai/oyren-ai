import { invoke } from '@tauri-apps/api/core';

export const aiProviderModelApi = {
  updateActive: async (id: string, isActive: boolean): Promise<void> => {
    return await invoke('update_ai_provider_model_active', { id, isActive });
  },
};
