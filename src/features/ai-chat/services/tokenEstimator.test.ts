import { describe, it, expect } from 'vitest';
import { estimateTokens, calculateTotalTokens, formatTokenCount } from './tokenEstimator';
import type { ChatMessage } from '../types';

describe('tokenEstimator', () => {
  describe('estimateTokens', () => {
    it('should estimate tokens for empty string', () => {
      expect(estimateTokens('')).toBe(0);
    });

    it('should estimate tokens for simple text', () => {
      // Roughly 4 characters per token
      expect(estimateTokens('Hello World')).toBe(3); // 11 chars / 4 = 2.75 -> 3
    });

    it('should estimate tokens for longer text', () => {
      const text = 'This is a longer piece of text that should have more tokens';
      expect(estimateTokens(text)).toBe(15); // 60 chars / 4 = 15
    });

    it('should handle special characters and emojis', () => {
      const text = 'Hello 👋 World! 🌍';
      // Special chars and emojis should be counted appropriately
      expect(estimateTokens(text)).toBeGreaterThan(0);
    });
  });

  describe('calculateTotalTokens', () => {
    it('should return 0 for empty message array', () => {
      expect(calculateTotalTokens([])).toBe(0);
    });

    it('should sum tokens from all messages', () => {
      const messages: ChatMessage[] = [
        {
          id: '1',
          type: 'user',
          content: 'Test message',
          timestamp: new Date(),
          tokenCount: 5
        },
        {
          id: '2',
          type: 'assistant',
          content: 'Response message',
          timestamp: new Date(),
          tokenCount: 10
        }
      ];
      expect(calculateTotalTokens(messages)).toBe(15);
    });

    it('should handle messages without token count', () => {
      const messages: ChatMessage[] = [
        {
          id: '1',
          type: 'user',
          content: 'Test message',
          timestamp: new Date(),
          tokenCount: 5
        },
        {
          id: '2',
          type: 'assistant',
          content: 'Response',
          timestamp: new Date()
          // No tokenCount
        }
      ];
      expect(calculateTotalTokens(messages)).toBe(5);
    });
  });

  describe('formatTokenCount', () => {
    it('should format small numbers without commas', () => {
      expect(formatTokenCount(500)).toBe('500');
    });

    it('should format large numbers with commas', () => {
      expect(formatTokenCount(1500)).toBe('1,500');
      expect(formatTokenCount(1000000)).toBe('1,000,000');
    });

    it('should handle zero', () => {
      expect(formatTokenCount(0)).toBe('0');
    });
  });
});