import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ZoomButtons from '../ZoomButtons';

describe('ZoomButtons', () => {
  it('calls handlers on click', () => {
    const onZoomIn = vi.fn();
    const onZoomOut = vi.fn();
    const { container } = render(<ZoomButtons currentScale={1} onZoomIn={onZoomIn} onZoomOut={onZoomOut} />);

    // Find buttons by their title attribute or by role
    const zoomInButton = container.querySelector('button[title="Zoom In"]') || 
                        screen.getByRole('button', { name: /zoom in/i });
    const zoomOutButton = container.querySelector('button[title="Zoom Out"]') || 
                         screen.getByRole('button', { name: /zoom out/i });

    fireEvent.click(zoomInButton);
    fireEvent.click(zoomOutButton);

    expect(onZoomIn).toHaveBeenCalled();
    expect(onZoomOut).toHaveBeenCalled();
  });

  it('disables buttons at bounds', () => {
    const noop = () => {};
    const { container, rerender } = render(<ZoomButtons currentScale={0.5} onZoomIn={noop} onZoomOut={noop} />);
    
    const zoomOutButton = container.querySelector('button[title="Zoom Out"]') || 
                        screen.getByRole('button', { name: /zoom out/i });
    expect(zoomOutButton).toBeDisabled();

    rerender(<ZoomButtons currentScale={3.0} onZoomIn={noop} onZoomOut={noop} />);
    
    const zoomInButton = container.querySelector('button[title="Zoom In"]') || 
                        screen.getByRole('button', { name: /zoom in/i });
    expect(zoomInButton).toBeDisabled();
  });
});


