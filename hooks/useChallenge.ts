// 挑战 Hook

import { useCallback, useState } from 'react';
import { Symbol } from '@/types/common';
import { useChallengeStore } from '@/stores/challengeStore';
import { useTimeSimulation } from './useTimeSimulation';
import { useTrading } from './useTrading';
import { ChallengeManagerImpl } from '@/lib/challenge-manager/ChallengeManager';
import { ComparisonAnalyzerImpl } from '@/lib/comparison/ComparisonAnalyzer';

const challengeManager = new ChallengeManagerImpl();
const comparisonAnalyzer = new ComparisonAnalyzerImpl();

export function useChallenge() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    currentChallenge,
    challengeResult,
    paulWeiTrades,
    ohlcvData,
    currentTimeframe,
    comparisonMetrics,
    challengeHistory,
    setCurrentChallenge,
    setChallengeResult,
    setCurrentTimeframe,
    setComparisonMetrics,
    loadChallengeHistory,
    clearCurrentChallenge,
    getCurrentOHLCV,
    getPaulWeiTradesInRange,
  } = useChallengeStore();

  const { initEngine, destroy: destroyTimeEngine } = useTimeSimulation();
  const { initTrading, reset: resetTrading, account } = useTrading();

  // 创建挑战
  const createChallenge = useCallback(
    async (startTime: string, endTime: string, symbol: Symbol) => {
      setIsLoading(true);
      setError(null);

      try {
        const challenge = await challengeManager.createChallenge({
          startTime,
          endTime,
          symbol,
          initialBalance: 10000,
        });

        setCurrentChallenge(challenge);
        return challenge;
      } catch (err) {
        const message = err instanceof Error ? err.message : '创建挑战失败';
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [setCurrentChallenge]
  );

  // 开始挑战
  const startChallenge = useCallback(() => {
    if (!currentChallenge) {
      setError('没有待开始的挑战');
      return;
    }

    try {
      challengeManager.startChallenge(currentChallenge.id);
      
      // 初始化时间模拟引擎
      initEngine(currentChallenge.startTime, currentChallenge.endTime);
      
      // 初始化交易引擎
      initTrading(currentChallenge.id, 10000);

      // 更新挑战状态
      const updatedChallenge = challengeManager.getChallenge(currentChallenge.id);
      if (updatedChallenge) {
        setCurrentChallenge(updatedChallenge);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : '开始挑战失败';
      setError(message);
    }
  }, [currentChallenge, initEngine, initTrading, setCurrentChallenge]);

  // 结束挑战
  const endChallenge = useCallback(
    (currentPrice: number) => {
      if (!currentChallenge) {
        setError('没有进行中的挑战');
        return null;
      }

      try {
        // 更新用户账户到挑战管理器
        if (account) {
          const challenge = challengeManager.getChallenge(currentChallenge.id);
          if (challenge) {
            challenge.userAccount = account;
            challengeManager.updateChallenge(challenge);
          }
        }

        const result = challengeManager.endChallenge(currentChallenge.id, currentPrice);
        setChallengeResult(result);
        
        // 清理
        destroyTimeEngine();
        resetTrading();

        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : '结束挑战失败';
        setError(message);
        return null;
      }
    },
    [currentChallenge, account, setChallengeResult, destroyTimeEngine, resetTrading]
  );

  // 更新对比数据
  const updateComparison = useCallback(
    (currentPrice: number) => {
      if (!currentChallenge || !account) return;

      const metrics = comparisonAnalyzer.calculateMetrics(
        account,
        paulWeiTrades,
        currentPrice,
        account.initialBalance
      );

      setComparisonMetrics(metrics);
    },
    [currentChallenge, account, paulWeiTrades, setComparisonMetrics]
  );

  // 获取对比结果
  const getComparisonResult = useCallback(
    (currentPrice: number) => {
      if (!currentChallenge || !account) return null;

      return comparisonAnalyzer.getComparisonResult(
        account,
        paulWeiTrades,
        currentPrice,
        account.initialBalance
      );
    },
    [currentChallenge, account, paulWeiTrades]
  );

  // 放弃挑战
  const abandonChallenge = useCallback(() => {
    destroyTimeEngine();
    resetTrading();
    clearCurrentChallenge();
    setError(null);
  }, [destroyTimeEngine, resetTrading, clearCurrentChallenge]);

  return {
    // State
    currentChallenge,
    challengeResult,
    paulWeiTrades,
    ohlcvData,
    currentTimeframe,
    comparisonMetrics,
    challengeHistory,
    isLoading,
    error,

    // Actions
    createChallenge,
    startChallenge,
    endChallenge,
    updateComparison,
    getComparisonResult,
    abandonChallenge,
    setCurrentTimeframe,
    loadChallengeHistory,
    clearError: () => setError(null),

    // Getters
    getCurrentOHLCV,
    getPaulWeiTradesInRange,
    isActive: currentChallenge?.status === 'active',
    isCompleted: currentChallenge?.status === 'completed',
  };
}
