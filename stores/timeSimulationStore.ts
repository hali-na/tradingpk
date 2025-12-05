// 时间模拟状态管理

import { create } from 'zustand';
import { TimeSimulationEngineImpl } from '@/lib/time-simulation/TimeSimulationEngine';
import { TimeSimulationState } from '@/lib/time-simulation/types';

interface TimeSimulationStore {
  engine: TimeSimulationEngineImpl | null;
  state: TimeSimulationState | null;
  
  // Actions
  initEngine: (startTime: string, endTime: string) => void;
  start: () => void;
  pause: () => void;
  resume: () => void;
  setSpeed: (speed: number) => void;
  jumpToTime: (time: string) => void;
  destroy: () => void;
  updateState: () => void;
}

export const useTimeSimulationStore = create<TimeSimulationStore>((set, get) => ({
  engine: null,
  state: null,

  initEngine: (startTime: string, endTime: string) => {
    const { engine: existingEngine } = get();
    if (existingEngine) {
      existingEngine.destroy();
    }

    const engine = new TimeSimulationEngineImpl(startTime, endTime);
    
    // 监听时间更新
    engine.onTimeUpdate(() => {
      get().updateState();
    });

    set({
      engine,
      state: engine.getState(),
    });
  },

  start: () => {
    const { engine } = get();
    if (engine) {
      engine.start();
      get().updateState();
    }
  },

  pause: () => {
    const { engine } = get();
    if (engine) {
      engine.pause();
      get().updateState();
    }
  },

  resume: () => {
    const { engine } = get();
    if (engine) {
      engine.resume();
      get().updateState();
    }
  },

  setSpeed: (speed: number) => {
    const { engine } = get();
    if (engine) {
      engine.setSpeed(speed);
      get().updateState();
    }
  },

  jumpToTime: (time: string) => {
    const { engine } = get();
    if (engine) {
      engine.jumpToTime(time);
      get().updateState();
    }
  },

  destroy: () => {
    const { engine } = get();
    if (engine) {
      engine.destroy();
    }
    set({ engine: null, state: null });
  },

  updateState: () => {
    const { engine } = get();
    if (engine) {
      set({ state: engine.getState() });
    }
  },
}));
