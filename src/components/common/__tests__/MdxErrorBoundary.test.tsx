import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import MdxErrorBoundary from '../MdxErrorBoundary';

function ThrowingChild(): JSX.Element {
  throw new Error('Render failure');
}

describe('MdxErrorBoundary', () => {
  it('renders children when no error occurs', () => {
    render(
      <MdxErrorBoundary fallbackContent="fallback text">
        <p>Normal content</p>
      </MdxErrorBoundary>
    );
    expect(screen.getByText('Normal content')).toBeInTheDocument();
    expect(screen.queryByText('fallback text')).not.toBeInTheDocument();
  });

  it('renders fallback content when child throws during render', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <MdxErrorBoundary fallbackContent="Raw markdown **here**">
        <ThrowingChild />
      </MdxErrorBoundary>
    );

    expect(screen.getByText('Raw markdown **here**')).toBeInTheDocument();
    const fallbackElement = screen.getByText('Raw markdown **here**');
    expect(fallbackElement.tagName).toBe('PRE');
    expect(fallbackElement).toHaveClass('whitespace-pre-wrap');

    consoleSpy.mockRestore();
  });
});
