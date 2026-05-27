import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createClearMessagesCallback } from './createClearMessagesCallback';

describe('createClearMessagesCallback', () => {
  const mockSetIsLoading = vi.fn();
  const mockSetMessages = vi.fn();
  const mockSetAiError = vi.fn();
  const mockAbortController = {
    abort: vi.fn(),
  };

  const defaultDeps = {
    activeRequestIdRef: { current: 0 },
    abortControllerRef: { current: null as AbortController | null },
    setIsLoading: mockSetIsLoading,
    setMessages: mockSetMessages,
    setAiError: mockSetAiError,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should clear messages and reset state', () => {
    const callback = createClearMessagesCallback(defaultDeps);

    callback();

    expect(mockSetMessages).toHaveBeenCalledWith([]);
    expect(mockSetIsLoading).toHaveBeenCalledWith(false);
    expect(mockSetAiError).toHaveBeenCalledWith(null);
  });

  it('should increment activeRequestIdRef', () => {
    const activeRequestIdRef = { current: 5 };
    const callback = createClearMessagesCallback({
      ...defaultDeps,
      activeRequestIdRef,
    });

    callback();

    expect(activeRequestIdRef.current).toBe(6);
  });

  it('should abort ongoing request if abortController exists', () => {
    const abortControllerRef = {
      current: mockAbortController as unknown as AbortController,
    };
    const callback = createClearMessagesCallback({
      ...defaultDeps,
      abortControllerRef,
    });

    callback();

    expect(mockAbortController.abort).toHaveBeenCalled();
    expect(abortControllerRef.current).toBeNull();
  });

  it('should handle abort error gracefully', () => {
    const abortControllerRef = {
      current: {
        abort: vi.fn(() => {
          throw new Error('Abort failed');
        }),
      } as unknown as AbortController,
    };
    const callback = createClearMessagesCallback({
      ...defaultDeps,
      abortControllerRef,
    });

    // Should not throw
    expect(() => callback()).not.toThrow();
    expect(abortControllerRef.current).toBeNull();
  });

  it('should work when no abortController exists', () => {
    const callback = createClearMessagesCallback(defaultDeps);

    callback();

    expect(mockSetMessages).toHaveBeenCalledWith([]);
    expect(mockSetIsLoading).toHaveBeenCalledWith(false);
  });
});

