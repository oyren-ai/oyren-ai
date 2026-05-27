import { invoke } from '@tauri-apps/api/core';

/**
 * Opens a URL in the user's default browser
 * @param url The URL to open
 */
export const browserApi = {
  openUrl: async (url: string): Promise<void> => {
    await invoke('open_url_in_browser', { url });
  },
};