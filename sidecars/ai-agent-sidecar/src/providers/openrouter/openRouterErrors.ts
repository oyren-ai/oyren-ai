import type { HandlerResponse } from "../../types/HandlerResponse.ts";
import type { ChatResponse } from "../../types/ChatResponse.ts";
import { SidecarError } from "../../types/SidecarError.ts";

export function handleOpenRouterError(
  error: unknown,
  model: string,
): HandlerResponse<ChatResponse, SidecarError> {
  const errorMessage = error instanceof Error ? error.message : String(error);

  if (isInvalidKeyError(errorMessage)) {
    return invalidKeyError();
  }
  if (isRateLimitError(errorMessage)) {
    return rateLimitError();
  }
  if (isNetworkError(errorMessage)) {
    return networkError();
  }
  if (isModelNotFoundError(errorMessage)) {
    return modelNotFoundError(model);
  }

  return { error: SidecarError.UnknownError({ message: errorMessage }) };
}

function isInvalidKeyError(msg: string): boolean {
  return msg.includes("401") || msg.includes("Unauthorized") ||
    msg.includes("invalid API key");
}

function invalidKeyError(): HandlerResponse<ChatResponse, SidecarError> {
  return {
    error: SidecarError.ApiError({
      shortMessage: "Invalid API key",
      message:
        "The provided OpenRouter API key is invalid. Check your API key in Settings. Get a valid key from OpenRouter (https://openrouter.ai/keys).",
    }),
  };
}

function isRateLimitError(msg: string): boolean {
  return msg.includes("429") || msg.includes("rate limit") || msg.includes("quota");
}

function rateLimitError(): HandlerResponse<ChatResponse, SidecarError> {
  return {
    error: SidecarError.ApiError({
      shortMessage: "Rate limit exceeded",
      message:
        "You've exceeded the API rate limit for your OpenRouter API key. Wait a few moments and try again, or check your usage limits at OpenRouter.",
    }),
  };
}

function isNetworkError(msg: string): boolean {
  return msg.includes("fetch failed") || msg.includes("ECONNREFUSED") ||
    msg.includes("network") || msg.includes("Connection error");
}

function networkError(): HandlerResponse<ChatResponse, SidecarError> {
  return {
    error: SidecarError.ApiError({
      shortMessage: "Connection failed",
      message:
        "Unable to connect to OpenRouter API. Please check your internet connection and try again.",
    }),
  };
}

function isModelNotFoundError(msg: string): boolean {
  return msg.includes("model") && msg.includes("not found");
}

function modelNotFoundError(
  model: string,
): HandlerResponse<ChatResponse, SidecarError> {
  return {
    error: SidecarError.ApiError({
      shortMessage: "Model not available",
      message:
        `The model "${model}" is not available on OpenRouter. Check the available models in Settings or visit OpenRouter's model list.`,
    }),
  };
}
