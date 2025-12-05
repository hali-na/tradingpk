'use client';

interface TimeframeSelectorProps {
  current: '1m' | '5m' | '1h' | '1d';
  onChange: (timeframe: '1m' | '5m' | '1h' | '1d') => void;
}

const timeframes: { value: '1m' | '5m' | '1h' | '1d'; label: string }[] = [
  { value: '1m', label: '1分钟' },
  { value: '5m', label: '5分钟' },
  { value: '1h', label: '1小时' },
  { value: '1d', label: '1天' },
];

export function TimeframeSelector({ current, onChange }: TimeframeSelectorProps) {
  return (
    <div className="flex gap-1 glass-card border border-primary/20 p-1 rounded-lg">
      {timeframes.map((tf) => (
        <button
          key={tf.value}
          onClick={() => onChange(tf.value)}
          className={`px-3 py-1.5 text-sm font-bold rounded-lg transition-all ${
            current === tf.value
              ? 'bg-primary text-white shadow-lg shadow-primary/50 border-2 border-primary'
              : 'bg-background/30 text-muted-foreground hover:bg-background/50 border border-primary/20 hover:border-primary/40'
          }`}
          style={current === tf.value ? { textShadow: '0 0 5px rgba(255,255,255,0.5)' } : {}}
        >
          {tf.label}
        </button>
      ))}
    </div>
  );
}
