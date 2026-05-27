import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { DragDropZone } from '../DragDropZone';

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Upload: () => <div data-testid="upload-icon" className="lucide-upload" />,
}));

describe('DragDropZone', () => {
  it('renders nothing when isDragging is false', () => {
    const { container } = render(<DragDropZone isDragging={false} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders drop zone when isDragging is true', () => {
    render(<DragDropZone isDragging={true} />);

    expect(screen.getByText('Drop PDF(s) here')).toBeInTheDocument();
    expect(screen.getByText('Release to add files to workspace')).toBeInTheDocument();
  });

  it('renders upload icon when dragging', () => {
    render(<DragDropZone isDragging={true} />);

    const uploadIcon = screen.getByTestId('upload-icon');
    expect(uploadIcon).toBeInTheDocument();
  });

  it('renders heading and description when dragging', () => {
    render(<DragDropZone isDragging={true} />);

    expect(screen.getByText('Drop PDF(s) here')).toBeInTheDocument();
    expect(screen.getByText('Release to add files to workspace')).toBeInTheDocument();
  });

  it('creates portal in document body when dragging', () => {
    render(<DragDropZone isDragging={true} />);

    // The portal should create content in document.body
    expect(screen.getByText('Drop PDF(s) here')).toBeInTheDocument();
    expect(screen.getByText('Release to add files to workspace')).toBeInTheDocument();
  });
});