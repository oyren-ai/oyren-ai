import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TextInput from '../TextInput';

describe('TextInput', () => {
  it('renders with label', () => {
    render(<TextInput label="Email Address" />);
    expect(screen.getByText('Email Address')).toBeInTheDocument();
  });

  it('renders with placeholder', () => {
    render(<TextInput placeholder="Enter your email" />);
    expect(screen.getByPlaceholderText('Enter your email')).toBeInTheDocument();
  });

  it('handles value changes', async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();
    
    render(<TextInput onChange={handleChange} />);
    const input = screen.getByRole('textbox');
    
    await user.type(input, 'test@example.com');
    expect(handleChange).toHaveBeenCalled();
  });

  it('shows error message', () => {
    render(<TextInput error="This field is required" />);
    expect(screen.getByText('This field is required')).toBeInTheDocument();
  });

  it('shows helper text when no error', () => {
    render(<TextInput helperText="Enter a valid email address" />);
    expect(screen.getByText('Enter a valid email address')).toBeInTheDocument();
  });

  it('does not show helper text when error exists', () => {
    render(
      <TextInput 
        error="This field is required" 
        helperText="Enter a valid email address" 
      />
    );
    expect(screen.queryByText('Enter a valid email address')).not.toBeInTheDocument();
    expect(screen.getByText('This field is required')).toBeInTheDocument();
  });

  it('renders with different variants', () => {
    const { rerender } = render(<TextInput variant="default" />);
    let input = screen.getByRole('textbox');
    expect(input).toHaveClass('border');

    rerender(<TextInput variant="filled" />);
    input = screen.getByRole('textbox');
    expect(input).toHaveClass('bg-gray-100');

    rerender(<TextInput variant="ghost" />);
    input = screen.getByRole('textbox');
    expect(input).toHaveClass('bg-transparent');
  });

  it('renders with different sizes', () => {
    const { rerender } = render(<TextInput inputSize="sm" />);
    let input = screen.getByRole('textbox');
    expect(input).toHaveClass('text-sm');

    rerender(<TextInput inputSize="md" />);
    input = screen.getByRole('textbox');
    expect(input).toHaveClass('text-base');

    rerender(<TextInput inputSize="lg" />);
    input = screen.getByRole('textbox');
    expect(input).toHaveClass('text-lg');
  });

  it('renders with left icon', () => {
    render(<TextInput leftIcon={<span data-testid="left-icon">🔍</span>} />);
    expect(screen.getByTestId('left-icon')).toBeInTheDocument();
  });

  it('renders with right icon', () => {
    render(<TextInput rightIcon={<span data-testid="right-icon">✓</span>} />);
    expect(screen.getByTestId('right-icon')).toBeInTheDocument();
  });

  it('applies error styles when error prop is provided', () => {
    render(<TextInput error="Error message" variant="default" />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveClass('border-red-500');
  });

  it('handles disabled state', () => {
    render(<TextInput disabled />);
    const input = screen.getByRole('textbox');
    expect(input).toBeDisabled();
    expect(input).toHaveClass('opacity-50');
  });

  it('forwards ref correctly', () => {
    const ref = vi.fn();
    render(<TextInput ref={ref} />);
    expect(ref).toHaveBeenCalled();
  });

  it('accepts and applies additional props', () => {
    render(
      <TextInput 
        data-testid="custom-input"
        maxLength={50}
        required
      />
    );
    const input = screen.getByTestId('custom-input');
    expect(input).toHaveAttribute('maxLength', '50');
    expect(input).toBeRequired();
  });
});