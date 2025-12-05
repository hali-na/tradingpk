import * as React from 'react';
import { cn } from '@/lib/utils';

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;
  max?: number;
  variant?: 'default' | 'profit' | 'loss';
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value = 0, max = 100, variant = 'default', ...props }, ref) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

    return (
      <div
        ref={ref}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={value}
        className={cn(
          'relative h-2 w-full overflow-hidden rounded-full bg-muted/30',
          'bg-[linear-gradient(45deg,hsla(0,0%,100%,.05)_25%,transparent_25%,transparent_50%,hsla(0,0%,100%,.05)_50%,hsla(0,0%,100%,.05)_75%,transparent_75%,transparent)]',
          'bg-[length:10px_10px]',
          className
        )}
        {...props}
      >
        <div
          className={cn(
            'h-full transition-all duration-300 ease-out rounded-full',
            variant === 'default' && 'bg-primary',
            variant === 'profit' && 'bg-profit',
            variant === 'loss' && 'bg-loss'
          )}
          style={{ 
            width: `${percentage}%`,
            boxShadow: `0 0 8px hsl(var(--${variant === 'default' ? 'primary' : variant})), 0 0 12px hsl(var(--${variant === 'default' ? 'primary' : variant}))`
          }}
        />
      </div>
    );
  }
);
Progress.displayName = 'Progress';

export { Progress };
