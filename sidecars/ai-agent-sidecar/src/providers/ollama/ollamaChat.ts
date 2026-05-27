import type { LlmChatClient } from "@/types/LlmChatClient.ts";
import type { HandlerResponse } from "@/types/HandlerResponse.ts";
import type { SidecarError } from "@/types/SidecarError.ts";
import type { ConversationMessage } from "@/types/ConversationMessage.ts";
import type { ChatResponse } from "@/types/ChatResponse.ts";
import type { ImageData, FileAttachment } from "@/types/AgentRequest.ts";
import type { UserIntent } from "@/intent/types.ts";
import type { ProviderModelConfig } from "@/capabilities/chat/types.ts";
import { chatWithProviderModel } from "@/capabilities/chat/chatWithProviderModel.ts";
import { handleOllamaError } from "./ollamaErrors.ts";

const ollamaConfig: ProviderModelConfig = {
  supportsTools: false,
  handleError: handleOllamaError,
};

export async function chatWithOllama(
  llm: LlmChatClient,
  _model: string,
  message: string,
  history: ConversationMessage[],
  images?: ImageData[],
  userIntent?: UserIntent,
  files?: FileAttachment[],
): Promise<HandlerResponse<ChatResponse>> {
  return chatWithProviderModel(
    ollamaConfig, llm, message, history, images, files, userIntent,
  );
}
