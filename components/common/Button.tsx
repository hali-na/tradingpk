'use client';

import { ButtonHTMLAttributes, forwardRef } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, disabled, className = '', children, ...props }, ref) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
    
    const variants = {
      primary:
        'bg-gradient-to-r from-pink-500 via-fuchsia-500 to-purple-500 text-white shadow-[0_0_14px_rgba(255,0,150,0.45)] hover:from-pink-400 hover:via-fuchsia-400 hover:to-purple-400 focus:ring-pink-400 border border-pink-300/60 backdrop-blur',
      secondary:
        'bg-white/10 text-pink-50 border border-pink-200/40 hover:bg-white/15 shadow-[0_0_10px_rgba(255,0,150,0.25)] focus:ring-pink-300',
      success:
        'bg-emerald-600 text-white hover:bg-emerald-500 focus:ring-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.35)] border border-emerald-300/50',
      danger:
        'bg-rose-600 text-white hover:bg-rose-500 focus:ring-rose-400 shadow-[0_0_12px_rgba(244,63,94,0.35)] border border-rose-300/50',
      ghost:
        'bg-transparent text-pink-100 hover:bg-white/10 focus:ring-pink-300 border border-transparent',
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-base',
      lg: 'px-6 py-3 text-lg',
    };

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
