import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import ImagePreviewModal from '../ImagePreviewModal';

describe('ImagePreviewModal', () => {
  const mockOnClose = vi.fn();
  
  const defaultProps = {
    isOpen: true,
    onClose: mockOnClose,
    imageData: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAGAkycloQAAAABJRU5ErkJggg==',
    imageName: 'Test Image',
    imageSize: { width: 800, height: 600 },
    isDarkMode: false
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Clean up any event listeners
    document.removeEventListener('keydown', () => {});
  });

  it('does not render when isOpen is false', () => {
    render(<ImagePreviewModal {...defaultProps} isOpen={false} />);
    
    expect(screen.queryByTestId('image-preview-modal')).not.toBeInTheDocument();
  });

  it('renders modal when isOpen is true', () => {
    render(<ImagePreviewModal {...defaultProps} />);
    
    expect(screen.getByTestId('image-preview-modal')).toBeInTheDocument();
    expect(screen.getByTestId('image-preview-title')).toHaveTextContent('Test Image');
    expect(screen.getByTestId('image-preview-dimensions')).toHaveTextContent('800 × 600');
    expect(screen.getByTestId('preview-image')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', async () => {
    const user = userEvent.setup();
    render(<ImagePreviewModal {...defaultProps} />);
    
    await user.click(screen.getByTestId('close-preview-btn'));
    
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when overlay is clicked', async () => {
    const user = userEvent.setup();
    render(<ImagePreviewModal {...defaultProps} />);
    
    const overlay = screen.getByTestId('image-preview-modal');
    await user.click(overlay);
    
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('does not close when clicking on image container', async () => {
    const user = userEvent.setup();
    render(<ImagePreviewModal {...defaultProps} />);
    
    const container = screen.getByTestId('image-preview-container');
    await user.click(container);
    
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('handles zoom in and zoom out', async () => {
    const user = userEvent.setup();
    render(<ImagePreviewModal {...defaultProps} />);
    
    const zoomLevel = screen.getByTestId('zoom-level');
    expect(zoomLevel).toHaveTextContent('100%');
    
    // Zoom in
    await user.click(screen.getByTestId('zoom-in-btn'));
    expect(zoomLevel).toHaveTextContent('120%');
    
    // Zoom out
    await user.click(screen.getByTestId('zoom-out-btn'));
    expect(zoomLevel).toHaveTextContent('100%');
  });

  it('handles rotation', async () => {
    const user = userEvent.setup();
    render(<ImagePreviewModal {...defaultProps} />);
    
    const image = screen.getByTestId('preview-image');
    
    // Initial rotation should be 0
    expect(image).toHaveStyle('transform: scale(1) rotate(0deg)');
    
    // Rotate once
    await user.click(screen.getByTestId('rotate-btn'));
    expect(image).toHaveStyle('transform: scale(1) rotate(90deg)');
    
    // Rotate again
    await user.click(screen.getByTestId('rotate-btn'));
    expect(image).toHaveStyle('transform: scale(1) rotate(180deg)');
  });

  it('handles keyboard shortcuts', async () => {
    render(<ImagePreviewModal {...defaultProps} />);
    
    const zoomLevel = screen.getByTestId('zoom-level');
    const image = screen.getByTestId('preview-image');
    
    // Test zoom in with +
    fireEvent.keyDown(document, { key: '+' });
    await waitFor(() => {
      expect(zoomLevel).toHaveTextContent('120%');
    });
    
    // Test zoom out with -
    fireEvent.keyDown(document, { key: '-' });
    await waitFor(() => {
      expect(zoomLevel).toHaveTextContent('100%');
    });
    
    // Test rotation with R
    fireEvent.keyDown(document, { key: 'r' });
    await waitFor(() => {
      expect(image).toHaveStyle('transform: scale(1) rotate(90deg)');
    });
    
    // Test close with Escape
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('handles wheel zoom', async () => {
    render(<ImagePreviewModal {...defaultProps} />);
    
    const container = screen.getByTestId('image-preview-container');
    const zoomLevel = screen.getByTestId('zoom-level');
    
    // Zoom in with wheel
    fireEvent.wheel(container, { deltaY: -100 });
    await waitFor(() => {
      const zoomText = zoomLevel.textContent;
      const zoomValue = parseInt(zoomText?.replace('%', '') || '0');
      expect(zoomValue).toBeGreaterThan(100);
    });
    
    // Zoom out with wheel
    fireEvent.wheel(container, { deltaY: 100 });
    await waitFor(() => {
      const zoomText = zoomLevel.textContent;
      const zoomValue = parseInt(zoomText?.replace('%', '') || '0');
      expect(zoomValue).toBeLessThanOrEqual(100);
    });
  });

  it('has download button that responds to clicks', async () => {
    const user = userEvent.setup();
    render(<ImagePreviewModal {...defaultProps} />);
    
    const downloadBtn = screen.getByTestId('download-btn');
    
    // Test that button exists and can be clicked without crashing
    expect(downloadBtn).toBeInTheDocument();
    await user.click(downloadBtn);
    
    // If we get here, the click worked without crashing
    expect(downloadBtn).toBeInTheDocument();
  });
});