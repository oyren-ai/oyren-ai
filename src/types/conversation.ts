export interface Conversation {
  id: string;
  workspace_id: string;
  title: string;
  provider: string;
  model: string;
  created_at: string;
  updated_at: string;
  last_accessed_at: string;
  is_pinned: boolean;
  is_archived: boolean;
  is_active: boolean;
}

export interface ConversationMessage {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  images?: ImageData[];
  attached_files?: ConversationFile[];
  created_at: string;
  sequence_number: number;
  provider?: string | null;
  model?: string | null;
  input_tokens?: number | null;
  output_tokens?: number | null;
}

export interface ImageData {
  data: string;
  mime_type: string;
}

export interface ConversationFileMetadata {
  filename: string;
}

export interface ConversationFile {
  id: string;
  workspace_file_id: string | null;
  conversation_id: string;
  conversation_message_id: string;
  metadata: string; // JSON string
  is_attachment: boolean;
  created_at: string;
}

export interface ConversationWithMessages {
  conversation: Conversation;
  messages: ConversationMessage[];
}
