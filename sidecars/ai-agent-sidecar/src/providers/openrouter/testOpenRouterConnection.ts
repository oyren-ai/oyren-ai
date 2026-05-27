import { ChatOpenAI } from "@langchain/openai";
import type { HandlerResponse } from "../../types/HandlerResponse.ts";
import { SidecarError } from "../../types/SidecarError.ts";

const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";

interface ChatClient {
  invoke(messages: Array<[string, string]>): Promise<unknown>;
}

export async function testOpenRouterConnection(
  apiKey: string,
  model: string,
  createClient: (config: {
    apiKey: string;
    model: string;
    configuration: {
      baseURL: string;
      defaultHeaders: {
        "HTTP-Referer": string;
        "X-Title": string;
      };
    };
  }) => ChatClient = (config) => new ChatOpenAI(config)
): Promise<HandlerResponse<boolean, SidecarError>> {
  try {
    const llm = createClient({
      apiKey,
      model,
      configuration: {
        baseURL: OPENROUTER_BASE_URL,
        defaultHeaders: {
          "HTTP-Referer": "https://oyren.ai",
          "X-Title": "Oyren AI"
        }
      },
    });

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
