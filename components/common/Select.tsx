'use client';

import { SelectHTMLAttributes, forwardRef } from 'react';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-muted-foreground mb-1.5">
            {label}
          </label>
        )}
        <select
          ref={ref}
          className={`w-full px-3 py-2 glass rounded-lg border-2 transition-all focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 ${
            error ? 'border-loss text-loss' : 'border-primary/20 text-foreground'
          } bg-background/30 backdrop-blur-sm ${className}`}
          style={error ? {} : { boxShadow: '0 0 5px hsl(var(--primary)/0.1)' }}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value} className="bg-background text-foreground">
              {option.label}
            </option>
          ))}
        </select>
        {error && <p className="mt-1 text-sm text-loss">{error}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';
