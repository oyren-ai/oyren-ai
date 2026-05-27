import type { HandlerResponse } from "@/types/HandlerResponse.ts";
import type { ChatResponse } from "@/types/ChatResponse.ts";
import type { SidecarError } from "@/types/SidecarError.ts";

export type ErrorHandler = (
  error: unknown,
  model: string,
) => HandlerResponse<ChatResponse>;

export interface ProviderModelConfig {
  supportsTools: boolean;
  handleError: ErrorHandler;
}
