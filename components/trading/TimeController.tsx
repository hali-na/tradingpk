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

const speeds = [1, 2, 5, 10, 50, 100];

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
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm text-gray-500">模拟时间</div>
        <div className="text-lg font-mono font-semibold">
          {formatTime(currentTime)}
        </div>
      </div>

      {/* 进度条 */}
      <div className="mb-4">
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>进度: {progress.toFixed(1)}%</span>
          <span>剩余: {remainingTime}</span>
        </div>
      </div>

      {/* 控制按钮 */}
      <div className="flex items-center gap-2 mb-3">
        {isPaused ? (
          <Button onClick={onPlay} variant="primary" size="sm">
            ▶️ 播放
          </Button>
        ) : (
          <Button onClick={onPause} variant="secondary" size="sm">
            ⏸️ 暂停
          </Button>
        )}
      </div>

      {/* 速度选择 */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-500">速度:</span>
        <div className="flex gap-1">
          {speeds.map((s) => (
            <button
              key={s}
              onClick={() => onSpeedChange(s)}
              className={`px-2 py-1 text-xs rounded ${
                speed === s
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
