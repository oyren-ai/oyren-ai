import { aiApi } from '@/api/aiApi';
import { oyrenChatApi } from '@/api/oyrenChatApi';
import { aiProviderModelApi } from '@/api/aiProviderModelApi';
import { createUserMessage, createAssistantMessage, createErrorMessage } from '../messageFactory';
import { extractArxivPapers } from '../../utils/arxivContentUtils';
import { isOyrenCreditsProvider } from '../../utils/oyrenCreditsProvider';
import { formatChatApiErrorForStructured } from '../../utils/formatChatApiError';
import type { AnswerMode, ChatMessage, MessageFile, PendingImage, StructuredError } from '../../types';
import type { ArxivPaperMeta, UserIntent } from '@/api/types/ai';

export interface SendMessageDependencies {
  // Configuration
  apiKey: string | null;
  provider: string | null;
  selectedModel: string | null;
  temperature: number;
  fetchFileContent?: (fileId: string, includeContent: boolean) => Promise<{ content?: string }>;
  contextFiles?: MessageFile[];

  // Current state
  messages: ChatMessage[];

  // State setters
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  setIsLoading: (loading: boolean) => void;
  setAiError: (error: string | null) => void;

  // Refs
  abortControllerRef: React.MutableRefObject<AbortController | null>;
  activeRequestIdRef: React.MutableRefObject<number>;
  currentRequestIdRef: React.MutableRefObject<string | null>;

  /** When provided, state updates in finally/catch are skipped after unmount (avoids "window is not defined" in test teardown). */
  getIsMounted?: () => boolean;
}

export type SendMessageRequest = {
  messageTextDisplayedInChatBubble: string;
  messageTextWithFileContentsSentToAI?: string;
  images: PendingImage[];
  answerMode: AnswerMode;
  files?: MessageFile[];
  isRetry?: boolean;
}

