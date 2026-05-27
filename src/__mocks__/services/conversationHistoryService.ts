import { vi } from 'vitest';

export const conversationHistoryService = {
  getConversationForPdf: vi.fn().mockResolvedValue([]),
  saveConversationForPdf: vi.fn().mockResolvedValue(undefined),
  clearConversationForPdf: vi.fn().mockResolvedValue(undefined),
  exportConversationAsMarkdown: vi.fn().mockResolvedValue('# Conversation Export'),
  startNewConversationSession: vi.fn().mockResolvedValue('conversation_123_test'),
  getCurrentSession: vi.fn().mockResolvedValue(null),
  createNewSession: vi.fn().mockResolvedValue('conversation_123_test'),
  loadSession: vi.fn().mockResolvedValue(null),
  saveSession: vi.fn().mockResolvedValue(undefined),
};
