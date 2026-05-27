import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import type { HandlerResponse } from "../../types/HandlerResponse.ts";
import { SidecarError } from "../../types/SidecarError.ts";

interface ChatClient {
  invoke(messages: Array<[string, string]>): Promise<{ content: string | unknown }>;
}

export async function testGeminiConnection(
  apiKey: string,
  model: string,
  createClient: (config: { apiKey: string; model: string }) => ChatClient =
    (config) => new ChatGoogleGenerativeAI(config)
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
