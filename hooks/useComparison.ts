// 对比分析 Hook

import { useCallback, useMemo } from 'react';
import { useChallengeStore } from '@/stores/challengeStore';
import { useTradingStore } from '@/stores/tradingStore';
import { ComparisonAnalyzerImpl } from '@/lib/comparison/ComparisonAnalyzer';

const comparisonAnalyzer = new ComparisonAnalyzerImpl();

export function useComparison() {
  const { paulWeiTrades, comparisonMetrics, setComparisonMetrics } = useChallengeStore();
  const { account, currentPrice } = useTradingStore();

  // 更新对比指标
  const updateMetrics = useCallback(() => {
    if (!account || paulWeiTrades.length === 0) return;

    const metrics = comparisonAnalyzer.calculateMetrics(
      account,
      paulWeiTrades,
      currentPrice,
      account.initialBalance
    );

    setComparisonMetrics(metrics);
  }, [account, paulWeiTrades, currentPrice, setComparisonMetrics]);

  // 获取对比结果
  const getResult = useCallback(() => {
    if (!account || paulWeiTrades.length === 0) return null;

    return comparisonAnalyzer.getComparisonResult(
      account,
      paulWeiTrades,
      currentPrice,
      account.initialBalance
    );
  }, [account, paulWeiTrades, currentPrice]);

  // 生成分析洞察
  const insights = useMemo(() => {
    if (!comparisonMetrics) return [];
    return comparisonAnalyzer.generateInsights(comparisonMetrics);
  }, [comparisonMetrics]);

  // 生成交易时间线
  const tradeTimeline = useMemo(() => {
    if (!account) return [];
    return comparisonAnalyzer.generateTradeTimeline(account.trades, paulWeiTrades);
  }, [account, paulWeiTrades]);

  // 生成权益曲线
  const equityCurve = useMemo(() => {
    if (!account) return [];
    return comparisonAnalyzer.generateEquityCurve(
      account.trades,
      paulWeiTrades,
      account.initialBalance
    );
  }, [account, paulWeiTrades]);

  // 判断胜负
  const winner = useMemo(() => {
    if (!comparisonMetrics) return null;
    if (comparisonMetrics.returnDiff > 0.01) return 'user';
    if (comparisonMetrics.returnDiff < -0.01) return 'paulWei';
    return 'tie';
  }, [comparisonMetrics]);

  // 计算收益差距
  const returnDiff = useMemo(() => {
    if (!comparisonMetrics) return 0;
    return comparisonMetrics.returnDiff;
  }, [comparisonMetrics]);

  return {
    // State
    metrics: comparisonMetrics,
    insights,
    tradeTimeline,
    equityCurve,
    winner,
    returnDiff,

    // Actions
    updateMetrics,
    getResult,

    // Computed values
    userReturn: comparisonMetrics?.userReturn || 0,
    paulWeiReturn: comparisonMetrics?.paulWeiReturn || 0,
    userTradeCount: comparisonMetrics?.userTradeCount || 0,
    paulWeiTradeCount: comparisonMetrics?.paulWeiTradeCount || 0,
    userWinRate: comparisonMetrics?.userWinRate || 0,
    paulWeiWinRate: comparisonMetrics?.paulWeiWinRate || 0,
  };
}
