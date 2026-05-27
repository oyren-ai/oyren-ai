import { ChatOpenAI } from "@langchain/openai";
import type { HandlerResponse } from "@/types/HandlerResponse.ts";
import { SidecarError } from "@/types/SidecarError.ts";

const DEEPSEEK_BASE_URL = "https://api.deepseek.com/v1";

interface ChatClient {
  invoke(messages: Array<[string, string]>): Promise<{ content: string | unknown }>;
}

export async function testDeepSeekConnection(
  apiKey: string,
  model: string,
  createClient: (config: { apiKey: string; model: string }) => ChatClient =
    (config) => new ChatOpenAI({
      apiKey: config.apiKey, model: config.model,
      configuration: { baseURL: DEEPSEEK_BASE_URL },
    })
): Promise<HandlerResponse<boolean, SidecarError>> {
  try {
    const llm = createClient({ apiKey, model });
    await llm.invoke([["human", "Say OK. Do not reason, do not explain."]]);
    return { data: true };
  } catch (error) {
    return {
      error: SidecarError.UnknownError({
        message: error instanceof Error ? error.message : String(error),
      }),
    };
  }
}
