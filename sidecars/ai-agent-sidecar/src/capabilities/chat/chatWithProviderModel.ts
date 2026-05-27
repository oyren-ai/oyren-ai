import type { LlmChatClient } from "@/types/LlmChatClient.ts";
import type { AIMessageChunk } from "@langchain/core/messages";
import type { HandlerResponse } from "@/types/HandlerResponse.ts";
import type { SidecarError } from "@/types/SidecarError.ts";
import type { ConversationMessage } from "@/types/ConversationMessage.ts";
import type { ChatResponse } from "@/types/ChatResponse.ts";
import type { ImageData, FileAttachment } from "@/types/AgentRequest.ts";
import type { UserIntent } from "@/intent/types.ts";
import type { ArxivPaperMeta } from "@/capabilities/toolcalling/arxiv/types.ts";
import type { ProviderModelConfig } from "./types.ts";
import { buildMultimodalMessages } from "@/providers/utils.ts";
import { executeWithTools } from "@/capabilities/toolcalling/executeWithTools.ts";
import type { ToolCallResult } from "@/capabilities/toolcalling/executeWithTools.ts";

export async function chatWithProviderModel(
  config: ProviderModelConfig,
  llm: LlmChatClient,
  message: string,
  history: ConversationMessage[],
  images?: ImageData[],
  _files?: FileAttachment[],
  userIntent?: UserIntent,
  prefetchedPapers?: ArxivPaperMeta[],
): Promise<HandlerResponse<ChatResponse>> {
  try {
    const hasAttachments = (images?.length ?? 0) > 0 || (_files?.length ?? 0) > 0;
    const messages = buildMultimodalMessages(history, message, images);

    if (!hasAttachments && config.supportsTools
        && userIntent?.isPaperSearch()) {
      const toolResult = await executeWithTools(llm, messages, prefetchedPapers);
      return buildToolResponse(toolResult, userIntent);
    }

    const response = await llm.invoke(messages);
    return buildPlainResponse(config, response, userIntent);
  } catch (error) {
    return config.handleError(error, "provider");
  }
}

function extractTextFromContent(content: string | unknown): string {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .filter((part: { type?: string }) => part.type === "text")
      .map((part: { text?: string }) => part.text ?? "")
      .join("\n");
  }
  if (typeof content === "object" && content !== null) {
    return JSON.stringify(content);
  }
  return String(content ?? "");
}

function buildPlainResponse(
  config: ProviderModelConfig,
  response: AIMessageChunk,
  userIntent?: UserIntent,
): HandlerResponse<ChatResponse> {
  const content = extractTextFromContent(response.content);

  if (!content.trim()) {
    return config.handleError(
      new Error("Model returned empty response"),
      "provider",
    );
  }

  return {
    data: {
      response: content,
      usage_metadata: response.usage_metadata as ChatResponse["usage_metadata"],
      user_intent: userIntent,
    },
  };
}

function buildToolResponse(
  toolResult: ToolCallResult,
  userIntent?: UserIntent,
): HandlerResponse<ChatResponse, SidecarError> {
  return {
    data: {
      response: toolResult.finalResponse,
      usage_metadata: toolResult.usageMetadata,
      arxiv_papers: toolResult.arxivPapers.length > 0
        ? toolResult.arxivPapers
        : undefined,
      user_intent: userIntent,
    },
  };
}
