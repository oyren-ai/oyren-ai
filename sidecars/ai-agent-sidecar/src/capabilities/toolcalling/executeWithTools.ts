import type { LlmChatClient } from "@/types/LlmChatClient.ts";
import type { BaseMessage } from "@langchain/core/messages";
import { AIMessage, ToolMessage } from "@langchain/core/messages";
import { arxivSearchTool } from "./arxivSearchTool.ts";
import { arxivFetchTool } from "./arxivFetchTool.ts";
import type { ArxivPaperMeta } from "./arxiv/types.ts";
import {
  type ToolCallResult,
  collectPapersFromSearch,
  buildToolCallResult,
} from "./toolCallResultBuilder.ts";

export type { ToolCallResult } from "./toolCallResultBuilder.ts";

const MAX_TOOL_ITERATIONS = 5;

export async function executeWithTools(
  llm: LlmChatClient,
  messages: BaseMessage[],
  prefetchedPapers?: ArxivPaperMeta[],
): Promise<ToolCallResult> {
  const tools = [arxivSearchTool, arxivFetchTool];
  // deno-lint-ignore no-explicit-any
  const llmWithTools = (llm as any).bindTools(tools);
  // deno-lint-ignore no-explicit-any
  const toolMap = new Map<string, any>(tools.map((t) => [t.name, t]));
  const collectedPapers: ArxivPaperMeta[] = prefetchedPapers
    ? [...prefetchedPapers]
    : [];

  let currentMessages = [...messages];
  let lastResponse: AIMessage | null = null;

  for (let i = 0; i < MAX_TOOL_ITERATIONS; i++) {
    const response = await llmWithTools.invoke(currentMessages);
    lastResponse = response as AIMessage;

    const toolCalls = lastResponse.tool_calls;
    if (!toolCalls || toolCalls.length === 0) break;

    currentMessages.push(lastResponse);

    for (const toolCall of toolCalls) {
      const result = await invokeToolCall(toolCall, toolMap, collectedPapers);
      currentMessages.push(result);
    }
  }

  return buildToolCallResult(lastResponse, collectedPapers);
}

async function invokeToolCall(
  toolCall: { name: string; args: Record<string, unknown>; id?: string },
  // deno-lint-ignore no-explicit-any
  toolMap: Map<string, any>,
  collectedPapers: ArxivPaperMeta[],
): Promise<ToolMessage> {
  const tool = toolMap.get(toolCall.name);

  if (!tool) {
    return new ToolMessage({
      content: `Tool "${toolCall.name}" not found`,
      tool_call_id: toolCall.id || toolCall.name,
    });
  }

  const toolResult = await tool.invoke(toolCall.args);

  if (toolCall.name === "arxiv_search") {
    collectPapersFromSearch(toolResult, collectedPapers);
  }

  return new ToolMessage({
    content: toolResult,
    tool_call_id: toolCall.id || toolCall.name,
  });
}
