import React from 'react';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

export interface DropdownOption {
  value: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export interface DropdownProps {
  options: DropdownOption[];
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  helperText?: string;
  variant?: 'default' | 'filled' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
  id?: string;
  'data-testid'?: string;
}

const Dropdown: React.FC<DropdownProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Select an option',
  label,
  error,
  helperText,
  variant = 'default',
  size = 'md',
  disabled = false,
  className,
  id,
  'data-testid': dataTestId,
}) => {
  // Map size to shadcn classes
  const sizeClasses = {
    sm: 'h-8 text-sm',
    md: 'h-10',
    lg: 'h-12 text-lg',
  };

  // Map variant to shadcn classes
  const variantClasses = {
    default: '',
    filled: 'bg-secondary',
    ghost: 'border-0 shadow-none',
  };

  return (
    <div className={cn('w-full', className)}>
      {label && (
        <label
          htmlFor={id}
          className={cn(
            'block text-sm font-medium mb-2',
            error ? 'text-destructive' : 'text-foreground'
          )}
        >
          {label}
        </label>
      )}

      <Select
        value={value}
        onValueChange={onChange}
        disabled={disabled}
      >
        <SelectTrigger
          id={id}
          className={cn(
            sizeClasses[size],
            variantClasses[variant],
            error && 'border-destructive focus:ring-destructive',
            'data-[placeholder]:text-muted-foreground'
          )}
          data-testid={dataTestId ? `${dataTestId}-button` : undefined}
        >
          <SelectValue placeholder={placeholder}>
            {value && options.find(opt => opt.value === value)?.icon && (
              <span className="flex items-center gap-2">
                {options.find(opt => opt.value === value)?.icon}
                {options.find(opt => opt.value === value)?.label}
              </span>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent data-testid={dataTestId ? `${dataTestId}-menu` : undefined}>
          <SelectGroup>
            {options.map((option) => (
              <SelectItem
                key={option.value}
                value={option.value}
                disabled={option.disabled}
                data-testid={dataTestId ? `${dataTestId}-option-${option.value}` : undefined}
              >
                <div className="flex items-center gap-2">
                  {option.icon}
                  <div className="flex flex-col">
                    <span>{option.label}</span>
                    {option.description && (
                      <span className="text-xs text-muted-foreground">
                        {option.description}
                      </span>
                    )}
                  </div>
                </div>
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>

      <div className="mt-1">
        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
        {helperText && !error && (
          <p className="text-sm text-muted-foreground">{helperText}</p>
        )}
      </div>
    </div>
  );
};

export default Dropdown;