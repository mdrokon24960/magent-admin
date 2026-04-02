import type { InputHTMLAttributes } from 'react';
import { forwardRef } from 'react';
import { cn } from '../../lib/utils';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  label?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, label, ...props }, ref) => {
    return (
      <div className="w-full space-y-2 text-left">
        {label && <label className="text-sm font-medium text-text-muted ml-1">{label}</label>}
        <input
          ref={ref}
          className={cn(
            'w-full bg-bg-surface border border-bg-border rounded-xl px-4 py-3 placeholder:text-text-subtle transition-all outline-none',
            'focus:border-primary focus:shadow-input',
            error && 'border-danger focus:border-danger focus:shadow-0',
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-danger font-medium ml-1">{error}</p>}
      </div>
    );
  }
);
