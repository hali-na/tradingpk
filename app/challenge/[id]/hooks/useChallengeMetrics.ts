// 挑战指标计算Hook

import { useEffect, useMemo, useRef, useState } from 'react';
import { useChallengeStore } from '@/stores/challengeStore';
import { useTradingStore } from '@/stores/tradingStore';
import { useTimeSimulation } from '@/hooks/useTimeSimulation';
import { getInitializedComparisonAnalyzer } from '@/lib/comparison';

/**
 * 挑战指标更新Hook
 * 负责更新对比指标（价格现在由K线图组件通过onPriceChange回调更新）
 */
export function useChallengeMetrics(isInitialized: boolean) {
  const {
    account,
    currentPrice,
  } = useTradingStore();

  const {
    ohlcvData,
    paulWeiTrades,
    setComparisonMetrics,
  } = useChallengeStore();

  const { currentTime } = useTimeSimulation();
  
  // 标记 analyzer 是否已初始化（wallet history 已加载）
  const [analyzerReady, setAnalyzerReady] = useState(false);
  
  // 初始化 analyzer（加载 wallet history）
  useEffect(() => {
    getInitializedComparisonAnalyzer().then(() => {
      setAnalyzerReady(true);
      console.log('[useChallengeMetrics] ComparisonAnalyzer initialized with wallet history');
    });
  }, []);

  // 使用useMemo缓存计算条件，避免不必要的重渲染
  const shouldUpdate = useMemo(() => {
    return isInitialized && account && ohlcvData && analyzerReady;
  }, [isInitialized, account, ohlcvData, analyzerReady]);

  // 指标更新节流定时器
  const metricsUpdateTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 过滤当前时间之前的Paul Wei交易（公平比赛，只看到当前时点的交易）
  const filteredPaulWeiTrades = useMemo(() => {
    if (!currentTime || !paulWeiTrades.length) return [];
    const currentTimeMs = new Date(currentTime).getTime();
    return paulWeiTrades.filter((trade) => {
      const tradeTime = new Date(trade.datetime).getTime();
      return tradeTime <= currentTimeMs;
    });
  }, [paulWeiTrades, currentTime]);

  // 更新对比指标
  useEffect(() => {
    // 只要有账户和基础数据，就更新对比指标；
    // 即使当前时间段内没有 PaulWei 交易，也可以进行对比（PaulWei 视为 0 表现）。
    if (!shouldUpdate || !account || currentPrice <= 0) return;

    // 清除之前的定时器
    if (metricsUpdateTimerRef.current) {
      clearTimeout(metricsUpdateTimerRef.current);
    }

    // 500ms 节流更新对比数据
    metricsUpdateTimerRef.current = setTimeout(async () => {
      const analyzer = await getInitializedComparisonAnalyzer();
      // 使用过滤后的交易数据，只计算到当前模拟时间的收益
      const metrics = analyzer.calculateMetrics(
        account,
        filteredPaulWeiTrades,
        currentPrice,
        account.initialBalance
      );
      setComparisonMetrics(metrics);
    }, 500);

    return () => {
      if (metricsUpdateTimerRef.current) {
        clearTimeout(metricsUpdateTimerRef.current);
      }
    };
  }, [currentTime, account, filteredPaulWeiTrades, shouldUpdate, currentPrice, setComparisonMetrics]);
}

