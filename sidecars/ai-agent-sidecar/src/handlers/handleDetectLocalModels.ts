import type { HandlerResponse } from "@/types/HandlerResponse.ts";
import { SidecarError } from "@/types/SidecarError.ts";
import type { DetectModelsResponse } from "@/types/DetectModelsResponse.ts";
import { detectOllamaModels } from "@/providers/ollama/ollama.ts";
import { DetectLocalModelsRequest } from "@/types/AgentRequest.ts";

export async function handleDetectLocalModels(
  request: DetectLocalModelsRequest
): Promise<HandlerResponse<DetectModelsResponse>> {
  if (request.provider !== 'ollama') {
    return {
      error: SidecarError.UnknownError({
        message: "Model detection only supported for Ollama",
      }),
    };
  }

  const result = await detectOllamaModels();

  if (result.error) {
    return { error: result.error };
  }

  return {
    data: {
      models: result.data!
    }
  };
}
