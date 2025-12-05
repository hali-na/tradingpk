'use client';

import { Button } from '../common/Button';

interface TimeControllerProps {
  currentTime: string;
  speed: number;
  isPaused: boolean;
  remainingTime: string;
  progress: number;
  onPlay: () => void;
  onPause: () => void;
  onSpeedChange: (speed: number) => void;
}

const speeds = [1, 2, 5, 10, 50, 100, 300, 500, 800];

export function TimeController({
  currentTime,
  speed,
  isPaused,
  remainingTime,
  progress,
  onPlay,
  onPause,
  onSpeedChange,
}: TimeControllerProps) {
  const formatTime = (isoString: string) => {
    if (!isoString) return '--:--:--';
    const date = new Date(isoString);
    return date.toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <div className="glass-card border-2 border-primary/30 rounded-xl shadow-lg p-3 backdrop-blur-xl">
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm text-muted-foreground font-medium">模拟时间</div>
        <div className="text-lg font-mono font-bold text-primary" style={{ textShadow: '0 0 10px hsl(var(--primary)/0.5)' }}>
          {formatTime(currentTime)}
        </div>
      </div>

      {/* 进度条 */}
      <div className="mb-4">
        <div className="h-2 bg-background/50 rounded-full overflow-hidden border border-primary/20">
          <div
            className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-300"
            style={{ 
              width: `${progress}%`,
              boxShadow: '0 0 10px hsl(var(--primary)/0.5)'
            }}
          />
        </div>
        <div className="flex justify-between text-xs text-muted-foreground mt-1 font-mono">
          <span>进度: <span className="text-primary font-semibold">{progress.toFixed(1)}%</span></span>
          <span>剩余: <span className="text-accent font-semibold">{remainingTime}</span></span>
        </div>
      </div>

      {/* 控制按钮 */}
      <div className="flex items-center gap-2 mb-3">
        {isPaused ? (
          <Button
            onClick={onPlay}
            variant="primary"
            size="sm"
            className="shadow-[0_0_18px_hsl(var(--primary))] border-2 border-primary/80 hover:shadow-[0_0_22px_hsl(var(--primary))] active:scale-95"
          >
            播放
          </Button>
        ) : (
          <Button
            onClick={onPause}
            variant="secondary"
            size="sm"
            className="shadow-[0_0_14px_hsl(var(--primary)/0.45)] border border-primary/40 hover:shadow-[0_0_18px_hsl(var(--primary)/0.6)] active:scale-95"
          >
            暂停
          </Button>
        )}
      </div>

      {/* 速度选择 */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground font-medium">速度:</span>
        <div className="flex gap-1 flex-wrap">
          {speeds.map((s) => (
            <button
              key={s}
              onClick={() => onSpeedChange(s)}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                speed === s
                  ? 'bg-primary text-white shadow-lg shadow-primary/50 border-2 border-primary'
                  : 'bg-background/50 text-muted-foreground hover:bg-background/70 border border-primary/20 hover:border-primary/40'
              }`}
              style={speed === s ? { textShadow: '0 0 5px rgba(255,255,255,0.5)' } : {}}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
