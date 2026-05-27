import { useState, useCallback, useRef, useEffect } from 'react';
import type { ChatMessage, MessageFile } from '../../types';
import { createSendMessageCallback } from './createSendMessageCallback';
import { createClearMessagesCallback } from './createClearMessagesCallback';
import { createRemoveMessageCallback } from './createRemoveMessageCallback';
import { createRetryUserMessageCallback } from './createRetryUserMessageCallback';
import { createRetryErrorMessageCallback } from './createRetryErrorMessageCallback';
import type { SendMessageRequest } from './createSendMessageCallback';

// Re-export for backward compatibility
export type { SendMessageRequest } from './createSendMessageCallback';

interface UseAiChatProps {
  apiKey: string | null;
  provider: string | null;
  selectedModel?: string;
  temperature: number;
  sessionId?: string;
  pdfPath?: string | null;
  fetchFileContent?: (fileId: string, includeContent: boolean) => Promise<{ content?: string }>;
  contextFiles?: MessageFile[];
}

export interface AiChatMessageOperations {
  state: {
    messages: ChatMessage[];
    isLoading: boolean;
    aiError: string | null
  };
  sendMessage: (request: SendMessageRequest) => Promise<void>;
  cancelRequest: () => void;
  clearMessages: () => void;
  removeMessage: (messageId: string) => void;
  retryUserMessage: (message: ChatMessage) => void;
  retryErrorMessage: (message: ChatMessage) => void;
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
}

export function useAiChatMessages({
  apiKey,
  provider,
  selectedModel,
  temperature,
  fetchFileContent,
  contextFiles,
}: UseAiChatProps): AiChatMessageOperations {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  // Tracks the latest in-flight request. Any older requests' results will be ignored.
  const activeRequestIdRef = useRef<number>(0);
  // Stores the current backend request ID for cancellation
  const currentRequestIdRef = useRef<string | null>(null);
  const isMountedRef = useRef(true);

  // Track mount explicitly — ref must be true on every mount (Strict Mode / HMR can leave
  // a false value if we only ever set false in cleanup without resetting on mount).
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // If the last message is from assistant, loading must be false (sync in case async path missed it)
  useEffect(() => {
    if (messages.length === 0) return;
    const last = messages[messages.length - 1];
    if (last?.type === 'assistant' && isLoading) {
      setIsLoading(false);
    }
  }, [messages, isLoading]);

  // Wrap setMessages to add logging
  const setMessagesWithLogging = useCallback<React.Dispatch<React.SetStateAction<ChatMessage[]>>>((action) => {
    setMessages((prev) => {
      const next = typeof action === 'function' ? action(prev) : action;
      return next;
    });
  }, []);

  const sendMessage = useCallback(
    createSendMessageCallback({
      apiKey,
      provider,
      selectedModel: selectedModel || null,
      temperature,
      fetchFileContent,
      contextFiles,
      messages,
      setMessages: setMessagesWithLogging,
      setIsLoading,
      setAiError,
      abortControllerRef,
      activeRequestIdRef,
      currentRequestIdRef,
      getIsMounted: () => isMountedRef.current,
    }),
    [apiKey, provider, selectedModel, temperature, fetchFileContent, contextFiles, messages, setMessagesWithLogging]
  );

  const cancelRequest = useCallback(() => {
    const requestId = currentRequestIdRef.current;
    if (!requestId) {
      console.warn('[cancelRequest] No active request to cancel');
      return;
    }

    console.log(`[cancelRequest] 🛑 Cancelling request: ${requestId}`);

    // Increment to ignore any pending responses
    activeRequestIdRef.current++;

    // Abort frontend promise
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;

    // Call Rust backend to kill sidecar process
    import('@tauri-apps/api/core').then(({ invoke }) => {
      invoke('cancel_ai_request', { requestId }).catch(err =>
        console.error('[cancelRequest] Failed to cancel backend request:', err)
      );
    });

    // Reset UI state
    setIsLoading(false);
    currentRequestIdRef.current = null;
  }, []);

  const clearMessages = useCallback(
    createClearMessagesCallback({
      activeRequestIdRef,
      abortControllerRef,
      setIsLoading,
      setMessages: setMessagesWithLogging,
      setAiError
    }),
    [setMessagesWithLogging]
  );

  const removeMessage = useCallback(
    createRemoveMessageCallback({
      setMessages: setMessagesWithLogging
    }),
    [setMessagesWithLogging]
  );

  const retryUserMessage = useCallback(
    createRetryUserMessageCallback({
      messages,
      setMessages: setMessagesWithLogging,
      sendMessage
    }),
    [messages, sendMessage, setMessagesWithLogging]
  );

  const retryErrorMessage = useCallback(
    createRetryErrorMessageCallback({
      messages,
      setMessages: setMessagesWithLogging,
      sendMessage
    }),
    [messages, sendMessage, setMessagesWithLogging]
  );

  return {
    state: { messages, isLoading, aiError },
    sendMessage,
    cancelRequest,
    clearMessages,
    removeMessage,
    retryUserMessage,
    retryErrorMessage,
    setMessages: setMessagesWithLogging
  };
}