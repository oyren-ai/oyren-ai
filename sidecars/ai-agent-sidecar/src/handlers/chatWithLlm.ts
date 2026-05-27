import type { LlmChatClient } from "@/types/LlmChatClient.ts";
import type { HandlerResponse } from "@/types/HandlerResponse.ts";
import type { ChatResponse } from "@/types/ChatResponse.ts";
import type { ConversationMessage } from "@/types/ConversationMessage.ts";
import type { ImageData, FileAttachment } from "@/types/AgentRequest.ts";
import type { UserIntent } from "@/intent/types.ts";
import type { ArxivPaperMeta } from "@/capabilities/toolcalling/arxiv/types.ts";
import { SidecarError } from "@/types/SidecarError.ts";
import { chatWithOllama } from "@/providers/ollama/ollamaChat.ts";
import { chatWithGemini } from "@/providers/gemini/chatWithGemini.ts";
import { chatWithDeepSeek } from "@/providers/deepseek/chatWithDeepSeek.ts";
import { chatWithOpenRouter } from "@/providers/openrouter/chatWithOpenRouter.ts";
import {AiProvider} from "@/types/AiProvider.ts";

export function chatWithLlm(
  llm: LlmChatClient,
  aiProvider: AiProvider,
  model: string,
  message: string,
  history: ConversationMessage[],
  images?: ImageData[],
  userIntent?: UserIntent,
  prefetchedPapers?: ArxivPaperMeta[],
  files?: FileAttachment[],
): Promise<HandlerResponse<ChatResponse>> | HandlerResponse<ChatResponse> {
  switch (aiProvider.provider.toLowerCase()) {
    case "ollama":
      return chatWithOllama(llm, model, message, history, images, userIntent, files);
    case "gemini":
      return chatWithGemini(llm, message, history, images, userIntent, prefetchedPapers, files);
    case "deepseek":
      return chatWithDeepSeek(llm, message, history, images, userIntent, prefetchedPapers, files);
    case "openrouter":
      return chatWithOpenRouter(llm, message, history, images, userIntent, prefetchedPapers, files);
    default:
      return {
        error: SidecarError.UnknownError({
          message: `Unsupported provider: ${aiProvider}`,
        }),
      };
  }
}
