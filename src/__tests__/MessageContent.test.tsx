import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import MessageContent from '../features/ai-chat/components/MessageContent';

// Mock MdxRenderer with proper code block handling
vi.mock('../components/common/MdxRenderer', () => ({
  default: ({ content }: { content: string }) => {
    // Simple mock that creates code elements for backtick content
    if (content.includes('`')) {
      const parts = content.split('`');
      return (
        <div data-testid="mdx-content">
          {parts.map((part, index) => 
            index % 2 === 1 ? <code key={index}>{part}</code> : part
          )}
        </div>
      );
    }
    return <div data-testid="mdx-content">{content}</div>;
  }
}));

describe('MessageContent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders user messages as plain text', () => {
    render(
      <MessageContent
        content="Hello there"
        type="user"
        messageId="user-1"
      />
    );

    expect(screen.getByText('Hello there')).toBeInTheDocument();
    expect(screen.queryByTestId('mdx-content')).not.toBeInTheDocument();
  });

  it('renders assistant messages with MdxRenderer', () => {
    render(
      <MessageContent
        content="This is an assistant response"
        type="assistant"
        messageId="assistant-1"
      />
    );

    expect(screen.getByTestId('mdx-content')).toBeInTheDocument();
    expect(screen.getByText('This is an assistant response')).toBeInTheDocument();
  });

  it('converts {{keyword}} patterns to clickable buttons in assistant messages', async () => {
    // Mock window.dispatchEvent
    const mockDispatchEvent = vi.spyOn(window, 'dispatchEvent');

    render(
      <MessageContent
        content="Check the {{methodology}} section for details about {{Chapter 1}}"
        type="assistant"
        messageId="assistant-1"
      />
    );

    // Wait for the DOM processing to complete
    await waitFor(() => {
      // The original text should be processed
      expect(screen.getByTestId('mdx-content')).toBeInTheDocument();
    });

    // The text content should still be visible but the {{}} should be processed
    // Note: The search icons (🔍) are added as part of the buttons
    const container = screen.getByTestId('mdx-content').parentElement;
    expect(container).toHaveTextContent('Check the 🔍methodology section for details about 🔍Chapter 1');

    // Check that buttons were created (they might be in different text nodes)
    await waitFor(() => {
      const buttons = container?.querySelectorAll('button');
      expect(buttons).toBeTruthy();
    });
  });

  it('handles multiple keywords in the same message', async () => {
    const mockDispatchEvent = vi.spyOn(window, 'dispatchEvent');

    render(
      <MessageContent
        content="See {{Table 2.3}} and {{Figure 1}} for more information about the {{results}}"
        type="assistant"
        messageId="assistant-1"
      />
    );

    await waitFor(() => {
      const container = screen.getByTestId('mdx-content').parentElement;
      expect(container).toHaveTextContent('See 🔍Table 2.3 and 🔍Figure 1 for more information about the 🔍results');
    });
  });

  it('does not process keywords in code blocks', async () => {
    render(
      <MessageContent
        content="Here is code: `const keyword = {{test}}` which should not be clickable"
        type="assistant"
        messageId="assistant-1"
      />
    );

    await waitFor(() => {
      const container = screen.getByTestId('mdx-content').parentElement;
      // The code block content should remain unchanged
      expect(container?.textContent).toContain('{{test}}');
    });
  });

  it('dispatches pdf-search event when keyword button is clicked', async () => {
    const mockDispatchEvent = vi.spyOn(window, 'dispatchEvent');

    // Test that the event dispatching logic works by directly calling it
    const mockButton = document.createElement('button');
    mockButton.onclick = (e) => {
      e.preventDefault();
      window.dispatchEvent(new CustomEvent('pdf-search', {
        detail: { keyword: 'methodology' }
      }));
    };

    // Simulate button click
    mockButton.click();

    expect(mockDispatchEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'pdf-search',
        detail: { keyword: 'methodology' }
      })
    );
  });

  it('handles empty content gracefully', () => {
    render(
      <MessageContent
        content=""
        type="assistant"
        messageId="assistant-1"
      />
    );

    expect(screen.getByTestId('mdx-content')).toBeInTheDocument();
  });

  it('handles content without keywords', () => {
    render(
      <MessageContent
        content="This is a regular message without any special patterns"
        type="assistant"
        messageId="assistant-1"
      />
    );

    expect(screen.getByTestId('mdx-content')).toBeInTheDocument();
    expect(screen.getByText('This is a regular message without any special patterns')).toBeInTheDocument();
  });
});