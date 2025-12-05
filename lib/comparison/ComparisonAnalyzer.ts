// 对比分析器实现

import { UserAccount, UserTrade } from '@/types/trading';
import { PaulWeiTrade } from '@/types/paulWei';
import { UserPnLCalculator } from '../pnl-calculator/UserPnLCalculator';
import { PaulWeiPnLCalculator } from '../pnl-calculator/PaulWeiPnLCalculator';
import { MaxDrawdownCalculatorImpl } from '../pnl-calculator/MaxDrawdownCalculator';
import { MetricsCalculator } from './MetricsCalculator';
import {
  ComparisonAnalyzer,
  ComparisonMetrics,
  ComparisonResult,
  EquityCurvePoint,
  TradeTimelineItem,
} from './types';

export class ComparisonAnalyzerImpl implements ComparisonAnalyzer {
  private userPnLCalc = new UserPnLCalculator();
  private paulWeiPnLCalc = new PaulWeiPnLCalculator();
  private maxDrawdownCalc = new MaxDrawdownCalculatorImpl();
  private metricsCalc = new MetricsCalculator();

  /**
   * 初始化分析器（加载 wallet history）
   */
  async initialize(): Promise<void> {
    await this.paulWeiPnLCalc.loadWalletHistory();
  }

  calculateMetrics(
    userAccount: UserAccount,
    paulWeiTrades: PaulWeiTrade[],
    currentPrice: number,
    initialBalance: number
  ): ComparisonMetrics {
    // 用户收益
    const userReturn = this.userPnLCalc.calculateUserReturn(userAccount, currentPrice);
    const userSummary = this.userPnLCalc.getUserPnLSummary(userAccount, currentPrice);

    // paul wei 收益
    const paulWeiSummary = this.paulWeiPnLCalc.getPaulWeiPnLSummary(
      paulWeiTrades,
      initialBalance
    );

    // 交易次数
    const userTradeCount = userAccount.trades.length;
    const paulWeiTradeCount = paulWeiTrades.length;

    // 平均持仓时间
    const userAvgHoldTime = this.metricsCalc.calculateAvgHoldTime(userAccount.trades);
    const paulWeiAvgHoldTime = this.metricsCalc.calculateAvgHoldTime(paulWeiTrades);

    // 胜率
    const userWinRate = this.metricsCalc.calculateWinRate(userAccount.trades);
    const paulWeiWinRate = this.metricsCalc.calculateWinRate(paulWeiTrades);

    // 资金使用率
    const userCapitalUtilization = this.metricsCalc.calculateCapitalUtilization(
      userAccount.trades,
      initialBalance
    );
    const paulWeiCapitalUtilization = this.metricsCalc.calculateCapitalUtilization(
      paulWeiTrades,
      initialBalance
    );

    return {
      userReturn,
      paulWeiReturn: paulWeiSummary.returnRate,
      returnDiff: userReturn - paulWeiSummary.returnRate,
      userTradeCount,
      paulWeiTradeCount,
      userAvgHoldTime,
      paulWeiAvgHoldTime,
      userMaxDrawdown: 0, // 需要权益曲线数据
      paulWeiMaxDrawdown: 0,
      userCapitalUtilization,
      paulWeiCapitalUtilization,
      userWinRate,
      paulWeiWinRate,
      userTotalFees: userSummary.totalFees,
      paulWeiTotalFees: paulWeiSummary.totalFees,
    };
  }

