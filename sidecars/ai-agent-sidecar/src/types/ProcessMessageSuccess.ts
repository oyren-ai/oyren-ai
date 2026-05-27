import type { ConfigResponse } from './ConfigResponse.ts';

export interface ProcessMessageSuccess {
  response: string;
  config: ConfigResponse;
}