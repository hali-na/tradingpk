'use client';

import { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-muted-foreground mb-1.5">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`w-full px-3 py-2 glass rounded-lg border-2 transition-all focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 ${
            error ? 'border-loss text-loss' : 'border-primary/20 text-foreground'
          } bg-background/30 backdrop-blur-sm ${className}`}
          style={error ? {} : { boxShadow: '0 0 5px hsl(var(--primary)/0.1)' }}
          {...props}
        />
        {error && <p className="mt-1 text-sm text-loss">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
