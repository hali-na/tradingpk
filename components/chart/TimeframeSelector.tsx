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
    <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
      {timeframes.map((tf) => (
        <button
          key={tf.value}
          onClick={() => onChange(tf.value)}
          className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
            current === tf.value
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          {tf.label}
        </button>
      ))}
    </div>
  );
}
