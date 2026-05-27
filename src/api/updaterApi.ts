import { invoke } from '@tauri-apps/api/core';

export interface UpdateInfo {
  available: boolean;
  current_version: string;
  latest_version: string | null;
  body: string | null;
  whats_changed: string | null;
}

export const updaterApi = {
  checkForUpdates: async (): Promise<UpdateInfo> => {
    return await invoke('check_for_updates');
  },
};