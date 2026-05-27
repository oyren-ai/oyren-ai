import {LlmChatClient} from "@/types/LlmChatClient.ts";
import { ChatOpenAI } from "@langchain/openai";

const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";

export default function createOpenRouterClient(
    apiKey: string, model: string, temperature: number, maxTokens: number,
): LlmChatClient {
    return new ChatOpenAI({
        apiKey, model, temperature,
        modelKwargs: { max_tokens: maxTokens },
        configuration: {
            baseURL: OPENROUTER_BASE_URL,
            defaultHeaders: {
                "HTTP-Referer": "https://oyren.ai",
                "X-Title": "Oyren AI",
            },
        },
    });
}