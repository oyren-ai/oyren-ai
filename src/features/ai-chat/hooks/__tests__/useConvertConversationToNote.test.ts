import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useConvertConversationToNote } from '../useConvertConversationToNote';
import { workspaceFilesApi } from '@/api/workspaceFilesApi';
import type { ChatMessage } from '../../types';

vi.mock('@/api/workspaceFilesApi', () => ({
  workspaceFilesApi: {
    createMdxNote: vi.fn(),
    updateFile: vi.fn(),
  },
}));

describe('useConvertConversationToNote', () => {
  const mockMessages: ChatMessage[] = [
    {
      id: '1',
      type: 'user',
      content: 'Test question',
      timestamp: new Date(),
    },
    {
      id: '2',
      type: 'assistant',
      content: 'Test answer',
      timestamp: new Date(),
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with correct default state', () => {
    const { result } = renderHook(() => useConvertConversationToNote());

    expect(result.current.isConverting).toBe(false);
    expect(result.current.error).toBeNull();
    expect(typeof result.current.convertToNote).toBe('function');
  });

  it('should successfully convert conversation to note', async () => {
    const mockFile = {
      id: 'file1',
      file_name: 'Test-question.md',
      file_path: '/path/to/file',
      workspace_id: 'workspace1',
      added_at: new Date().toISOString(),
      last_accessed_at: new Date().toISOString(),
      is_visible: true,
      is_read_only: false,
    };

    vi.mocked(workspaceFilesApi.createMdxNote).mockResolvedValue(mockFile);
    vi.mocked(workspaceFilesApi.updateFile).mockResolvedValue(undefined);

    const { result } = renderHook(() => useConvertConversationToNote());

    const file = await result.current.convertToNote({
      messages: mockMessages,
      workspaceId: 'workspace1',
      provider: 'gemini',
      model: 'gemini-2.5-flash',
      totalTokens: 1000,
      inputTokens: 400,
      outputTokens: 600,
    });

    expect(file).toEqual(mockFile);
    expect(workspaceFilesApi.createMdxNote).toHaveBeenCalledWith('workspace1', 'Test-question');
    expect(workspaceFilesApi.updateFile).toHaveBeenCalledWith(
      'file1',
      expect.stringContaining('# Test question')
    );
  });

  it('should return error when workspace ID is missing', async () => {
    const { result } = renderHook(() => useConvertConversationToNote());

    const file = await result.current.convertToNote({
      messages: mockMessages,
      workspaceId: '',
      model: 'gemini-2.5-flash',
    });

    await waitFor(() => {
      expect(file).toBeNull();
      expect(result.current.error).toBe('No workspace selected');
    });
    expect(workspaceFilesApi.createMdxNote).not.toHaveBeenCalled();
  });

  it('should return error when messages array is empty', async () => {
    const { result } = renderHook(() => useConvertConversationToNote());

    const file = await result.current.convertToNote({
      messages: [],
      workspaceId: 'workspace1',
      model: 'gemini-2.5-flash',
    });

    await waitFor(() => {
      expect(file).toBeNull();
      expect(result.current.error).toBe('No messages to convert');
    });
    expect(workspaceFilesApi.createMdxNote).not.toHaveBeenCalled();
  });

  it('should handle errors during file creation', async () => {
    const errorMessage = 'Failed to create file';
    vi.mocked(workspaceFilesApi.createMdxNote).mockRejectedValue(new Error(errorMessage));

    const { result } = renderHook(() => useConvertConversationToNote());

    const file = await result.current.convertToNote({
      messages: mockMessages,
      workspaceId: 'workspace1',
      model: 'gemini-2.5-flash',
    });

    await waitFor(() => {
      expect(result.current.isConverting).toBe(false);
    });

    expect(file).toBeNull();
    expect(result.current.error).toBe(errorMessage);
    expect(workspaceFilesApi.updateFile).not.toHaveBeenCalled();
  });

  it('should handle errors during file update', async () => {
    const mockFile = {
      id: 'file1',
      file_name: 'Test-question.md',
      file_path: '/path/to/file',
      workspace_id: 'workspace1',
      added_at: new Date().toISOString(),
      last_accessed_at: new Date().toISOString(),
      is_visible: true,
      is_read_only: false,
    };

    vi.mocked(workspaceFilesApi.createMdxNote).mockResolvedValue(mockFile);
    vi.mocked(workspaceFilesApi.updateFile).mockRejectedValue(new Error('Update failed'));

    const { result } = renderHook(() => useConvertConversationToNote());

    const file = await result.current.convertToNote({
      messages: mockMessages,
      workspaceId: 'workspace1',
      model: 'gemini-2.5-flash',
    });

    await waitFor(() => {
      expect(result.current.isConverting).toBe(false);
    });

    expect(file).toBeNull();
    expect(result.current.error).toBe('Update failed');
  });

  it('should dispatch workspace-file-created event on success', async () => {
    const mockFile = {
      id: 'file1',
      file_name: 'Test.md',
      file_path: '/path/to/file',
      workspace_id: 'workspace1',
      added_at: new Date().toISOString(),
      last_accessed_at: new Date().toISOString(),
      is_visible: true,
      is_read_only: false,
    };

    vi.mocked(workspaceFilesApi.createMdxNote).mockResolvedValue(mockFile);
    vi.mocked(workspaceFilesApi.updateFile).mockResolvedValue(undefined);

    const eventListener = vi.fn();
    window.addEventListener('workspace-file-created', eventListener);

    const { result } = renderHook(() => useConvertConversationToNote());

    await result.current.convertToNote({
      messages: mockMessages,
      workspaceId: 'workspace1',
      model: 'gemini-2.5-flash',
    });

    await waitFor(() => {
      expect(eventListener).toHaveBeenCalled();
    });

    const event = eventListener.mock.calls[0][0] as CustomEvent;
    expect(event.detail.file).toEqual(mockFile);

    window.removeEventListener('workspace-file-created', eventListener);
  });

  it('should sanitize filename with special characters', async () => {
    const messagesWithSpecialChars: ChatMessage[] = [
      {
        id: '1',
        type: 'user',
        content: 'What is C++/C#? How to use it?',
        timestamp: new Date(),
      },
    ];

    const mockFile = {
      id: 'file1',
      file_name: 'What-is-CC-How-to-use-it.md',
      file_path: '/path/to/file',
      workspace_id: 'workspace1',
      added_at: new Date().toISOString(),
      last_accessed_at: new Date().toISOString(),
      is_visible: true,
      is_read_only: false,
    };

    vi.mocked(workspaceFilesApi.createMdxNote).mockResolvedValue(mockFile);
    vi.mocked(workspaceFilesApi.updateFile).mockResolvedValue(undefined);

    const { result } = renderHook(() => useConvertConversationToNote());

    await result.current.convertToNote({
      messages: messagesWithSpecialChars,
      workspaceId: 'workspace1',
      model: 'gemini-2.5-flash',
    });

    await waitFor(() => {
      expect(workspaceFilesApi.createMdxNote).toHaveBeenCalledWith(
        'workspace1',
        expect.stringMatching(/^What-is/)
      );
    });
  });

  it('should use custom title when provided', async () => {
    const mockFile = {
      id: 'file1',
      file_name: 'Custom-Title.md',
      file_path: '/path/to/file',
      workspace_id: 'workspace1',
      added_at: new Date().toISOString(),
      last_accessed_at: new Date().toISOString(),
      is_visible: true,
      is_read_only: false,
    };

    vi.mocked(workspaceFilesApi.createMdxNote).mockResolvedValue(mockFile);
    vi.mocked(workspaceFilesApi.updateFile).mockResolvedValue(undefined);

    const { result } = renderHook(() => useConvertConversationToNote());

    await result.current.convertToNote({
      messages: mockMessages,
      workspaceId: 'workspace1',
      model: 'gemini-2.5-flash',
      title: 'Custom Title',
    });

    await waitFor(() => {
      expect(workspaceFilesApi.createMdxNote).toHaveBeenCalledWith('workspace1', 'Custom-Title');
    });
  });

  it('should handle very long message content in filename', async () => {
    const longMessage = 'a'.repeat(100);
    const messagesWithLongContent: ChatMessage[] = [
      {
        id: '1',
        type: 'user',
        content: longMessage,
        timestamp: new Date(),
      },
    ];

    const mockFile = {
      id: 'file1',
      file_name: 'note.md',
      file_path: '/path/to/file',
      workspace_id: 'workspace1',
      added_at: new Date().toISOString(),
      last_accessed_at: new Date().toISOString(),
      is_visible: true,
      is_read_only: false,
    };

    vi.mocked(workspaceFilesApi.createMdxNote).mockResolvedValue(mockFile);
    vi.mocked(workspaceFilesApi.updateFile).mockResolvedValue(undefined);

    const { result } = renderHook(() => useConvertConversationToNote());

    await result.current.convertToNote({
      messages: messagesWithLongContent,
      workspaceId: 'workspace1',
      model: 'gemini-2.5-flash',
    });

    await waitFor(() => {
      expect(workspaceFilesApi.createMdxNote).toHaveBeenCalledWith(
        'workspace1',
        expect.stringMatching(/^a{30}$/)
      );
    });
  });
});