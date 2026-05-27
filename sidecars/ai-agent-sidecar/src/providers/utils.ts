import type { ConversationMessage } from "../types/ConversationMessage.ts";
import type { ImageData } from "../types/AgentRequest.ts";
import { HumanMessage, AIMessage, SystemMessage, type BaseMessage } from "@langchain/core/messages";

/**
 * Converts conversation history to LangChain message format
 * Maps 'assistant' role to 'ai' for LangChain compatibility
 */
export function buildMessageArray(
  history: ConversationMessage[],
  currentMessage: string
): Array<[string, string]> {
  const messages: Array<[string, string]> = history.map(msg => [
    msg.role === 'assistant' ? 'ai' : msg.role,
    msg.content
  ]);

  messages.push(["human", currentMessage]);
  return messages;
}

/**
 * Builds LangChain messages with multimodal support (images)
 */
export function buildMultimodalMessages(
  history: ConversationMessage[],
  currentMessage: string,
  images?: ImageData[]
): BaseMessage[] {
  const messages: BaseMessage[] = [];
  
  // Add history messages
  for (const msg of history) {
    if (msg.role === 'system') {
      messages.push(new SystemMessage(msg.content));
    } else if (msg.role === 'assistant') {
      messages.push(new AIMessage(msg.content));
    } else {
      messages.push(new HumanMessage(msg.content));
    }
  }
  
  // Build current message with optional images
  if (images && images.length > 0) {
    // Multimodal message with images
    const contentParts: Array<{ type: string; text?: string; image_url?: { url: string } }> = [];
    
    // Add text part
    if (currentMessage) {
      contentParts.push({ type: "text", text: currentMessage });
    }
    
    // Add image parts
    for (const img of images) {
      // Convert raw base64 to data URL format for LangChain
      const dataUrl = `data:${img.mime_type};base64,${img.data}`;
      contentParts.push({
        type: "image_url",
        image_url: { url: dataUrl }
      });
    }
    
    messages.push(new HumanMessage({ content: contentParts }));
  } else {
    // Text-only message
    messages.push(new HumanMessage(currentMessage));
  }
  
  return messages;
}
