import type { HandlerResponse } from "@/types/HandlerResponse.ts";
import type { ChatResponse } from "@/types/ChatResponse.ts";
import { SidecarError } from "@/types/SidecarError.ts";

export function handleGeminiError(
  error: unknown,
  model: string,
): HandlerResponse<ChatResponse> {
  const errorMessage = error instanceof Error ? error.message : String(error);

  if (isModelAccessError(errorMessage, model)) {
    return modelAccessError(model);
  }
  if (isInvalidKeyError(errorMessage)) {
    return invalidKeyError();
  }
  if (isRateLimitError(errorMessage)) {
    return rateLimitError();
  }
  if (isNetworkError(errorMessage)) {
    return networkError();
  }

  return { error: SidecarError.UnknownError({ message: errorMessage }) };
}

function isModelAccessError(msg: string, model: string): boolean {
  return msg.includes("API_KEY_INVALID") ||
    msg.includes("models/gemini-2.5-pro is not found") ||
    msg.includes("models/gemini-3.0") ||
    (msg.includes("not found") &&
      (model.includes("2.5-pro") || model.includes("3.0")));
}

function modelAccessError(model: string): HandlerResponse<ChatResponse> {
  return {
    error: SidecarError.ApiError({
      shortMessage: "Model not available for your API key",
      message:
        `Your API key doesn't have access to ${model}. Free Gemini API keys cannot use Gemini 2.5 Pro or Gemini 3.0 models. Switch to Gemini 2.5 Flash or Gemini 1.5 Flash, or upgrade your API key in Google AI Studio to access premium models.`,
    }),
  };
}

function isInvalidKeyError(msg: string): boolean {
  return msg.includes("API_KEY_INVALID") || msg.includes("invalid API key");
}

function invalidKeyError(): HandlerResponse<ChatResponse> {
  return {
    error: SidecarError.ApiError({
      shortMessage: "Invalid API key",
      message:
        "The provided Gemini API key is invalid. Check your API key in Settings. Get a valid key from Google AI Studio (https://aistudio.google.com/apikey).",
    }),
  };
}

function isRateLimitError(msg: string): boolean {
  return msg.includes("429") || msg.includes("rate limit") || msg.includes("quota");
}

function rateLimitError(): HandlerResponse<ChatResponse> {
  return {
    error: SidecarError.ApiError({
      shortMessage: "Rate limit exceeded",
      message:
        "You've exceeded the API rate limit for your Gemini API key. Wait a few moments and try again, or upgrade your API quota in Google AI Studio.",
    }),
  };
}

function isNetworkError(msg: string): boolean {
  return msg.includes("fetch failed") || msg.includes("ECONNREFUSED") ||
    msg.includes("network") || msg.includes("Connection error");
}

function networkError(): HandlerResponse<ChatResponse> {
  return {
    error: SidecarError.ApiError({
      shortMessage: "Connection failed",
      message:
        "Unable to connect to Gemini API. Please check your internet connection and try again.",
    }),
  };
}
