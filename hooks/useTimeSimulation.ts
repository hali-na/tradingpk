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

  const { checkOrderTriggers, currentPrice } = useTradingStore();

  // 当前价格现在由K线图组件通过onPriceChange回调更新（单一数据源）
  // 这里只需要在时间变化时检查订单触发
  useEffect(() => {
    if (!engine || !state) return;

    // 价格由K线图组件更新，这里只检查订单触发
    if (currentPrice > 0) {
      checkOrderTriggers(state.currentTime);
    }
  }, [state?.currentTime, engine, currentPrice, checkOrderTriggers]);

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
    getRemainingTime,
    getProgress,
    formatRemainingTime,
  };
}
