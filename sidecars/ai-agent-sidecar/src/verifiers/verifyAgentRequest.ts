import type { AgentRequest } from '../types/AgentRequest.ts';
import type { VerificationResult } from '../types/VerificationResult.ts';
import type { SidecarResponse } from '../types/SidecarResponse.ts';
import { SidecarResponseFactory } from '../SidecarResponseFactory.ts';

export function verifyAgentRequest(jsonInput: string | undefined): VerificationResult<AgentRequest, SidecarResponse> {
  const err = (msg: string) => ({ error: SidecarResponseFactory.error("validation-error", msg) });

  if (!jsonInput) return err("No input received");

  const request: AgentRequest = JSON.parse(jsonInput);

  if (!request.operation) return err("Missing required field: operation");

  return { data: request };
}