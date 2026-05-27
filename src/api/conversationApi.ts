import { invoke } from '@tauri-apps/api/core';
import type {
  Conversation,
  ConversationMessage,
  ConversationWithMessages,
  ImageData,
} from '@/types/conversation';

export interface MessageFileData {
  id: string;           // workspace_file_id
  name: string;         // filename
  path: string;         // file path
}

export const conversationApi = {
  create: async (
    workspaceId: string,
    title: string,
    provider: string,
    model: string
  ): Promise<Conversation> => {
    return await invoke('create_conversation', {
      workspaceId,
      title,
      provider,
      model,
    });
  },

  get: async (conversationId: string): Promise<ConversationWithMessages> => {
    return await invoke('get_conversation', { conversationId });
  },

  listByWorkspace: async (workspaceId: string): Promise<Conversation[]> => {
    return await invoke('list_workspace_conversations', { workspaceId });
  },

  updateTitle: async (conversationId: string, newTitle: string): Promise<void> => {
    return await invoke('update_conversation_title', { conversationId, newTitle });
  },

  pin: async (conversationId: string, pin: boolean): Promise<void> => {
    return await invoke('pin_conversation', { conversationId, pin });
  },

  archive: async (conversationId: string, archive: boolean): Promise<void> => {
    return await invoke('archive_conversation', { conversationId, archive });
  },

  delete: async (conversationId: string): Promise<void> => {
    return await invoke('delete_conversation', { conversationId });
  },

  addMessage: async (
    conversationId: string,
    role: 'user' | 'assistant' | 'system',
    content: string,
    images?: ImageData[],
    files?: MessageFileData[],
    provider?: string | null,
    model?: string | null,
    inputTokens?: number | null,
    outputTokens?: number | null
  ): Promise<ConversationMessage> => {
    return await invoke('add_message_to_conversation', {
      conversationId,
      role,
      content,
      images,
      files,
      provider,
      model,
      inputTokens: inputTokens ?? null,
      outputTokens: outputTokens ?? null,
    });
  },

  saveChatInteraction: async (
    conversationId: string,
    userMessage: string,
    userImages: ImageData[] | null,
    userFiles: MessageFileData[] | null,
    aiResponse: string,
    provider: string,
    model: string,
    inputTokens: number | null,
    outputTokens: number | null
  ): Promise<[ConversationMessage, ConversationMessage]> => {
    return await invoke('save_chat_interaction', {
      conversationId,
      userMessage,
      userImages,
      userFiles,
      aiResponse,
      provider,
      model,
      inputTokens,
      outputTokens,
    });
  },
};
