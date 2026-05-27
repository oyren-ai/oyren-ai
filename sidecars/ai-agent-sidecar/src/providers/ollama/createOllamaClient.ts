import type {LlmChatClient} from "@/types/LlmChatClient.ts";
import { ChatOllama } from "@langchain/ollama";
const OLLAMA_BASE_URL = "http://localhost:11434";

export default function createOllamaClient(
    model: string, temperature: number, maxTokens: number,
): LlmChatClient {
    return new ChatOllama({
        model, baseUrl: OLLAMA_BASE_URL, temperature, numPredict: maxTokens,
    });
}