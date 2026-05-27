import type { LlmChatClient } from "@/types/LlmChatClient.ts";
import type { HandlerResponse } from "@/types/HandlerResponse.ts";
import type { SidecarError } from "@/types/SidecarError.ts";
import type { ConversationMessage } from "@/types/ConversationMessage.ts";
import type { ChatResponse } from "@/types/ChatResponse.ts";
import type { ImageData, FileAttachment } from "@/types/AgentRequest.ts";
import type { UserIntent } from "@/intent/types.ts";
import type { ArxivPaperMeta } from "@/capabilities/toolcalling/arxiv/types.ts";
import type { ProviderModelConfig } from "@/capabilities/chat/types.ts";
import { chatWithProviderModel } from "@/capabilities/chat/chatWithProviderModel.ts";
import { handleOpenRouterError } from "./openRouterErrors.ts";

const openRouterConfig: ProviderModelConfig = {
  supportsTools: true,
  handleError: handleOpenRouterError,
};

export async function chatWithOpenRouter(
  llm: LlmChatClient,
  message: string,
  history: ConversationMessage[],
  images?: ImageData[],
  userIntent?: UserIntent,
  prefetchedPapers?: ArxivPaperMeta[],
  files?: FileAttachment[],
): Promise<HandlerResponse<ChatResponse, SidecarError>> {
  return chatWithProviderModel(
    openRouterConfig, llm, message, history, images, files,
    userIntent, prefetchedPapers,
  );
}
