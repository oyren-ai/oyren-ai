import type { HandlerResponse } from "@/types/HandlerResponse.ts";
import { SidecarError } from "@/types/SidecarError.ts";
import type { TestConnectionResponse } from "@/types/TestConnectionResponse.ts";
import { testOllamaConnection } from "@/providers/ollama/ollama.ts";
import { testGeminiConnection } from "@/providers/gemini/testGeminiConnection.ts";
import { testDeepSeekConnection } from "@/providers/deepseek/testDeepSeekConnection.ts";
import { testOpenRouterConnection } from "@/providers/openrouter/testOpenRouterConnection.ts";
import { TestConnectionRequest } from "@/types/AgentRequest.ts";

export async function handleTestConnection(
  request: TestConnectionRequest
): Promise<HandlerResponse<TestConnectionResponse, SidecarError>> {
  if (!request.aiProvider || !request.model) {
    return {
      error: SidecarError.UnknownError({
        message: "Missing required fields: aiProvider or model",
      }),
    };
  }

  const { aiProvider, model } = request;
  let result: HandlerResponse<boolean, SidecarError>;

  switch (aiProvider.provider.toLowerCase()) {
    case 'ollama':
      result = await testOllamaConnection(model);
      break;
    case 'gemini':
      result = await testGeminiConnection(aiProvider.apiKey, model);
      break;
    case 'deepseek':
      result = await testDeepSeekConnection(aiProvider.apiKey, model);
      break;
    case 'openrouter':
      result = await testOpenRouterConnection(aiProvider.apiKey, model);
      break;
    default:
      return {
        error: SidecarError.UnknownError({
          message: `Unsupported provider: ${aiProvider.provider}`,
        }),
      };
  }

  if (result.error) {
    return {
      data: {
        success: false,
        provider: aiProvider.provider,
        model,
        message: result.error.message || "Connection test failed"
      }
    };
  }

  return {
    data: {
      success: result.data!,
      provider: aiProvider.provider,
      model,
      message: "Connection successful"
    }
  };
}
