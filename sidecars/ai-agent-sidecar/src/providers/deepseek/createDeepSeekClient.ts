import type {LlmChatClient} from "@/types/LlmChatClient.ts";
import { ChatOpenAI } from "@langchain/openai";


const DEEPSEEK_BASE_URL = "https://api.deepseek.com/v1";

export default function createDeepSeekClient(
    apiKey: string, model: string, temperature: number, maxTokens: number,
): LlmChatClient {
    return new ChatOpenAI({
        apiKey, model, temperature,
        modelKwargs: { max_tokens: maxTokens },
        configuration: { baseURL: DEEPSEEK_BASE_URL },
    });
}
