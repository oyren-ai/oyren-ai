import { invoke } from '@tauri-apps/api/core';

export const arxivApi = {
  search: async (query: string, maxResults = 10): Promise<string> => {
    return await invoke('search_arxiv', { query, maxResults });
  },
};
