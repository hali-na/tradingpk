// 时间模拟 Hook

import { useCallback, useEffect } from 'react';
import { useTimeSimulationStore } from '@/stores/timeSimulationStore';
import { useTradingStore } from '@/stores/tradingStore';
import { useChallengeStore } from '@/stores/challengeStore';

export function useTimeSimulation() {
  const {
    engine,
    state,
    initEngine,
    start,
    pause,
    resume,
    setSpeed,
    jumpToTime,
    destroy,
  } = useTimeSimulationStore();

  const { checkOrderTriggers, updateCurrentPrice } = useTradingStore();
  const { getCurrentOHLCV, currentTimeframe } = useChallengeStore();

  // 根据当前模拟时间获取价格
  const getCurrentPrice = useCallback(() => {
    if (!state) return 0;
    
    const ohlcv = getCurrentOHLCV();
    const currentTime = new Date(state.currentTime).getTime();
    
    // 找到当前时间对应的 K 线
    for (let i = ohlcv.length - 1; i >= 0; i--) {
      const candleTime = new Date(ohlcv[i].timestamp).getTime();
      if (candleTime <= currentTime) {
        return ohlcv[i].close;
      }
    }
    
    return ohlcv[0]?.close || 0;
  }, [state, getCurrentOHLCV]);

  // 时间更新时的处理
  useEffect(() => {
    if (!engine || !state) return;

    const price = getCurrentPrice();
    if (price > 0) {
      updateCurrentPrice(price);
      checkOrderTriggers(state.currentTime);
    }
  }, [state?.currentTime, engine, getCurrentPrice, updateCurrentPrice, checkOrderTriggers]);

  // 计算剩余时间
  const getRemainingTime = useCallback(() => {
    if (!state) return 0;
    const current = new Date(state.currentTime).getTime();
    const end = new Date(state.endTime).getTime();
    return Math.max(0, end - current);
  }, [state]);

  // 计算进度百分比
  const getProgress = useCallback(() => {
    if (!state) return 0;
    const start = new Date(state.startTime).getTime();
    const current = new Date(state.currentTime).getTime();
    const end = new Date(state.endTime).getTime();
    const total = end - start;
    if (total === 0) return 100;
    return Math.min(100, ((current - start) / total) * 100);
  }, [state]);

  // 格式化剩余时间
  const formatRemainingTime = useCallback(() => {
    const remaining = getRemainingTime();
    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
  }, [getRemainingTime]);

  return {
    // State
    currentTime: state?.currentTime || '',
    speed: state?.speed || 1,
    isPaused: state?.isPaused ?? true,
    startTime: state?.startTime || '',
    endTime: state?.endTime || '',
    isInitialized: !!engine,
    
    // Actions
    initEngine,
    start,
    pause,
    resume,
    setSpeed,
    jumpToTime,
    destroy,
    
    // Computed
    getCurrentPrice,
    getRemainingTime,
    getProgress,
    formatRemainingTime,
  };
}
