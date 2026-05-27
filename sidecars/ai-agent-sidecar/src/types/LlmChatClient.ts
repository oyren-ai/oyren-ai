import type { BaseMessage, AIMessageChunk } from "@langchain/core/messages";

export interface LlmChatClient {
  invoke(input: BaseMessage[]): Promise<AIMessageChunk>;
  bindTools?(tools: unknown[]): LlmChatClient;
}