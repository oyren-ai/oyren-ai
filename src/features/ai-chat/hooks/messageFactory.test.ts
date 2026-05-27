import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createUserMessage, createAssistantMessage, createErrorMessage } from './messageFactory';
import { extractArxivPapers } from '../utils/arxivContentUtils';
import type { PendingImage } from '../types';
import type { ArxivPaperMeta } from '@/api/types/ai';

describe('messageFactory', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-01T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('createUserMessage', () => {
    it('should create user message with content and no images', () => {
      const content = 'Hello world';
      const images: PendingImage[] = [];

      const message = createUserMessage(content, images);

      expect(message).toMatchObject({
        type: 'user',
        content: 'Hello world',
        timestamp: new Date('2024-01-01T12:00:00Z'),
        images: undefined
      });
      expect(message.id).toBeDefined();
      expect(message.tokenCount).toBeGreaterThan(0);
    });

    it('should create user message with images', () => {
      const content = 'Check this image';
      const images: PendingImage[] = [
        { data: 'base64data1', width: 100, height: 100 },
        { data: 'base64data2', width: 200, height: 200 }
      ];

      const message = createUserMessage(content, images);

      expect(message.images).toEqual(images);
      expect(message.images).toHaveLength(2);
    });

    it('should generate unique IDs based on timestamp', () => {
      const message1 = createUserMessage('Message 1', []);

      vi.advanceTimersByTime(100);

      const message2 = createUserMessage('Message 2', []);

      expect(message1.id).not.toBe(message2.id);
    });

    it('should estimate token count for content', () => {
      const shortMessage = createUserMessage('Hi', []);
      const longMessage = createUserMessage('This is a much longer message with many more words', []);

      expect(shortMessage.tokenCount).toBeDefined();
      expect(longMessage.tokenCount).toBeDefined();
      expect(longMessage.tokenCount!).toBeGreaterThan(shortMessage.tokenCount!);
    });
  });

  describe('createAssistantMessage', () => {
    it('should create assistant message with content', () => {
      const content = 'AI response here';

      const message = createAssistantMessage(content);

      expect(message).toMatchObject({
        type: 'assistant',
        content: 'AI response here',
        timestamp: new Date('2024-01-01T12:00:00Z')
      });
      expect(message.id).toBeDefined();
      expect(message.tokenCount).toBeGreaterThan(0);
    });

    it('should generate ID offset from current time', () => {
      const userMessage = createUserMessage('User msg', []);
      const aiMessage = createAssistantMessage('AI msg');

      // AI message ID should be timestamp + 1
      expect(parseInt(aiMessage.id)).toBeGreaterThan(parseInt(userMessage.id));
    });

    it('should not have isError flag by default', () => {
      const message = createAssistantMessage('Normal response');

      expect(message.isError).toBeUndefined();
    });

    it('should embed arxiv papers in content when provided', () => {
      const papers: ArxivPaperMeta[] = [{
        id: '2401.00001', title: 'Test Paper', authors: ['Author'],
        summary: 'Summary', arxiv_url: 'https://arxiv.org/abs/2401.00001',
        pdf_url: 'https://arxiv.org/pdf/2401.00001', published: '2024-01-01',
      }];

      const message = createAssistantMessage('AI response', 10, 20, papers);

      expect(message.content).toContain('<!-- arxiv-papers');
      expect(message.arxiv_papers).toEqual(papers);
      const { displayContent, papers: extracted } = extractArxivPapers(message.content);
      expect(displayContent).toBe('AI response');
      expect(extracted).toHaveLength(1);
    });

    it('should not embed block when no papers', () => {
      const message = createAssistantMessage('AI response', 10, 20);

      expect(message.content).toBe('AI response');
      expect(message.content).not.toContain('<!-- arxiv-papers');
    });

    it('should use original content for token estimation', () => {
      const papers: ArxivPaperMeta[] = [{
        id: '2401.00001', title: 'Test', authors: ['A'],
        summary: 'S', arxiv_url: 'url', pdf_url: 'url', published: '2024-01-01',
      }];

      const withPapers = createAssistantMessage('Same content', 10, 20, papers);
      // Token count should be based on input/output tokens, not inflated by embedded JSON
      expect(withPapers.tokenCount).toBe(30);
    });
  });

  describe('createErrorMessage', () => {
    it('should create error message from Error object', () => {
      const error = new Error('Network timeout');

      const message = createErrorMessage(error);

      expect(message).toMatchObject({
        type: 'assistant',
        content: 'Network timeout',
        isError: true,
        timestamp: new Date('2024-01-01T12:00:00Z')
      });
      expect(message.id).toBeDefined();
      expect(message.structuredError).toBeUndefined();
    });

    it('should handle non-Error objects', () => {
      const error = 'String error';

      const message = createErrorMessage(error);

      expect(message.content).toBe('String error');
      expect(message.isError).toBe(true);
      expect(message.structuredError).toBeUndefined();
    });

    it('should handle null/undefined errors', () => {
      const message1 = createErrorMessage(null);
      const message2 = createErrorMessage(undefined);

      expect(message1.content).toBe('Failed to get response');
      expect(message2.content).toBe('Failed to get response');
      expect(message1.isError).toBe(true);
      expect(message2.isError).toBe(true);
    });

    it('should not have tokenCount for error messages', () => {
      const message = createErrorMessage(new Error('Test error'));

      expect(message.tokenCount).toBeUndefined();
    });

    describe('structured errors from sidecar', () => {
      it('should use structured error when provided', () => {
        const sidecarError = {
          errorType: 'feature-not-supported' as const,
          shortMessage: 'DeepSeek doesn\'t support images',
          message: 'The deepseek-chat model doesn\'t support image analysis.',
          suggestion: 'Try vision-capable models like Gemini 2.0 Flash.'
        };

        const message = createErrorMessage('Generic error', sidecarError);

        expect(message.content).toBe('The deepseek-chat model doesn\'t support image analysis.');
        expect(message.isError).toBe(true);
        expect(message.structuredError).toEqual(sidecarError);
      });

      it('should use shortMessage if message is not provided', () => {
        const sidecarError = {
          errorType: 'api-error' as const,
          shortMessage: 'Invalid API key',
          message: undefined,
          suggestion: 'Check your API key in Settings.'
        };

        const message = createErrorMessage('Generic error', sidecarError);

        expect(message.content).toBe('Invalid API key');
        expect(message.structuredError).toEqual(sidecarError);
      });

      it('should fallback to error text if structured error has no message or shortMessage', () => {
        const sidecarError = {
          errorType: 'unknown-error' as const,
          shortMessage: undefined,
          message: undefined,
          suggestion: 'Try again later.'
        };

        const message = createErrorMessage('Network error', sidecarError);

        expect(message.content).toBe('Network error');
        expect(message.structuredError).toEqual(sidecarError);
      });

      it('should handle feature-not-supported error type', () => {
        const sidecarError = {
          errorType: 'feature-not-supported' as const,
          shortMessage: 'Feature not available',
          message: 'This feature is not supported by the selected model.',
          suggestion: 'Use a different model.'
        };

        const message = createErrorMessage('Error', sidecarError);

        expect(message.structuredError?.errorType).toBe('feature-not-supported');
        expect(message.structuredError?.suggestion).toBe('Use a different model.');
      });

      it('should handle api-error error type', () => {
        const sidecarError = {
          errorType: 'api-error' as const,
          shortMessage: 'API key invalid',
          message: 'The provided API key is invalid.',
          suggestion: 'Check your API key in Settings.'
        };

        const message = createErrorMessage('Error', sidecarError);

        expect(message.structuredError?.errorType).toBe('api-error');
        expect(message.structuredError?.shortMessage).toBe('API key invalid');
      });

      it('should handle invalid-input error type', () => {
        const sidecarError = {
          errorType: 'invalid-input' as const,
          shortMessage: 'Invalid input',
          message: 'The provided input is invalid.',
          suggestion: 'Please check your input and try again.'
        };

        const message = createErrorMessage('Error', sidecarError);

        expect(message.structuredError?.errorType).toBe('invalid-input');
      });
    });
  });
});
