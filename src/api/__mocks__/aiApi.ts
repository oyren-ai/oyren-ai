import { vi } from 'vitest';

export const aiApi = {
  chat: vi.fn().mockImplementation((request: any, apiKey: string) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          response:
            'This appears to be a text selection from your PDF. The content discusses various topics that might be relevant to your query.',
        });
      }, 500);
    });
  }),
  testConnection: vi.fn().mockResolvedValue(true),
};
