import React, { forwardRef } from 'react';
import { cn } from '../../utils/cn';

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'ghost' | 'primary' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  isRounded?: boolean;
  tooltip?: string;
}

const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      variant = 'default',
      size = 'md',
      isRounded = false,
      tooltip,
      className,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles = cn(
      'inline-flex items-center justify-center',
      'transition-all duration-200',
      'focus:outline-none focus:ring-2 focus:ring-offset-2',
      'disabled:opacity-50 disabled:cursor-not-allowed'
    );

    const variantStyles = {
      default: cn(
        'text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200',
        'hover:bg-gray-100 dark:hover:bg-gray-800',
        'focus:ring-gray-500'
      ),
      ghost: cn(
        'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100',
        'hover:bg-transparent',
        'focus:ring-gray-500'
      ),
      primary: cn(
        'text-white',
        'bg-blue-600 hover:bg-blue-700',
        'dark:bg-blue-500 dark:hover:bg-blue-600',
        'focus:ring-blue-500'
      ),
      danger: cn(
        'text-white',
        'bg-red-600 hover:bg-red-700',
        'dark:bg-red-500 dark:hover:bg-red-600',
        'focus:ring-red-500'
      ),
      success: cn(
        'text-white',
        'bg-green-600 hover:bg-green-700',
        'dark:bg-green-500 dark:hover:bg-green-600',
        'focus:ring-green-500'
      ),
    };

    const sizeStyles = {
      sm: 'p-1.5',
      md: 'p-2',
      lg: 'p-3',
    };

    const iconSizeStyles = {
      sm: '[&>svg]:w-4 [&>svg]:h-4',
      md: '[&>svg]:w-5 [&>svg]:h-5',
      lg: '[&>svg]:w-6 [&>svg]:h-6',
    };

    const buttonStyles = cn(
      baseStyles,
      variantStyles[variant],
      sizeStyles[size],
      iconSizeStyles[size],
      isRounded ? 'rounded-full' : 'rounded-md',
      className
    );

    return (
      <button
        ref={ref}
        className={buttonStyles}
        disabled={disabled}
        title={tooltip}
        {...props}
      >
        {children}
      </button>
    );
  }
);

IconButton.displayName = 'IconButton';

export default IconButton;