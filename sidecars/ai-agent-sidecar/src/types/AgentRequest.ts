import type { ConversationMessage } from './ConversationMessage.ts';
import type { AiProvider } from './AiProvider.ts';

export interface ImageData {
  data: string;
  mime_type: string;
}

export interface FileAttachment {
  data: string;
  mime_type: string;
  filename: string;
}

export interface ChatRequest {
  operation: 'chat';
  message: string;
  aiProvider: AiProvider;
  conversationHistory: ConversationMessage[];
  model: string;
  temperature?: number;
  maxTokens?: number;
  answerMode?: "short" | "concise" | "detailed";
  images?: ImageData[];
  files?: FileAttachment[];
  attachedFileNames?: string[];
}

export interface DetectLocalModelsRequest {
  operation: 'detect-models';
  provider: 'ollama';
}

export interface TestConnectionRequest {
  operation: 'test-connection';
  aiProvider: AiProvider;
  model: string;
}

export type AgentRequest = ChatRequest | DetectLocalModelsRequest | TestConnectionRequest;