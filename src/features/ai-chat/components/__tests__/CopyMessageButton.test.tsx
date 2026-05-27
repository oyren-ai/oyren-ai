import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { writeText } from '@tauri-apps/plugin-clipboard-manager';
import CopyMessageButton from '../CopyMessageButton';

vi.mock('lucide-react', () => ({
  Copy: () => <span data-testid="copy-icon">Copy</span>,
  Check: () => <span data-testid="check-icon">Check</span>,
}));

describe('CopyMessageButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should render copy button', () => {
    render(<CopyMessageButton content="Test content" />);
    expect(screen.getByTestId('copy-mdx-button')).toBeInTheDocument();
    expect(screen.getByTestId('copy-icon')).toBeInTheDocument();
  });

  it('should copy content to clipboard on click', async () => {
    vi.mocked(writeText).mockResolvedValue(undefined);
    render(<CopyMessageButton content="Test content" />);

    await act(async () => {
      fireEvent.click(screen.getByTestId('copy-mdx-button'));
    });

    expect(writeText).toHaveBeenCalledWith('Test content');
  });

  it('should show "Copied!" after successful copy', async () => {
    vi.mocked(writeText).mockResolvedValue(undefined);
    render(<CopyMessageButton content="Test content" />);

    await act(async () => {
      fireEvent.click(screen.getByTestId('copy-mdx-button'));
    });

    expect(screen.getByText('Copied!')).toBeInTheDocument();
  });

  it('should reset to copy icon after 2 seconds', async () => {
    vi.mocked(writeText).mockResolvedValue(undefined);
    render(<CopyMessageButton content="Test content" />);

    await act(async () => {
      fireEvent.click(screen.getByTestId('copy-mdx-button'));
    });

    expect(screen.getByText('Copied!')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(screen.getByTestId('copy-icon')).toBeInTheDocument();
    expect(screen.queryByText('Copied!')).not.toBeInTheDocument();
  });

  it('should handle clipboard error gracefully', async () => {
    vi.useRealTimers();
    const error = new Error('Clipboard error');
    vi.mocked(writeText).mockRejectedValue(error);

    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(<CopyMessageButton content="Test content" />);

    await act(async () => {
      fireEvent.click(screen.getByTestId('copy-mdx-button'));
      await new Promise(resolve => setTimeout(resolve, 10));
    });

    expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to copy:', error);
    expect(screen.queryByText('Copied!')).not.toBeInTheDocument();

    consoleErrorSpy.mockRestore();
    vi.useFakeTimers();
  });
});
