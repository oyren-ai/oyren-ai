import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { renderHook } from '@testing-library/react';
import type { RenderHighlightTargetProps } from '@react-pdf-viewer/highlight';
import { usePdfHighlightRenderers } from '../PdfHighlightPluginUi';

vi.mock('lucide-react', () => ({
  Sparkles: () => <span data-testid="sparkles-icon" />,
}));

describe('usePdfHighlightRenderers', () => {
  const baseTargetProps: RenderHighlightTargetProps = {
    highlightAreas: [],
    previewImage: '',
    selectedText: 'Selected phrase',
    selectionRegion: { pageIndex: 0, left: 10, top: 20, width: 30, height: 5 },
    cancel: vi.fn(),
    toggle: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders Highlight label, swatches, Ask AI, and cancel', () => {
    const onCommit = vi.fn();
    const { result } = renderHook(() => usePdfHighlightRenderers(onCommit));
    render(<>{result.current.renderHighlightTarget(baseTargetProps)}</>);

    expect(screen.getByText('Highlight')).toBeInTheDocument();
    expect(screen.getByTitle('Yellow')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ask AI' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
  });

  it('calls toggle when a color is chosen', () => {
    const onCommit = vi.fn();
    const { result } = renderHook(() => usePdfHighlightRenderers(onCommit));
    render(<>{result.current.renderHighlightTarget(baseTargetProps)}</>);

    fireEvent.click(screen.getByTitle('Green'));
    expect(baseTargetProps.toggle).toHaveBeenCalledTimes(1);
  });

  it('calls cancel when × is clicked', () => {
    const onCommit = vi.fn();
    const { result } = renderHook(() => usePdfHighlightRenderers(onCommit));
    render(<>{result.current.renderHighlightTarget(baseTargetProps)}</>);

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(baseTargetProps.cancel).toHaveBeenCalledTimes(1);
  });

  it('dispatches ask-ai and cancels when Ask AI is clicked', () => {
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent');
    const onCommit = vi.fn();
    const { result } = renderHook(() => usePdfHighlightRenderers(onCommit));
    render(<>{result.current.renderHighlightTarget(baseTargetProps)}</>);

    fireEvent.click(screen.getByRole('button', { name: 'Ask AI' }));

    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'ask-ai',
        detail: { text: 'Selected phrase' },
      }),
    );
    expect(baseTargetProps.cancel).toHaveBeenCalledTimes(1);
  });
});
