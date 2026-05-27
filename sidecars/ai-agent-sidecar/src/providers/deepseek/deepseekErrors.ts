import type { HandlerResponse } from "@/types/HandlerResponse.ts";
import type { ChatResponse } from "@/types/ChatResponse.ts";
import { SidecarError } from "@/types/SidecarError.ts";

export function handleDeepSeekError(
  error: unknown,
  _model: string,
): HandlerResponse<ChatResponse, SidecarError> {
  const errorMessage = error instanceof Error ? error.message : String(error);
  return { error: SidecarError.UnknownError({ message: errorMessage }) };
}
