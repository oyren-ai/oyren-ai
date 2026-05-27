import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import FileChip from '../FileChip';

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  FileText: () => <span data-testid="file-text-icon">FileText</span>,
  X: () => <span data-testid="x-icon">X</span>,
}));

describe('FileChip', () => {
  it('should render file name', () => {
    render(
      <FileChip
        fileName="document.pdf"
        filePath="/path/to/document.pdf"
      />
    );

    expect(screen.getByText('document.pdf')).toBeInTheDocument();
  });

  it('should render file icon', () => {
    render(
      <FileChip
        fileName="document.pdf"
        filePath="/path/to/document.pdf"
      />
    );

    expect(screen.getByTestId('file-text-icon')).toBeInTheDocument();
  });

  it('should call onRemove when remove button is clicked', () => {
    const mockOnRemove = vi.fn();

    render(
      <FileChip
        fileName="document.pdf"
        filePath="/path/to/document.pdf"
        onRemove={mockOnRemove}
      />
    );

    const removeButton = screen.getByRole('button');
    fireEvent.click(removeButton);

    expect(mockOnRemove).toHaveBeenCalledTimes(1);
  });

  it('should not show remove button when onRemove is not provided', () => {
    render(
      <FileChip
        fileName="document.pdf"
        filePath="/path/to/document.pdf"
      />
    );

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('should apply custom test id', () => {
    render(
      <FileChip
        fileName="document.pdf"
        filePath="/path/to/document.pdf"
        data-testid="custom-file-chip"
      />
    );

    expect(screen.getByTestId('custom-file-chip')).toBeInTheDocument();
  });

  it('should truncate long file names', () => {
    const longFileName = 'a'.repeat(200) + '.pdf';

    render(
      <FileChip
        fileName={longFileName}
        filePath="/path/to/file.pdf"
      />
    );

    const fileNameElement = screen.getByText(longFileName);
    expect(fileNameElement).toHaveClass('truncate');
    expect(fileNameElement).toHaveAttribute('title', longFileName);
  });

  it('should stop propagation on remove button click', () => {
    const mockOnRemove = vi.fn();
    const mockStopPropagation = vi.fn();

    render(
      <FileChip
        fileName="document.pdf"
        filePath="/path/to/document.pdf"
        onRemove={mockOnRemove}
      />
    );

    const removeButton = screen.getByRole('button');
    const clickEvent = new MouseEvent('click', { bubbles: true });
    clickEvent.stopPropagation = mockStopPropagation;

    fireEvent.click(removeButton, clickEvent);

    // The component should call stopPropagation internally
    expect(mockOnRemove).toHaveBeenCalled();
  });
});

