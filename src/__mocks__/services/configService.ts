import { vi } from 'vitest';

export default {
  getConfig: vi.fn(() => ({
    ui: {
      darkMode: true,
      sidebarWidth: 400,
      notesHeight: 300,
    },
    privacy: {
      shareAnalytics: false,
      saveConversations: true,
    },
  })),
  updateConfig: vi.fn(),
  resetConfig: vi.fn(),
  exportConfig: vi.fn(),
  importConfig: vi.fn(),
  getUiSettings: vi.fn(() => ({
    darkMode: true,
    sidebarWidth: 400,
    notesHeight: 300,
  })),
  updateUiSettings: vi.fn(),
  getPrivacySettings: vi.fn(() => ({
    shareAnalytics: false,
    saveConversations: true,
  })),
  updatePrivacySettings: vi.fn(),
};
