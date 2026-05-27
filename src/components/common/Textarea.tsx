import React, { forwardRef } from 'react';
import { cn } from '../../utils/cn';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  variant?: 'default' | 'filled' | 'ghost';
  inputSize?: 'sm' | 'md' | 'lg';
  showCharCount?: boolean;
  maxLength?: number;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      error,
      helperText,
      variant = 'default',
      inputSize = 'md',
      showCharCount = false,
      maxLength,
      className,
      value,
      id,
      ...props
    },
    ref
  ) => {
    const baseStyles = cn(
      'w-full transition-all duration-200',
      'focus:outline-none focus:ring-2 focus:ring-offset-0',
      'disabled:opacity-50 disabled:cursor-not-allowed',
      'resize-none'
    );

    const variantStyles = {
      default: cn(
        'border rounded-lg',
        'bg-white dark:bg-gray-700',
        'border-gray-300 dark:border-gray-600',
        'focus:border-blue-500 focus:ring-blue-500',
        error && 'border-red-500 focus:border-red-500 focus:ring-red-500'
      ),
      filled: cn(
        'border-0 border-b-2 rounded-t-md',
        'bg-gray-100 dark:bg-gray-800',
        'border-gray-300 dark:border-gray-600',
        'focus:border-blue-500 focus:ring-0',
        error && 'border-red-500 focus:border-red-500'
      ),
      ghost: cn(
        'border-0',
        'bg-transparent',
        'focus:ring-2 focus:ring-blue-500',
        error && 'focus:ring-red-500'
      ),
    };

    const sizeStyles = {
      sm: 'px-3 py-2 text-sm',
      md: 'px-3 py-2 text-base',
      lg: 'px-4 py-3 text-lg',
    };

    const textareaStyles = cn(
      baseStyles,
      variantStyles[variant],
      sizeStyles[inputSize],
      'text-gray-900 dark:text-gray-100',
      'placeholder-gray-500 dark:placeholder-gray-400',
      className
    );

    const currentLength = typeof value === 'string' ? value.length : 0;

    return (
      <div>
        {label && (
          <label
            htmlFor={id}
            className={cn(
              'block text-sm font-medium mb-2',
              error ? 'text-red-600 dark:text-red-400' : 'text-gray-700 dark:text-gray-300'
            )}
          >
            {label}
          </label>
        )}
        
        <textarea
          ref={ref}
          id={id}
          value={value}
          maxLength={maxLength}
          className={textareaStyles}
          {...props}
        />
        
        <div className="mt-1 flex justify-between items-start">
          <div>
            {error && (
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            )}
            {helperText && !error && (
              <p className="text-sm text-gray-500 dark:text-gray-400">{helperText}</p>
            )}
          </div>
          
          {showCharCount && maxLength && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {currentLength}/{maxLength}
            </p>
          )}
        </div>
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

export default Textarea;