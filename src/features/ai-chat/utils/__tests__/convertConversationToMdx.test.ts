import { describe, it, expect } from 'vitest';
import { convertConversationToMdx } from '../convertConversationToMdx';
import type { ChatMessage } from '../../types';

describe('convertConversationToMdx', () => {
  it('should convert simple user-assistant conversation to MDX', () => {
    const messages: ChatMessage[] = [
      {
        id: '1',
        type: 'user',
        content: 'Hello, how are you?',
        timestamp: new Date('2024-01-19T12:00:00Z'),
      },
      {
        id: '2',
        type: 'assistant',
        content: 'I am doing well, thank you!',
        timestamp: new Date('2024-01-19T12:00:01Z'),
      },
    ];

    const result = convertConversationToMdx(messages);

    expect(result).toContain('# Hello, how are you?');
    expect(result).toContain('*Created:');
    expect(result).toContain('## 💬 User');
    expect(result).toContain('## 🤖 Assistant');
    expect(result).toContain('Hello, how are you?');
    expect(result).toContain('I am doing well, thank you!');
  });

  it('should use provided title instead of generating from first message', () => {
    const messages: ChatMessage[] = [
      {
        id: '1',
        type: 'user',
        content: 'Hello',
        timestamp: new Date(),
      },
    ];

    const result = convertConversationToMdx(messages, { title: 'Custom Title' });

    expect(result).toContain('# Custom Title');
    expect(result).not.toContain('# Hello');
  });

  it('should include model information when provided', () => {
    const messages: ChatMessage[] = [
      {
        id: '1',
        type: 'user',
        content: 'Test message',
        timestamp: new Date(),
      },
    ];

    const result = convertConversationToMdx(messages, {
      provider: 'gemini',
      model: 'gemini-2.5-flash',
    });

    expect(result).toContain('*Model: gemini/gemini-2.5-flash*');
  });

  it('should include token information', () => {
    const messages: ChatMessage[] = [
      {
        id: '1',
        type: 'user',
        content: 'Test',
        timestamp: new Date(),
      },
    ];

    const result = convertConversationToMdx(messages, {
      totalTokens: 1000,
      inputTokens: 400,
      outputTokens: 600,
    });

    expect(result).toContain('*Tokens: 400 in / 600 out (1000 total)*');
  });

  it('should handle images in messages', () => {
    const messages: ChatMessage[] = [
      {
        id: '1',
        type: 'user',
        content: 'Look at this image',
        timestamp: new Date(),
        images: [
          {
            data: 'base64encodeddata',
            width: 100,
            height: 100,
          },
        ],
      },
    ];

    const result = convertConversationToMdx(messages);

    expect(result).toContain('![Attached Image 1](data:image/png;base64,base64encodeddata)');
  });

  it('should handle file attachments', () => {
    const messages: ChatMessage[] = [
      {
        id: '1',
        type: 'user',
        content: 'Here are some files',
        timestamp: new Date(),
        files: [
          { id: 'f1', name: 'document.pdf', path: '/path/to/doc.pdf' },
          { id: 'f2', name: 'spreadsheet.xlsx', path: '/path/to/sheet.xlsx' },
        ],
      },
    ];

    const result = convertConversationToMdx(messages);

    expect(result).toContain('**Attached Files:**');
    expect(result).toContain('- document.pdf');
    expect(result).toContain('- spreadsheet.xlsx');
  });

  it('should skip error messages', () => {
    const messages: ChatMessage[] = [
      {
        id: '1',
        type: 'user',
        content: 'Hello',
        timestamp: new Date(),
      },
      {
        id: '2',
        type: 'assistant',
        content: 'Error occurred',
        timestamp: new Date(),
        isError: true,
      },
      {
        id: '3',
        type: 'assistant',
        content: 'Valid response',
        timestamp: new Date(),
      },
    ];

    const result = convertConversationToMdx(messages);

    expect(result).toContain('Hello');
    expect(result).toContain('Valid response');
    expect(result).not.toContain('Error occurred');
  });

  it('should truncate long first messages in generated title', () => {
    const longMessage = 'a'.repeat(100);
    const messages: ChatMessage[] = [
      {
        id: '1',
        type: 'user',
        content: longMessage,
        timestamp: new Date(),
      },
    ];

    const result = convertConversationToMdx(messages);

    expect(result).toContain('# ' + 'a'.repeat(50) + '...');
  });

  it('should use "Conversation" as fallback title when no user messages', () => {
    const messages: ChatMessage[] = [
      {
        id: '1',
        type: 'assistant',
        content: 'Hello',
        timestamp: new Date(),
      },
    ];

    const result = convertConversationToMdx(messages);

    expect(result).toContain('# Conversation');
  });

  it('should separate message pairs with horizontal rules', () => {
    const messages: ChatMessage[] = [
      {
        id: '1',
        type: 'user',
        content: 'First question',
        timestamp: new Date(),
      },
      {
        id: '2',
        type: 'assistant',
        content: 'First answer',
        timestamp: new Date(),
      },
      {
        id: '3',
        type: 'user',
        content: 'Second question',
        timestamp: new Date(),
      },
    ];

    const result = convertConversationToMdx(messages);

    // Should have --- separators between messages
    const separatorCount = (result.match(/\n---\n/g) || []).length;
    expect(separatorCount).toBeGreaterThan(0);
  });

  it('should handle empty messages array', () => {
    const messages: ChatMessage[] = [];

    const result = convertConversationToMdx(messages);

    expect(result).toContain('# Conversation');
    expect(result).toContain('*Created:');
  });

  it('should strip embedded arxiv block from assistant messages', () => {
    const arxivBlock = '\n<!-- arxiv-papers\n[{"id":"2401.00001","title":"Test","authors":["A"],"summary":"S","arxiv_url":"u","pdf_url":"p","published":"2024-01-01"}]\n-->';
    const messages: ChatMessage[] = [
      {
        id: '1',
        type: 'assistant',
        content: 'Here are some papers' + arxivBlock,
        timestamp: new Date(),
      },
    ];

    const result = convertConversationToMdx(messages);

    expect(result).toContain('Here are some papers');
    expect(result).not.toContain('<!-- arxiv-papers');
    expect(result).not.toContain('2401.00001');
  });
});