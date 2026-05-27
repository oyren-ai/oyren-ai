import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import MessageItem from '../MessageItem';
import type { ChatMessage } from '../../types';
import React from 'react';

// Mock MessageContent
vi.mock('../MessageContent', () => ({
  default: ({ content }: { content: string }) => <div data-testid="message-content">{content}</div>,
}));

// Mock ArxivPapersList
vi.mock('../ArxivPapersList', () => ({
  default: ({ papers }: { papers: unknown[] }) => (
    <div data-testid="arxiv-papers-list">{papers.length} papers</div>
  ),
}));

// Mock lucide-react icons
vi.mock('lucide-react', async () => {
  const actual = await vi.importActual('lucide-react');
  return {
    ...actual,
    ChevronDown: () => React.createElement('svg', { 'data-testid': 'icon-chevron-down' }),
    ChevronUp: () => React.createElement('svg', { 'data-testid': 'icon-chevron-up' }),
    RefreshCw: () => React.createElement('svg', { 'data-testid': 'icon-refresh-cw' }),
    AlertCircle: () => React.createElement('svg', { 'data-testid': 'icon-alert-circle' }),
    Lightbulb: () => React.createElement('svg', { 'data-testid': 'icon-lightbulb' }),
    ExternalLink: () => React.createElement('svg', { 'data-testid': 'icon-external-link' }),
    Download: () => React.createElement('svg', { 'data-testid': 'icon-download' }),
    BookOpen: () => React.createElement('svg', { 'data-testid': 'icon-book-open' }),
  };
});

