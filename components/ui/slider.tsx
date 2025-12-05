import * as React from 'react';
import { cn } from '@/lib/utils';

interface SliderProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  showValue?: boolean;
}

const Slider = React.forwardRef<HTMLInputElement, SliderProps>(
  ({ className, label, showValue, value, ...props }, ref) => {
    return (
      <div className="space-y-2">
        {(label || showValue) && (
          <div className="flex items-center justify-between">
            {label && (
              <label className="text-sm font-medium text-foreground">
                {label}
              </label>
            )}
            {showValue && (
              <span className="text-sm text-muted-foreground tabular-nums">
                {value}
              </span>
            )}
          </div>
        )}
        <input
          type="range"
          className={cn(
            'w-full h-2 bg-secondary rounded-full appearance-none cursor-pointer',
            '[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:hover:scale-110',
            '[&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-primary [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:shadow-md',
            className
          )}
          ref={ref}
          value={value}
          {...props}
        />
      </div>
    );
  }
);
Slider.displayName = 'Slider';

export { Slider };
