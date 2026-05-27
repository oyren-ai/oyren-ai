import type { ArxivPaperMeta } from "@/capabilities/toolcalling/arxiv/types.ts";
import type { UserIntent } from "@/intent/types.ts";

export interface ChatResponse {
  response: string;
  usage_metadata?: {
    input_tokens?: number;
    output_tokens?: number;
    total_tokens?: number;
  };
  arxiv_papers?: ArxivPaperMeta[];
  user_intent?: UserIntent;
}
