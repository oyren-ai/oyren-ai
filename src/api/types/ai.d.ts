export interface AIChatRequestBody {
  message: string;
  images: Array<{
    data: string;
    mime_type: string;
  }>;
  conversation_history: Array<{
    role: string;
    content: string;
  }>;
  model: string;
  temperature: number;
  max_tokens?: number; // Optional - providers use their own defaults
  provider: string;
  answer_mode?: "short" | "concise" | "detailed";
  attached_file_names?: string[];
}

export interface SidecarError {
  errorType: 'unknown-error' | 'feature-not-supported' | 'invalid-input' | 'api-error';
  shortMessage?: string;
  message?: string;
  suggestion?: string;
}

export interface ArxivPaperMeta {
  id: string;
  title: string;
  authors: string[];
  summary: string;
  arxiv_url: string;
  pdf_url: string;
  published: string;
}

export interface UserIntent {
  intent: "paper_search" | "chat_pdf_markdown" | "chat_no_pdf_markdown";
  topics: string[];
  keywords: string[];
  authors?: string[];
  categories?: string[];
}

export interface AIChatResponse {
  response: string;
  model_used?: string;
  usage_metadata?: {
    input_tokens?: number;
    output_tokens?: number;
    total_tokens?: number;
  };
  sidecar_error?: SidecarError;
  arxiv_papers?: ArxivPaperMeta[];
  user_intent?: UserIntent;
}

export interface AiConnectionTestRequest {
  model: string;
  temperature: number;
  maxTokens?: number; // Optional - providers use their own defaults
  apiKey: string;
}

// AI Agent Sidecar types
export interface OllamaModel {
  name: string;
  size: number;
  modified_at: string;
}