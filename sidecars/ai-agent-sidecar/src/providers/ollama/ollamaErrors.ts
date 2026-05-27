import type { HandlerResponse } from "@/types/HandlerResponse.ts";
import { SidecarError } from "@/types/SidecarError.ts";
import type { ChatResponse } from "@/types/ChatResponse.ts";

export function handleOllamaError(
  error: unknown,
  model: string,
): HandlerResponse<ChatResponse, SidecarError> {
  const errorMessage = error instanceof Error ? error.message : String(error);

  if (isConnectionError(errorMessage)) {
    return {
      error: SidecarError.ApiError({
        shortMessage: "Ollama not running",
        message:
          "Unable to connect to Ollama. Make sure Ollama is installed and running. Start Ollama by running 'ollama serve' in your terminal, or install it from https://ollama.ai",
      }),
    };
  }

  if (isModelNotFoundError(errorMessage)) {
    return {
      error: SidecarError.ApiError({
        shortMessage: "Model not found",
        message:
          `The Ollama model "${model}" is not installed on your system. Pull the model by running 'ollama pull ${model}' in your terminal.`,
      }),
    };
  }

  return {
    error: SidecarError.UnknownError({ message: errorMessage }),
  };
}

function isConnectionError(msg: string): boolean {
  return msg.includes("ECONNREFUSED") || msg.includes("fetch failed");
}

function isModelNotFoundError(msg: string): boolean {
  return msg.includes("model") &&
    (msg.includes("not found") || msg.includes("does not exist"));
}
