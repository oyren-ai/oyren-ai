import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ConfirmDialog } from '../ConfirmDialog';

// Mock UI components
vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open, onOpenChange }: { children: React.ReactNode; open: boolean; onOpenChange?: (open: boolean) => void }) =>
    open ? <div data-testid="dialog">{children}</div> : null,
  DialogContent: ({ children }: { children: React.ReactNode }) =>
    <div data-testid="dialog-content">{children}</div>,
  DialogHeader: ({ children }: { children: React.ReactNode }) =>
    <div data-testid="dialog-header">{children}</div>,
  DialogTitle: ({ children }: { children: React.ReactNode }) =>
    <h2 data-testid="dialog-title">{children}</h2>,
  DialogDescription: ({ children }: { children: React.ReactNode }) =>
    <p data-testid="dialog-description">{children}</p>,
  DialogFooter: ({ children }: { children: React.ReactNode }) =>
    <div data-testid="dialog-footer">{children}</div>,
}));

vi.mock('@/components/ui/button', () => ({
  Button: React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
    (props, ref) => <button ref={ref} {...props} />
  ),
}));

vi.mock('lucide-react', () => ({
  AlertTriangle: () => <span data-testid="alert-icon">⚠️</span>,
  X: () => <span data-testid="x-icon">✕</span>,
}));

describe('ConfirmDialog', () => {
  const mockOnClose = vi.fn();
  const mockOnConfirm = vi.fn();

  const defaultProps = {
    isOpen: true,
    onClose: mockOnClose,
    onConfirm: mockOnConfirm,
    title: 'Confirm Action',
    description: 'Are you sure you want to proceed?',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when isOpen is false', () => {
    render(<ConfirmDialog {...defaultProps} isOpen={false} />);
    
    expect(screen.queryByTestId('dialog')).not.toBeInTheDocument();
  });

  it('renders dialog when isOpen is true', () => {
    render(<ConfirmDialog {...defaultProps} />);
    
    expect(screen.getByTestId('dialog')).toBeInTheDocument();
    expect(screen.getByTestId('dialog-title')).toHaveTextContent('Confirm Action');
    expect(screen.getByTestId('dialog-description')).toHaveTextContent('Are you sure you want to proceed?');
  });

  it('displays custom confirm and cancel text', () => {
    render(
      <ConfirmDialog
        {...defaultProps}
        confirmText="Delete"
        cancelText="Go Back"
      />
    );
    
    expect(screen.getByText('Delete')).toBeInTheDocument();
    expect(screen.getByText('Go Back')).toBeInTheDocument();
  });

  it('uses default button text when not provided', () => {
    render(<ConfirmDialog {...defaultProps} />);
    
    expect(screen.getByText('Confirm')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('calls onConfirm and onClose when confirm button is clicked', async () => {
    const user = userEvent.setup();
    render(<ConfirmDialog {...defaultProps} />);
    
    const confirmButton = screen.getByText('Confirm');
    await user.click(confirmButton);
    
    expect(mockOnConfirm).toHaveBeenCalledTimes(1);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when cancel button is clicked', async () => {
    const user = userEvent.setup();
    render(<ConfirmDialog {...defaultProps} />);
    
    const cancelButton = screen.getByText('Cancel');
    await user.click(cancelButton);
    
    expect(mockOnClose).toHaveBeenCalledTimes(1);
    expect(mockOnConfirm).not.toHaveBeenCalled();
  });

  it('disables buttons when isLoading is true', () => {
    render(<ConfirmDialog {...defaultProps} isLoading={true} />);
    
    expect(screen.getByText('Deleting...')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeDisabled();
    expect(screen.getByText('Deleting...')).toBeDisabled();
  });

  it('shows loading text when isLoading is true', () => {
    render(<ConfirmDialog {...defaultProps} isLoading={true} />);
    
    expect(screen.getByText('Deleting...')).toBeInTheDocument();
    expect(screen.queryByText('Confirm')).not.toBeInTheDocument();
  });

  describe('variant styles', () => {
    it('renders with danger variant by default', () => {
      render(<ConfirmDialog {...defaultProps} />);
      
      // The component renders with danger styles by default
      expect(screen.getByTestId('dialog')).toBeInTheDocument();
    });

    it('renders with warning variant', () => {
      render(<ConfirmDialog {...defaultProps} variant="warning" />);
      
      expect(screen.getByTestId('dialog')).toBeInTheDocument();
    });

    it('renders with info variant', () => {
      render(<ConfirmDialog {...defaultProps} variant="info" />);
      
      expect(screen.getByTestId('dialog')).toBeInTheDocument();
    });
  });

  it('renders alert icon', () => {
    render(<ConfirmDialog {...defaultProps} />);
    
    expect(screen.getByTestId('alert-icon')).toBeInTheDocument();
  });

  it('does not call onConfirm when loading', async () => {
    const user = userEvent.setup();
    render(<ConfirmDialog {...defaultProps} isLoading={true} />);
    
    const confirmButton = screen.getByText('Deleting...');
    await user.click(confirmButton);
    
    // Button is disabled so click shouldn't work
    expect(mockOnConfirm).not.toHaveBeenCalled();
  });

  it('handles custom title and description', () => {
    render(
      <ConfirmDialog
        {...defaultProps}
        title="Delete Item"
        description="This action cannot be undone."
      />
    );
    
    expect(screen.getByTestId('dialog-title')).toHaveTextContent('Delete Item');
    expect(screen.getByTestId('dialog-description')).toHaveTextContent('This action cannot be undone.');
  });
});

