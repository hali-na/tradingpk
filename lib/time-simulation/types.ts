// 时间模拟引擎类型定义

export interface TimeSimulationState {
  currentTime: string;
  speed: number; // 1x, 2x, 5x, 10x, 50x, 100x
  isPaused: boolean;
  startTime: string;
  endTime: string;
}

export interface TimeSimulationEngine {
  start(): void;
  pause(): void;
  resume(): void;
  setSpeed(speed: number): void;
  jumpToTime(time: string): void;
  getCurrentTime(): string;
  getState(): TimeSimulationState;
  onTimeUpdate(callback: (time: string) => void): void;
  onTimeEnd(callback: () => void): void;
  destroy(): void;
}

