import React, { forwardRef } from 'react';
import { cn } from '../../utils/cn';

export interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
  variant?: 'default' | 'filled' | 'ghost';
  inputSize?: 'sm' | 'md' | 'lg';
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const TextInput = forwardRef<HTMLInputElement, TextInputProps>(
  (
    {
      label,
      error,
      helperText,
      fullWidth = false,
      variant = 'default',
      inputSize = 'md',
      leftIcon,
      rightIcon,
      className,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles = 'transition-all duration-200 font-sans';
    
    const variantStyles = {
      default: cn(
        'border border-gray-300 dark:border-gray-600',
        'bg-white dark:bg-gray-800',
        'hover:border-gray-400 dark:hover:border-gray-500',
        'focus:border-blue-500 dark:focus:border-blue-400',
        'focus:ring-2 focus:ring-blue-500/20'
      ),
      filled: cn(
        'border border-transparent',
        'bg-gray-100 dark:bg-gray-700',
        'hover:bg-gray-200 dark:hover:bg-gray-600',
        'focus:bg-white dark:focus:bg-gray-800',
        'focus:border-blue-500 dark:focus:border-blue-400',
        'focus:ring-2 focus:ring-blue-500/20'
      ),
      ghost: cn(
        'border border-transparent',
        'bg-transparent',
        'hover:bg-gray-100 dark:hover:bg-gray-800',
        'focus:bg-gray-50 dark:focus:bg-gray-900',
        'focus:border-gray-300 dark:focus:border-gray-600'
      ),
    };

    const sizeStyles = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-base',
      lg: 'px-5 py-3 text-lg',
    };

    const inputStyles = cn(
      baseStyles,
      variantStyles[variant],
      sizeStyles[inputSize],
      'rounded-md',
      'text-gray-900 dark:text-gray-100',
      'placeholder-gray-500 dark:placeholder-gray-400',
      'outline-none',
      {
        'w-full': fullWidth,
        'pl-10': leftIcon,
        'pr-10': rightIcon,
        'border-red-500 dark:border-red-400 focus:border-red-500 dark:focus:border-red-400': error,
        'opacity-50 cursor-not-allowed': disabled,
      },
      className
    );

    return (
      <div className={cn('relative', { 'w-full': fullWidth })}>
        {label && (
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {label}
          </label>
        )}
        
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">
              {leftIcon}
            </div>
          )}
          
          <input
            ref={ref}
            disabled={disabled}
            className={inputStyles}
            {...props}
          />
          
          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">
              {rightIcon}
            </div>
          )}
        </div>
        
        {error && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
        )}
        
        {helperText && !error && (
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{helperText}</p>
        )}
      </div>
    );
  }
);

TextInput.displayName = 'TextInput';

export default TextInput;