export function createSendMessageCallback(deps: SendMessageDependencies) {
  return async (request: SendMessageRequest): Promise<void> => {
    const { apiKey, provider, selectedModel, temperature, fetchFileContent, contextFiles, messages, setMessages, setIsLoading, setAiError, abortControllerRef, activeRequestIdRef, currentRequestIdRef, getIsMounted } = deps;
    const { messageTextDisplayedInChatBubble, images, answerMode, files, isRetry = false } = request;

    if (!validateConfiguration(apiKey, provider)) return;

    const allFilesForAiContext = deduplicateFiles(contextFiles, files);
    let finalMessageText = await fetchAndMergeFileContents(messageTextDisplayedInChatBubble, messageTextDisplayedInChatBubble, allFilesForAiContext, fetchFileContent);

    // Fallback message for snippet-only requests
    if (!finalMessageText.trim() && images.length > 0) {
      finalMessageText = "Analyze this snippet";
    }

    if (!isRetry) {
      const userMessage = createUserMessage(messageTextDisplayedInChatBubble, images, files, finalMessageText);
      console.log(`[sendMessage] 💬 User message created with ${userMessage.images?.length || 0} images`);
      setMessages(prev => [...prev, userMessage]);
    }

    setIsLoading(true);
    setAiError(null);

    try {
      abortControllerRef.current = new AbortController();
      const requestId = ++activeRequestIdRef.current;

      // Generate UUID for backend tracking
      const backendRequestId = crypto.randomUUID();
      currentRequestIdRef.current = backendRequestId;
      console.log(`[sendMessage] 🆔 Request ID: ${backendRequestId}`);

      const apiRequest = buildAiApiRequest(finalMessageText, images, messages, selectedModel, temperature, provider!, answerMode, allFilesForAiContext);
      console.log(`[sendMessage] 📤 Sending to backend: images count=${apiRequest.images.length}`);

      let apiResponse;
      if (isOyrenCreditsProvider(provider)) {
        // Route through Oyren web API using the user's credit balance
        apiResponse = await oyrenChatApi.chat(
          {
            message: finalMessageText,
            images: apiRequest.images,
            conversationHistory: apiRequest.conversation_history,
            model: apiRequest.model,
            temperature: apiRequest.temperature,
            answerMode: apiRequest.answer_mode,
          },
          abortControllerRef.current?.signal,
        );
        // Refresh credit balance in sidebar after each successful call
        window.dispatchEvent(new Event('credits-should-refresh'));
      } else {
        // Ollama doesn't need an API key, pass empty string
        apiResponse = await aiApi.chat(apiRequest, apiKey || '', backendRequestId);
      }

      // Check if response contains a sidecar error
      if (apiResponse.sidecar_error) {
        // Handle structured error from sidecar
        const errorMessage = createErrorMessage(
          apiResponse.sidecar_error.message || apiResponse.sidecar_error.shortMessage || 'An error occurred',
          {
            errorType: apiResponse.sidecar_error.errorType,
            shortMessage: apiResponse.sidecar_error.shortMessage,
            message: apiResponse.sidecar_error.message,
            suggestion: apiResponse.sidecar_error.suggestion
          }
        );
        setMessages(prev => [...prev, errorMessage]);
        setAiError(apiResponse.sidecar_error.shortMessage || apiResponse.sidecar_error.message || 'An error occurred');
        return;
      }

      const inputTokens = apiResponse.usage_metadata?.input_tokens;
      const outputTokens = apiResponse.usage_metadata?.output_tokens;

      handleApiSuccess(apiResponse.response, requestId, activeRequestIdRef.current, setMessages, inputTokens, outputTokens, apiResponse.arxiv_papers, apiResponse.user_intent);

      // Clear loading as soon as we have the full response so UI shows "finished" immediately
      if (getIsMounted?.() !== false) {
        setIsLoading(false);
      }

      // Mark model as active on successful response
      if (selectedModel) {
        aiProviderModelApi.updateActive(selectedModel, true).catch(() => {});
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // Always clear loading on failure — do not gate on getIsMounted here; a false-positive
      // unmounted read (HMR / webview) would otherwise leave "AI is thinking" stuck forever.
      setIsLoading(false);
      handleApiError(error, setMessages, setAiError);
    } finally {
      // Always reset loading + refs so the UI never hangs after 4xx/5xx or thrown errors.
      setIsLoading(false);
      abortControllerRef.current = null;
      currentRequestIdRef.current = null;
    }
  };
}

// Helper functions
function validateConfiguration(apiKey: string | null, provider: string | null): boolean {
  if (!provider) {
    console.error('No provider configured');
    return false;
  }

  // Oyren Credits and Ollama don't require a local API key
  if (isOyrenCreditsProvider(provider) || provider.toLowerCase() === 'ollama') {
    return true;
  }

  if (!apiKey) {
    console.error('No API key configured for provider:', provider);
    return false;
  }

  return true;
}

async function fetchAndMergeFileContents(initialText: string, displayText: string, files: MessageFile[] | undefined, fetchFileContent?: (fileId: string, includeContent: boolean) => Promise<{ content?: string }>): Promise<string> {
  if (!files || files.length === 0 || !fetchFileContent) return initialText;

  const fileContents: string[] = [];
  for (const file of files) {
    try {
      const fileData = await fetchFileContent(file.id, true);
      if (fileData.content) {
        fileContents.push(`--- ${file.name} ---\n${fileData.content}`);
      } else {
        fileContents.push(`[EMPTY_FILE: ${file.name}]`);
      }
    } catch (error) {
      console.error(`Failed to fetch content for ${file.name}:`, error);
      fileContents.push(`[EMPTY_FILE: ${file.name}]`);
    }
  }

  if (fileContents.length === 0) return initialText;
  const filesText = fileContents.join('\n\n');
  return displayText ? `${filesText}\n\n${displayText}` : filesText || initialText;
}

function buildAiApiRequest(message: string, images: PendingImage[], messages: ChatMessage[], selectedModel: string | null, temperature: number, provider: string, answerMode: AnswerMode, files?: MessageFile[]) {
  return {
    message,
    images: transformImages(images),
    conversation_history: buildConversationHistory(messages),
    model: selectedModel || 'gemini-2.5-flash',
    temperature,
    provider,
    answer_mode: answerMode,
    attached_file_names: files?.map(f => f.name) ?? [],
  };
}

function transformImages(images: PendingImage[]): Array<{ data: string; mime_type: string }> {
  console.log(`[transformImages] 🖼️  Transforming ${images.length} images`);
  return images.map((img, index) => {
    // Strip the data:image/png;base64, prefix if present - backend expects raw base64 only
    const base64Data = img.data.includes(',') ? img.data.split(',')[1] : img.data;
    console.log(`[transformImages] Image ${index}: raw base64 length=${base64Data.length}, first 20 chars=${base64Data.substring(0, 20)}`);
    return {
      data: base64Data,
      mime_type: 'image/png'
    };
  });
}

function buildConversationHistory(messages: ChatMessage[]): Array<{ role: string; content: string }> {
  return messages.map(m => {
    const rawContent = (m.type === 'user' && m.messageTextWithFileContentsSentToAI)
      ? m.messageTextWithFileContentsSentToAI
      : m.content;
    return {
      role: m.type === 'user' ? 'user' : 'assistant',
      content: extractArxivPapers(rawContent).displayContent
    };
  });
}

function deduplicateFiles(contextFiles?: MessageFile[], currentFiles?: MessageFile[]): MessageFile[] {
  const fileMap = new Map<string, MessageFile>();
  contextFiles?.forEach(f => fileMap.set(f.id, f));
  currentFiles?.forEach(f => fileMap.set(f.id, f));
  return Array.from(fileMap.values());
}

function handleApiSuccess(
  response: string,
  requestId: number,
  currentRequestId: number,
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>,
  inputTokens?: number,
  outputTokens?: number,
  arxivPapers?: ArxivPaperMeta[],
  userIntent?: UserIntent,
): void {
  const aiMessage = createAssistantMessage(response, inputTokens, outputTokens, arxivPapers, userIntent);
  if (requestId === currentRequestId) {
    setMessages(prev => [...prev, aiMessage]);
  }
}

function isAbortErrorCheck(error: unknown): boolean {
  return error instanceof Error && error.name === 'AbortError';
}

function handleApiError(
  error: unknown,
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>,
  setAiError: (error: string | null) => void,
  customErrorMessage?: string
): void {
  if (!isAbortErrorCheck(error)) {
    const errorStr = error instanceof Error ? error.message : String(error);
    let parsedError: StructuredError;

    if (errorStr.includes('AI agent')) {
      const lines = errorStr.split('\n');
      const suggestions: string[] = [];
      let technicalDetails = '';

      let inSuggestions = false;
      for (const line of lines) {
        if (line.includes('Suggested solutions:')) {
          inSuggestions = true;
          continue;
        }
        if (inSuggestions) {
          const match = line.match(/^\s*\d+\.\s*(.+)$/);
          if (match) {
            suggestions.push(match[1].trim());
          } else if (line.trim() && !line.includes('Details:')) {
            inSuggestions = false;
          }
        }
        if (line.includes('Details:')) {
          technicalDetails = line.split('Details:')[1]?.trim() || '';
        }
      }

      parsedError = {
        errorType: 'sidecar-error',
        shortMessage: 'AI Processing Error',
        message: lines[0] || errorStr,
        suggestions: suggestions.length > 0 ? suggestions : undefined,
        technicalDetails: technicalDetails || undefined,
      };
    } else if (/^\[HTTP \d{3}\]/.test(errorStr.trim())) {
      parsedError = formatChatApiErrorForStructured(errorStr);
    } else {
      parsedError = {
        errorType: 'api-error',
        shortMessage: 'Error',
        message: errorStr,
      };
    }

    const messageToDisplay =
      customErrorMessage || parsedError.message || parsedError.shortMessage || errorStr;
    const errorMessage = createErrorMessage(messageToDisplay, parsedError);
    setMessages(prev => [...prev, errorMessage]);

    const errorTextForState =
      customErrorMessage
      || (error instanceof Error
        ? (parsedError.message || parsedError.shortMessage || error.message)
        : 'Failed to get response');
    setAiError(errorTextForState);
  }
}