import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Button as ShadcnButton } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
  type?: 'button' | 'submit' | 'reset';
  'data-testid'?: string;
}

// Map our variants to shadcn variants
const variantMap = {
  primary: 'default',
  secondary: 'secondary',
  danger: 'destructive',
  success: 'default', // Will use custom classes for success
  ghost: 'ghost',
} as const;

// Map our sizes to shadcn sizes
const sizeMap = {
  sm: 'sm',
  md: 'default',
  lg: 'lg',
} as const;

const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  className = '',
  icon: Icon,
  iconPosition = 'left',
  type = 'button',
  'data-testid': testId,
}) => {
  // Get shadcn variant and size
  const shadcnVariant = variantMap[variant] as any;
  const shadcnSize = sizeMap[size] as any;

  // Add custom classes for success variant
  const customClasses = variant === 'success' 
    ? 'bg-green-500 hover:bg-green-600 text-white'
    : '';

  return (
    <ShadcnButton
      type={type}
      onClick={onClick}
      disabled={disabled}
      variant={shadcnVariant}
      size={shadcnSize}
      className={cn(customClasses, className)}
      data-testid={testId}
    >
      {Icon && iconPosition === 'left' && <Icon className="w-4 h-4 mr-2" />}
      {children}
      {Icon && iconPosition === 'right' && <Icon className="w-4 h-4 ml-2" />}
    </ShadcnButton>
  );
};

export default Button;