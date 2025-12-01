// 时间模拟引擎实现

import { TimeSimulationEngine, TimeSimulationState } from './types';

export class TimeSimulationEngineImpl implements TimeSimulationEngine {
  private state: TimeSimulationState;
  private timeUpdateCallbacks: Set<(time: string) => void> = new Set();
  private timeEndCallbacks: Set<() => void> = new Set();
  private animationFrameId: number | null = null;
  private lastRealTime: number = Date.now();
  private simulatedTimeOffset: number = 0; // 模拟时间相对于开始时间的偏移（毫秒）

  constructor(startTime: string, endTime: string) {
    this.state = {
      currentTime: startTime,
      speed: 1,
      isPaused: true,
      startTime,
      endTime,
    };
    this.simulatedTimeOffset = 0;
  }

  start(): void {
    if (!this.state.isPaused) {
      return;
    }
    
    this.state.isPaused = false;
    this.lastRealTime = Date.now();
    this.tick();
  }

  pause(): void {
    this.state.isPaused = true;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  resume(): void {
    if (!this.state.isPaused) {
      return;
    }
    this.start();
  }

  setSpeed(speed: number): void {
    // 保存当前模拟时间的进度
    const currentSimulatedTime = new Date(this.state.currentTime).getTime();
    const startTime = new Date(this.state.startTime).getTime();
    this.simulatedTimeOffset = currentSimulatedTime - startTime;
    
    // 更新速度
    this.state.speed = speed;
    
    // 更新最后真实时间，避免时间跳跃
    this.lastRealTime = Date.now();
  }

  jumpToTime(time: string): void {
    const targetTime = new Date(time).getTime();
    const startTime = new Date(this.state.startTime).getTime();
    const endTime = new Date(this.state.endTime).getTime();
    
    // 限制在开始和结束时间之间
    const clampedTime = Math.max(startTime, Math.min(endTime, targetTime));
    
    this.state.currentTime = new Date(clampedTime).toISOString();
    this.simulatedTimeOffset = clampedTime - startTime;
    this.lastRealTime = Date.now();
    
    // 通知时间更新
    this.notifyTimeUpdate();
    
    // 检查是否到达结束时间
    if (clampedTime >= endTime) {
      this.pause();
      this.notifyTimeEnd();
    }
  }

  getCurrentTime(): string {
    return this.state.currentTime;
  }

  getState(): TimeSimulationState {
    return { ...this.state };
  }

  onTimeUpdate(callback: (time: string) => void): void {
    this.timeUpdateCallbacks.add(callback);
  }

  onTimeEnd(callback: () => void): void {
    this.timeEndCallbacks.add(callback);
  }

  destroy(): void {
    this.pause();
    this.timeUpdateCallbacks.clear();
    this.timeEndCallbacks.clear();
  }

  private tick(): void {
    if (this.state.isPaused) {
      return;
    }

    const now = Date.now();
    const realTimeDelta = now - this.lastRealTime;
    const simulatedTimeDelta = realTimeDelta * this.state.speed;
    
    this.simulatedTimeOffset += simulatedTimeDelta;
    this.lastRealTime = now;

    const startTime = new Date(this.state.startTime).getTime();
    const endTime = new Date(this.state.endTime).getTime();
    const currentSimulatedTime = startTime + this.simulatedTimeOffset;

    // 限制在开始和结束时间之间
    if (currentSimulatedTime >= endTime) {
      this.state.currentTime = new Date(endTime).toISOString();
      this.pause();
      this.notifyTimeUpdate();
      this.notifyTimeEnd();
      return;
    }

    this.state.currentTime = new Date(currentSimulatedTime).toISOString();
    this.notifyTimeUpdate();

    // 继续下一帧
    this.animationFrameId = requestAnimationFrame(() => this.tick());
  }

  private notifyTimeUpdate(): void {
    this.timeUpdateCallbacks.forEach((callback) => {
      try {
        callback(this.state.currentTime);
      } catch (error) {
        console.error('Error in time update callback:', error);
      }
    });
  }

  private notifyTimeEnd(): void {
    this.timeEndCallbacks.forEach((callback) => {
      try {
        callback();
      } catch (error) {
        console.error('Error in time end callback:', error);
      }
    });
  }
}