  generateInsights(metrics: ComparisonMetrics): string[] {
    const insights: string[] = [];

    // 收益对比
    if (metrics.returnDiff > 0) {
      insights.push(`你的收益率比 paul wei 高 ${metrics.returnDiff.toFixed(2)}%，表现出色！`);
    } else if (metrics.returnDiff < 0) {
      insights.push(`paul wei 的收益率比你高 ${Math.abs(metrics.returnDiff).toFixed(2)}%，继续加油！`);
    } else {
      insights.push('你和 paul wei 的收益率持平！');
    }

    // 交易频率分析
    if (metrics.userTradeCount > metrics.paulWeiTradeCount * 2) {
      insights.push('你的交易频率较高，建议减少交易次数以降低手续费成本。');
    } else if (metrics.userTradeCount < metrics.paulWeiTradeCount / 2) {
      insights.push('你的交易频率较低，可能错过了一些交易机会。');
    }

    // 持仓时间分析
    if (metrics.userAvgHoldTime < metrics.paulWeiAvgHoldTime / 2) {
      insights.push('你的持仓时间较短，paul wei 更倾向于趋势交易。');
    } else if (metrics.userAvgHoldTime > metrics.paulWeiAvgHoldTime * 2) {
      insights.push('你的持仓时间较长，注意控制风险。');
    }

    // 资金使用率分析
    if (metrics.userCapitalUtilization > 80) {
      insights.push('你的资金使用率很高，风险较大，建议适当降低仓位。');
    }

    // 胜率分析
    if (metrics.userWinRate > metrics.paulWeiWinRate) {
      insights.push(`你的胜率 (${metrics.userWinRate.toFixed(1)}%) 高于 paul wei，交易决策不错！`);
    }

    // 手续费分析
    const feeRatio = metrics.userTotalFees / (metrics.userReturn || 1);
    if (feeRatio > 0.1) {
      insights.push('手续费占收益比例较高，考虑使用更多限价单。');
    }

    return insights;
  }

  getComparisonResult(
    userAccount: UserAccount,
    paulWeiTrades: PaulWeiTrade[],
    currentPrice: number,
    initialBalance: number
  ): ComparisonResult {
    const metrics = this.calculateMetrics(
      userAccount,
      paulWeiTrades,
      currentPrice,
      initialBalance
    );

    const insights = this.generateInsights(metrics);

    let winner: 'user' | 'paulWei' | 'tie';
    if (metrics.returnDiff > 0.01) {
      winner = 'user';
    } else if (metrics.returnDiff < -0.01) {
      winner = 'paulWei';
    } else {
      winner = 'tie';
    }

    return { winner, metrics, insights };
  }

  generateEquityCurve(
    userTrades: UserTrade[],
    paulWeiTrades: PaulWeiTrade[],
    initialBalance: number
  ): EquityCurvePoint[] {
    const points: EquityCurvePoint[] = [];
    
    // 合并并排序所有交易时间点
    const allTimes = new Set<string>();
    userTrades.forEach((t) => allTimes.add(t.timestamp));
    paulWeiTrades.forEach((t) => allTimes.add(t.datetime));

    const sortedTimes = Array.from(allTimes).sort(
      (a, b) => new Date(a).getTime() - new Date(b).getTime()
    );

    let userEquity = initialBalance;
    let paulWeiEquity = initialBalance;
    let userIdx = 0;
    let paulWeiIdx = 0;

    // 初始点
    if (sortedTimes.length > 0) {
      points.push({
        time: sortedTimes[0],
        userEquity: initialBalance,
        paulWeiEquity: initialBalance,
      });
    }

    for (const time of sortedTimes) {
      // 更新用户权益
      while (userIdx < userTrades.length && userTrades[userIdx].timestamp <= time) {
        // 简化：这里需要更复杂的逻辑来追踪权益变化
        userIdx++;
      }

      // 更新 paul wei 权益
      while (paulWeiIdx < paulWeiTrades.length && paulWeiTrades[paulWeiIdx].datetime <= time) {
        paulWeiIdx++;
      }

      points.push({ time, userEquity, paulWeiEquity });
    }

    return points;
  }

  generateTradeTimeline(
    userTrades: UserTrade[],
    paulWeiTrades: PaulWeiTrade[]
  ): TradeTimelineItem[] {
    const timeline: TradeTimelineItem[] = [];

    // 添加用户交易
    for (const trade of userTrades) {
      timeline.push({
        time: trade.timestamp,
        type: 'user',
        side: trade.side,
        price: trade.price,
        quantity: trade.quantity,
      });
    }

    // 添加 paul wei 交易
    for (const trade of paulWeiTrades) {
      timeline.push({
        time: trade.datetime,
        type: 'paulWei',
        side: trade.side,
        price: trade.price,
        quantity: trade.amount,
      });
    }

    // 按时间排序
    timeline.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());

    return timeline;
  }
}