describe('MessageItem', () => {
  const mockProps = {
    message: {
      id: '1',
      type: 'user' as const,
      content: 'Test message',
      timestamp: new Date(),
    },
    isReasoningExpanded: false,
    onToggleReasoning: vi.fn(),
    onRetryUser: vi.fn(),
    onRetryError: vi.fn(),
    onImagePreview: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('User Messages', () => {
    it('should render user message with right alignment', () => {
      render(<MessageItem {...mockProps} />);
      
      // User messages display content directly (not via MessageContent component)
      expect(screen.getByText('Test message')).toBeInTheDocument();
    });

    it('should apply rounded-2xl styling to user messages', () => {
      const { container } = render(<MessageItem {...mockProps} />);
      
      const messageBubble = container.querySelector('.rounded-2xl');
      expect(messageBubble).toBeInTheDocument();
    });

    it('should show user message with background color', () => {
      const { container } = render(<MessageItem {...mockProps} />);
      
      // User messages have bg-neutral-200 dark:bg-neutral-700
      const messageBubble = container.querySelector('.bg-neutral-200');
      expect(messageBubble).toBeInTheDocument();
    });

    it('should not render retry button for user messages', () => {
      render(<MessageItem {...mockProps} />);
      
      // New design: no retry button for user messages
      expect(screen.queryByTestId('retry-user-button')).not.toBeInTheDocument();
    });

    it('should show token count for user messages if provided', () => {
      const messageWithTokens: ChatMessage = {
        ...mockProps.message,
        tokenCount: 25,
      };

      render(<MessageItem {...mockProps} message={messageWithTokens} />);
      
      expect(screen.getByText('25 tokens')).toBeInTheDocument();
    });

    it('should not render source text for user messages', () => {
      const messageWithSource: ChatMessage = {
        ...mockProps.message,
        sourceText: 'Source from PDF',
      };

      render(<MessageItem {...mockProps} message={messageWithSource} />);
      
      // Source text is only shown for assistant messages in new design
      expect(screen.queryByText(/Selected text:/)).not.toBeInTheDocument();
    });

    it('should not render images for user messages', () => {
      const messageWithImages: ChatMessage = {
        ...mockProps.message,
        images: [
          { data: 'data:image/png;base64,test', width: 100, height: 100 },
          { data: 'data:image/png;base64,test2', width: 200, height: 200 },
        ],
      };

      render(<MessageItem {...mockProps} message={messageWithImages} />);
      
      // User messages now show images (AI Snippet feature)
      const images = screen.queryAllByRole('img');
      expect(images).toHaveLength(2);
    });
  });

  describe('Assistant Messages', () => {
    const assistantMessage: ChatMessage = {
      id: '2',
      type: 'assistant',
      content: 'AI response',
      timestamp: new Date(),
    };

    it('should render assistant message with left alignment', () => {
      render(<MessageItem {...mockProps} message={assistantMessage} />);
      
      expect(screen.getByTestId('message-content')).toHaveTextContent('AI response');
    });

    it('should render assistant message without background', () => {
      const { container } = render(<MessageItem {...mockProps} message={assistantMessage} />);
      
      // AI messages don't have background color
      const messageBubble = container.querySelector('.rounded-2xl');
      expect(messageBubble).toBeInTheDocument();
    });

    it('should show token count if provided', () => {
      const messageWithTokens: ChatMessage = {
        ...assistantMessage,
        tokenCount: 150,
      };

      render(<MessageItem {...mockProps} message={messageWithTokens} />);
      
      expect(screen.getByText('150 tokens')).toBeInTheDocument();
    });

    it('should render reasoning toggle button if reasoning exists', () => {
      const messageWithReasoning: ChatMessage = {
        ...assistantMessage,
        reasoning: 'This is the AI reasoning',
      };

      render(<MessageItem {...mockProps} message={messageWithReasoning} />);
      
      expect(screen.getByText('Show reasoning')).toBeInTheDocument();
    });

    it('should call onToggleReasoning when toggle button clicked', () => {
      const messageWithReasoning: ChatMessage = {
        ...assistantMessage,
        reasoning: 'This is the AI reasoning',
      };

      render(<MessageItem {...mockProps} message={messageWithReasoning} />);
      
      const toggleButton = screen.getByText('Show reasoning');
      fireEvent.click(toggleButton);
      
      expect(mockProps.onToggleReasoning).toHaveBeenCalled();
    });

    it('should show reasoning content when expanded', () => {
      const messageWithReasoning: ChatMessage = {
        ...assistantMessage,
        reasoning: 'This is the AI reasoning',
      };

      const mockPropsWithExpanded = {
        ...mockProps,
        message: messageWithReasoning,
        isReasoningExpanded: true,
      };

      render(<MessageItem {...mockPropsWithExpanded} />);
      
      expect(screen.getByText('This is the AI reasoning')).toBeInTheDocument();
    });

    it('should render source text for assistant messages', () => {
      const messageWithSource: ChatMessage = {
        ...assistantMessage,
        sourceText: 'Source from PDF',
      };

      render(<MessageItem {...mockProps} message={messageWithSource} />);
      
      expect(screen.getByText(/Selected text:/)).toBeInTheDocument();
      expect(screen.getByText('"Source from PDF"')).toBeInTheDocument();
    });

    it('should render images for assistant messages', () => {
      const messageWithImages: ChatMessage = {
        ...assistantMessage,
        images: [
          { data: 'data:image/png;base64,test', width: 100, height: 100 },
          { data: 'data:image/png;base64,test2', width: 200, height: 200 },
        ],
      };

      render(<MessageItem {...mockProps} message={messageWithImages} />);
      
      const images = screen.getAllByRole('img');
      expect(images).toHaveLength(2);
    });

    it('should call onImagePreview when image is clicked', () => {
      const messageWithImages: ChatMessage = {
        ...assistantMessage,
        images: [
          { data: 'data:image/png;base64,test', width: 100, height: 100 },
        ],
      };

      render(<MessageItem {...mockProps} message={messageWithImages} />);

      const image = screen.getByRole('img');
      fireEvent.click(image);

      expect(mockProps.onImagePreview).toHaveBeenCalled();
    });

    it('should render ArxivPapersList when arxiv_papers present', () => {
      const messageWithPapers: ChatMessage = {
        ...assistantMessage,
        arxiv_papers: [{
          id: '2401.00001', title: 'Test Paper', authors: ['Author'],
          summary: 'Summary', arxiv_url: 'https://arxiv.org/abs/2401.00001',
          pdf_url: 'https://arxiv.org/pdf/2401.00001', published: '2024-01-01',
        }],
      };

      render(<MessageItem {...mockProps} message={messageWithPapers} />);
      expect(screen.getByTestId('arxiv-papers-list')).toBeInTheDocument();
      expect(screen.getByText('1 papers')).toBeInTheDocument();
    });
  });

  describe('Error Messages', () => {
    const errorMessage: ChatMessage = {
      id: '3',
      type: 'assistant',
      content: 'Error occurred',
      timestamp: new Date(),
      isError: true,
    };

    it('should render error message with red border', () => {
      const { container } = render(<MessageItem {...mockProps} message={errorMessage} />);
      
      const errorBanner = container.querySelector('.border-red-500');
      expect(errorBanner).toBeInTheDocument();
    });

    it('should show retry button', () => {
      render(<MessageItem {...mockProps} message={errorMessage} />);

      expect(screen.getByTestId('retry-button')).toBeInTheDocument();
    });

    it('should call onRetryError when retry button clicked', () => {
      render(<MessageItem {...mockProps} message={errorMessage} />);

      const retryButton = screen.getByTestId('retry-button');
      fireEvent.click(retryButton);

      expect(mockProps.onRetryError).toHaveBeenCalled();
    });

    describe('Structured Errors', () => {
      it('should display structured error with shortMessage as title', () => {
        const structuredErrorMessage: ChatMessage = {
          id: '4',
          type: 'assistant',
          content: 'The deepseek-chat model doesn\'t support image analysis.',
          timestamp: new Date(),
          isError: true,
          structuredError: {
            errorType: 'feature-not-supported',
            shortMessage: 'DeepSeek doesn\'t support images',
            message: 'The deepseek-chat model doesn\'t support image analysis.',
            suggestion: 'Try vision-capable models like Gemini 2.0 Flash.'
          }
        };

        render(<MessageItem {...mockProps} message={structuredErrorMessage} />);

        expect(screen.getByText('DeepSeek doesn\'t support images')).toBeInTheDocument();
        expect(screen.getByText('The deepseek-chat model doesn\'t support image analysis.')).toBeInTheDocument();
      });

      it('should display suggestion when provided', () => {
        const structuredErrorMessage: ChatMessage = {
          id: '5',
          type: 'assistant',
          content: 'Error message',
          timestamp: new Date(),
          isError: true,
          structuredError: {
            errorType: 'api-error',
            shortMessage: 'Invalid API key',
            message: 'The provided API key is invalid.',
            suggestion: 'Check your API key in Settings.'
          }
        };

        render(<MessageItem {...mockProps} message={structuredErrorMessage} />);

        expect(screen.getByText(/Suggestion:/)).toBeInTheDocument();
        expect(screen.getByText('Check your API key in Settings.')).toBeInTheDocument();
      });

      it('should not display suggestion when not provided', () => {
        const structuredErrorMessage: ChatMessage = {
          id: '6',
          type: 'assistant',
          content: 'Error message',
          timestamp: new Date(),
          isError: true,
          structuredError: {
            errorType: 'unknown-error',
            shortMessage: 'Error occurred',
            message: 'An error occurred.',
            suggestion: undefined
          }
        };

        render(<MessageItem {...mockProps} message={structuredErrorMessage} />);

        expect(screen.queryByText(/Suggestion:/)).not.toBeInTheDocument();
      });

      it('should use orange styling for feature-not-supported errors', () => {
        const structuredErrorMessage: ChatMessage = {
          id: '7',
          type: 'assistant',
          content: 'Error',
          timestamp: new Date(),
          isError: true,
          structuredError: {
            errorType: 'feature-not-supported',
            shortMessage: 'Feature not supported',
            message: 'This feature is not supported.',
            suggestion: 'Use a different model.'
          }
        };

        const { container } = render(<MessageItem {...mockProps} message={structuredErrorMessage} />);
        
        const errorBox = container.querySelector('.border-orange-500');
        expect(errorBox).toBeInTheDocument();
      });

      it('should use red styling for api-error errors', () => {
        const structuredErrorMessage: ChatMessage = {
          id: '8',
          type: 'assistant',
          content: 'Error',
          timestamp: new Date(),
          isError: true,
          structuredError: {
            errorType: 'api-error',
            shortMessage: 'API error',
            message: 'API request failed.',
            suggestion: 'Try again later.'
          }
        };

        const { container } = render(<MessageItem {...mockProps} message={structuredErrorMessage} />);
        
        const errorBox = container.querySelector('.border-red-500');
        expect(errorBox).toBeInTheDocument();
      });

      it('should display error icon (AlertCircle)', () => {
        const structuredErrorMessage: ChatMessage = {
          id: '9',
          type: 'assistant',
          content: 'Error',
          timestamp: new Date(),
          isError: true,
          structuredError: {
            errorType: 'unknown-error',
            shortMessage: 'Error',
            message: 'An error occurred.'
          }
        };

        render(<MessageItem {...mockProps} message={structuredErrorMessage} />);
        
        // AlertCircle icon should be present
        expect(screen.getByTestId('icon-alert-circle')).toBeInTheDocument();
      });

      it('should display lightbulb icon for suggestions', () => {
        const structuredErrorMessage: ChatMessage = {
          id: '10',
          type: 'assistant',
          content: 'Error',
          timestamp: new Date(),
          isError: true,
          structuredError: {
            errorType: 'api-error',
            shortMessage: 'Error',
            message: 'An error occurred.',
            suggestion: 'Try again.'
          }
        };

        render(<MessageItem {...mockProps} message={structuredErrorMessage} />);
        
        // Should have both AlertCircle and Lightbulb icons
        expect(screen.getByTestId('icon-alert-circle')).toBeInTheDocument();
        expect(screen.getByTestId('icon-lightbulb')).toBeInTheDocument();
      });
    });
  });

  describe('Styling', () => {
    it('should use max-w-4xl for message width', () => {
      const { container } = render(<MessageItem {...mockProps} />);
      
      const messageContainer = container.querySelector('.max-w-4xl');
      expect(messageContainer).toBeInTheDocument();
    });

    it('should use px-4 py-3 spacing', () => {
      const { container } = render(<MessageItem {...mockProps} />);
      
      const messageContainer = container.querySelector('.px-4.py-3');
      expect(messageContainer).toBeInTheDocument();
    });
  });
});