import type { ChatMessage } from '../../types';

export interface ClearMessagesDependencies {
  // Refs
  activeRequestIdRef: React.MutableRefObject<number>;
  abortControllerRef: React.MutableRefObject<AbortController | null>;

  // State setters
  setIsLoading: (loading: boolean) => void;
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  setAiError: (error: string | null) => void;
}

export function createClearMessagesCallback(deps: ClearMessagesDependencies) {
  return () => {
    const {
      activeRequestIdRef,
      abortControllerRef,
      setIsLoading,
      setMessages,
      setAiError
    } = deps;

    // Invalidate any in-flight request so its late result is ignored
    activeRequestIdRef.current += 1;

    // Abort any ongoing request
    if (abortControllerRef.current) {
      try {
        abortControllerRef.current.abort();
      } catch (e) {
        // Ignore
      }
      abortControllerRef.current = null;
    }

    setIsLoading(false);
    setMessages([]);
    setAiError(null);
  };
}
