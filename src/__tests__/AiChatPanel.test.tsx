import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import AiChatPanelStateful from '../features/ai-chat/AiChatPanelStateful';
import { AppProvider } from '../contexts/AppContext';
import { ApiProvider } from '../contexts/ApiContext';
import { ModalProvider } from '../contexts/ModalContext';
import { ViewNavigationProvider } from '../contexts/NavigationContext';
import React from 'react';

// Mock the services
vi.mock('@/services/configService');
vi.mock('@/services/conversationHistoryService');
vi.mock('@/api/pdfApi');
// vi.mock('@/api/aiApi');

// Mock Tauri invoke for AI provider API
import { invoke } from '@tauri-apps/api/core';

const mockProviderKey = {
  id: 'test-provider-key-id',
  name: 'Test Provider',
  key: 'test-api-key',
  ai_provider: {
    id: 'gemini',
    name: 'gemini',
    display_name: 'Google Gemini',
  },
  models: [
    {
      id: 'gemini-2.5-flash',
      name: 'gemini-2.5-flash',
      display_name: 'Gemini 2.5 Flash',
      context_window: 1000000,
    }
  ],
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

vi.mocked(invoke).mockImplementation((async (cmd: string) => {
  if (cmd === 'list_ai_provider_keys') {
    return [mockProviderKey];
  }
  if (cmd === 'ai_chat') {
    await new Promise((resolve) => setTimeout(resolve, 120));
    return { response: 'This appears to be a text selection from a PDF document.' };
  }
  return null;
}) as any);

// Mock the AppContext hook
let mockPdfPath: string | null = null;
vi.mock('../contexts/AppContext', () => ({
  useAppContext: vi.fn(() => ({
    currentPdfPath: mockPdfPath,
    setCurrentPdfPath: vi.fn()
  })),
  AppProvider: ({ children }: { children: React.ReactNode }) => children
}));

describe('AiChatPanel', () => {
  const mockOnToggleCollapse = vi.fn();

  const renderWithProviders = (component: React.ReactElement) => {
    return render(
      <AppProvider>
        <ViewNavigationProvider>
          <ApiProvider>
            <ModalProvider>
              {component}
            </ModalProvider>
          </ApiProvider>
        </ViewNavigationProvider>
      </AppProvider>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock localStorage for API key
    const localStorageMock = {
      getItem: vi.fn((key: string) => {
        if (key === 'ai-api-key') return 'test-api-key';
        if (key === 'ai-provider') return 'gemini';
        if (key === 'ai-model') return 'gemini-2.5-flash';
        return null;
      }),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
      key: vi.fn(),
      length: 0
    };
    Object.defineProperty(window, 'localStorage', { value: localStorageMock, writable: true });
  });

  it('renders correctly', () => {
    renderWithProviders(<AiChatPanelStateful pdfPath={null} />);

    expect(screen.getByTestId('ai-chat-panel-content')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Type @ to mention files...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send/i })).toBeInTheDocument();
  });

  // This test is no longer applicable as the panel doesn't collapse anymore
  it.skip('renders correctly when collapsed', () => {
    // Test removed as collapse functionality has been removed
  });

  // This test is no longer applicable as the collapse button was removed
  it.skip('calls onToggleCollapse when collapse button is clicked', () => {
    // Test removed as collapse functionality has been removed
  });

  // This test is no longer applicable as the collapse button was removed
  it.skip('shows correct chevron icon based on collapsed state', () => {
    // Test removed as collapse functionality has been removed
  });

  it('starts new chat when new button is clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<AiChatPanelStateful pdfPath={null} />);

    // Add a message first
    const input = screen.getByPlaceholderText('Type @ to mention files...');
    await user.type(input, 'Test message');
    await user.click(screen.getByRole('button', { name: /send/i }));

    // Now click new chat button
    const newChatBtn = screen.getByTestId('new-chat-button');
    await user.click(newChatBtn);

    // Check that messages are cleared
    await waitFor(() => {
      expect(screen.getByTestId('ai-chat-empty-state')).toBeInTheDocument();
    });
  });

  it('sends a message when form is submitted', async () => {
    const user = userEvent.setup();
    renderWithProviders(<AiChatPanelStateful pdfPath={null} />);

    const input = screen.getByPlaceholderText('Type @ to mention files...');

    await user.type(input, 'What is machine learning?');

    // Button should be enabled after typing
    const sendButton = screen.getByRole('button', { name: /send/i });
    expect(sendButton).not.toBeDisabled();

    await user.click(sendButton);

    // User message should appear
    await waitFor(() => {
      expect(screen.getByText('What is machine learning?')).toBeInTheDocument();
    });
    expect(input).toHaveValue('');

    // AI typing indicator should appear
    await waitFor(() => {
      expect(screen.getByTestId('loading-message')).toBeInTheDocument();
    });

    // Wait for AI response
    await waitFor(() => {
      expect(screen.queryByTestId('loading-message')).not.toBeInTheDocument();
      expect(screen.getByText(/This appears to be a text selection/)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('does not send empty messages', async () => {
    const user = userEvent.setup();
    renderWithProviders(<AiChatPanelStateful pdfPath={null} />);

    const sendButton = screen.getByRole('button', { name: /send/i });

    await user.click(sendButton);

    // Should show initial empty state (with or without workspace selected)
    expect(screen.getByText(/No conversation yet|Select a workspace first/)).toBeInTheDocument();
  });

  it('sends message on Enter key press', async () => {
    const user = userEvent.setup();
    renderWithProviders(<AiChatPanelStateful pdfPath={null} />);

    const input = screen.getByPlaceholderText('Type @ to mention files...');

    await user.type(input, 'Test message with Enter{enter}');

    await waitFor(() => {
      expect(screen.getByText('Test message with Enter')).toBeInTheDocument();
    });
    expect(input).toHaveValue('');
  });

  it('handles multiple messages in conversation', async () => {
    const user = userEvent.setup();
    renderWithProviders(<AiChatPanelStateful pdfPath={null} />);

    const input = screen.getByPlaceholderText('Type @ to mention files...');
    const sendButton = screen.getByRole('button', { name: /send/i });

    // First message
    await user.type(input, 'First question');
    await user.click(sendButton);

    // Wait for first message to appear
    await waitFor(() => {
      expect(screen.getByText('First question')).toBeInTheDocument();
    }, { timeout: 3000 });

    // Wait for AI response
    await waitFor(() => {
      expect(screen.getByText(/This appears to be a text selection/)).toBeInTheDocument();
    }, { timeout: 3000 });

    // Second message
    await user.type(input, 'Second question');
    await user.click(sendButton);

    await waitFor(() => {
      expect(screen.getByText('Second question')).toBeInTheDocument();
    }, { timeout: 3000 });
  }, 15000);

  it('listens for ask-ai custom event', async () => {
    renderWithProviders(<AiChatPanelStateful pdfPath={null} />);

    // Wait for component to be ready (chat input should be visible)
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Type @ to mention files...')).toBeInTheDocument();
    });

    // Dispatch custom event
    act(() => {
      const event = new CustomEvent('ask-ai', {
        detail: { text: 'Text from PDF selection' }
      });
      window.dispatchEvent(event);
    });

    // Check that the message was sent
    await waitFor(() => {
      expect(screen.getByText('What does this mean: "Text from PDF selection"')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  // This test is no longer applicable as the panel doesn't collapse anymore
  it.skip('expands panel when ask-ai event is triggered while collapsed', () => {
    // Test removed as collapse functionality has been removed
  });

  it('shows user and AI message indicators', async () => {
    const user = userEvent.setup();
    renderWithProviders(<AiChatPanelStateful pdfPath={null} />);

    const input = screen.getByPlaceholderText('Type @ to mention files...');
    await user.type(input, 'User message');
    await user.click(screen.getByRole('button', { name: /send/i }));

    // Check user message appears
    await waitFor(() => {
      expect(screen.getByText('User message')).toBeInTheDocument();
    }, { timeout: 3000 });

    // Check for "You" label
    await waitFor(() => {
      expect(screen.getByText('You')).toBeInTheDocument();
    }, { timeout: 3000 });

    // Wait for AI response
    await waitFor(() => {
      expect(screen.getByText(/This appears to be a text selection/)).toBeInTheDocument();
    }, { timeout: 3000 });

    // Check for "AI" label
    await waitFor(() => {
      expect(screen.getByText('AI')).toBeInTheDocument();
    }, { timeout: 3000 });
  }, 15000);

  it('shows loading state while AI is typing', async () => {
    const user = userEvent.setup();
    renderWithProviders(<AiChatPanelStateful pdfPath={null} />);

    const input = screen.getByPlaceholderText('Type @ to mention files...') as HTMLTextAreaElement;
    const sendButton = screen.getByRole('button', { name: /send/i });

    await user.type(input, 'Test message');
    await user.click(sendButton);

    // Check message appears first
    await waitFor(() => {
      expect(screen.getByText('Test message')).toBeInTheDocument();
    });

    // Loading indicator should appear
    await waitFor(() => {
      expect(screen.getByTestId('loading-message')).toBeInTheDocument();
    });

    // Wait for AI response and loading to disappear
    await waitFor(() => {
      expect(screen.queryByTestId('loading-message')).not.toBeInTheDocument();
      expect(screen.getByText(/This appears to be a text selection/)).toBeInTheDocument();
    }, { timeout: 2000 });
  });

  // This test is no longer applicable as the panel doesn't collapse anymore
  it.skip('maintains messages when toggling collapse state', () => {
    // Test removed as collapse functionality has been removed
  });

  it('scrolls to bottom when new messages are added', async () => {
    const user = userEvent.setup();
    renderWithProviders(<AiChatPanelStateful pdfPath={null} />);

    // Mock querySelector to return our container
    const mockContainer = document.createElement('div');
    let scrollTopValue = 0;
    Object.defineProperty(mockContainer, 'scrollTop', {
      get: () => scrollTopValue,
      set: (value) => { scrollTopValue = value; },
      configurable: true
    });
    Object.defineProperty(mockContainer, 'scrollHeight', {
      get: () => 1000,
      configurable: true
    });
    Object.defineProperty(mockContainer, 'clientHeight', {
      get: () => 500,
      configurable: true
    });

    const originalQuerySelector = document.querySelector.bind(document);
    document.querySelector = vi.fn((selector: string) => {
      if (selector.includes('messages-container')) {
        return mockContainer;
      }
      return originalQuerySelector(selector);
    }) as any;

    const input = screen.getByPlaceholderText('Type @ to mention files...');
    await user.type(input, 'New message');
    await user.click(screen.getByRole('button', { name: /send/i }));

    // Wait for message to appear
    await waitFor(() => {
      expect(screen.getByText('New message')).toBeInTheDocument();
    });

    // Wait for the scroll to happen
    await waitFor(() => {
      // The component should scroll to bottom (scrollTop = scrollHeight)
      expect(scrollTopValue).toBe(1000);
    });

    // Restore original querySelector
    document.querySelector = originalQuerySelector;
  });
});
