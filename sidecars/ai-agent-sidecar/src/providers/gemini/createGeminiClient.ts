import {LlmChatClient} from "@/types/LlmChatClient.ts";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

export default function createGeminiClient(
    apiKey: string, model: string, temperature: number, maxTokens: number,
): LlmChatClient {
    return new ChatGoogleGenerativeAI({
        apiKey, model, temperature, maxOutputTokens: maxTokens,
    });
}