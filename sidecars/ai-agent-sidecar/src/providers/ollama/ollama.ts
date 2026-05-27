import { ChatOllama } from "@langchain/ollama";
import type { HandlerResponse } from "@/types/HandlerResponse.ts";
import { SidecarError } from "@/types/SidecarError.ts";
import type { OllamaModel } from "@/types/DetectModelsResponse.ts";

const OLLAMA_BASE_URL = "http://localhost:11434";

export interface OllamaTestClient {
  invoke(messages: Array<[string, string]>): Promise<unknown>;
}

type OllamaClientFactory = (config: { model: string; baseUrl: string }) => OllamaTestClient;

export const defaultOllamaClientFactory: OllamaClientFactory =
  (config) => new ChatOllama(config);

export async function detectOllamaModels(
  fetchFn: typeof fetch = fetch,
): Promise<HandlerResponse<OllamaModel[], SidecarError>> {
  try {
    const response = await fetchFn(`${OLLAMA_BASE_URL}/api/tags`);
    if (!response.ok) {
      return {
        error: SidecarError.ApiError({
          shortMessage: "Failed to fetch models",
          message:
            `Failed to fetch Ollama models: ${response.statusText}. Make sure Ollama is running properly.`,
        }),
      };
    }
    const data = await response.json();
    return { data: data.models || [] };
  } catch (error) {
    return ollamaConnectionError(error);
  }
}

export async function testOllamaConnection(
  model: string,
  createClient: OllamaClientFactory = defaultOllamaClientFactory,
): Promise<HandlerResponse<boolean, SidecarError>> {
  try {
    const llm = createClient({ model, baseUrl: OLLAMA_BASE_URL });
    await llm.invoke([["human", "test"]]);
    return { data: true };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    if (msg.includes("model") && (msg.includes("not found") || msg.includes("does not exist"))) {
      return {
        error: SidecarError.ApiError({
          shortMessage: "Model not found",
          message:
            `The Ollama model "${model}" is not installed. Pull the model by running 'ollama pull ${model}' in your terminal.`,
        }),
      };
    }
    return ollamaConnectionError(error);
  }
}

function ollamaConnectionError(
  error: unknown,
): HandlerResponse<never, SidecarError> {
  const msg = error instanceof Error ? error.message : String(error);
  if (msg.includes("ECONNREFUSED") || msg.includes("fetch failed")) {
    return {
      error: SidecarError.ApiError({
        shortMessage: "Ollama not running",
        message:
          "Unable to connect to Ollama. Start Ollama by running 'ollama serve' in your terminal.",
      }),
    };
  }
  return { error: SidecarError.UnknownError({ message: msg }) };
}
