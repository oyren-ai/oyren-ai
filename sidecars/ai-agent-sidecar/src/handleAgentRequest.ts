import type { SidecarResponse } from './types/SidecarResponse.ts';
import type { ChatResponse } from './types/ChatResponse.ts';
import type { DetectModelsResponse } from './types/DetectModelsResponse.ts';
import type { TestConnectionResponse } from './types/TestConnectionResponse.ts';
import { handleChat } from './handlers/handleChat.ts';
import { handleDetectLocalModels } from './handlers/handleDetectLocalModels.ts';
import { handleTestConnection } from './handlers/handleTestConnection.ts';
import { SidecarResponseFactory } from './SidecarResponseFactory.ts';
import { verifyAgentRequest } from './verifiers/verifyAgentRequest.ts';
import { VerificationResult } from './types/VerificationResult.ts';
import { AgentRequest } from './types/AgentRequest.ts';

export type { SidecarResponse };

// SECURITY WARNING: Never log jsonInput - contains sensitive data (API keys, messages)
async function handleAgentRequest(jsonInput: string | undefined): Promise<SidecarResponse> {
  try {
    const verification : VerificationResult<AgentRequest, SidecarResponse> = verifyAgentRequest(jsonInput)

    if (verification.error) {
      return verification.error;
    }

    const request = verification.data!;

    switch (request.operation) {
      case 'chat':
        return SidecarResponseFactory.match<ChatResponse>(await handleChat(request));
      case 'detect-models':
        return SidecarResponseFactory.match<DetectModelsResponse>(await handleDetectLocalModels(request));
      case 'test-connection':
        return SidecarResponseFactory.match<TestConnectionResponse>(await handleTestConnection(request));
      default: {
        const unknownOp = (request as { operation: string }).operation;
        return SidecarResponseFactory.error("unknown-error", `Unknown operation: ${unknownOp}`);
      }
    }
  } catch (error) {
    return SidecarResponseFactory.error("parse-error", error instanceof Error ? error.message : String(error));
  }
}

export default handleAgentRequest