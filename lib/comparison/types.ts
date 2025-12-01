// 对比分析模块类型定义

import { UserAccount, UserTrade } from '@/types/trading';
import { PaulWeiTrade } from '@/types/paulWei';

export interface ComparisonMetrics {
  userReturn: number;
  paulWeiReturn: number;
  returnDiff: number;
  userTradeCount: number;
  paulWeiTradeCount: number;
  userAvgHoldTime: number; // 小时
  paulWeiAvgHoldTime: number;
  userMaxDrawdown: number;
  paulWeiMaxDrawdown: number;
  userCapitalUtilization: number; // 资金使用率
  paulWeiCapitalUtilization: number;
  userWinRate: number;
  paulWeiWinRate: number;
  userTotalFees: number;
  paulWeiTotalFees: number;
}

export interface ComparisonResult {
  winner: 'user' | 'paulWei' | 'tie';
  metrics: ComparisonMetrics;
  insights: string[];
}

export interface EquityCurvePoint {
  time: string;
  userEquity: number;
  paulWeiEquity: number;
}

export interface TradeTimelineItem {
  time: string;
  type: 'user' | 'paulWei';
  side: 'Buy' | 'Sell';
  price: number;
  quantity: number;
  pnl?: number;
}

export interface ComparisonAnalyzer {
  calculateMetrics(
    userAccount: UserAccount,
    paulWeiTrades: PaulWeiTrade[],
    currentPrice: number,
    initialBalance: number
  ): ComparisonMetrics;
  
  generateInsights(metrics: ComparisonMetrics): string[];
  
  getComparisonResult(
    userAccount: UserAccount,
    paulWeiTrades: PaulWeiTrade[],
    currentPrice: number,
    initialBalance: number
  ): ComparisonResult;
  
  generateEquityCurve(
    userTrades: UserTrade[],
    paulWeiTrades: PaulWeiTrade[],
    initialBalance: number
  ): EquityCurvePoint[];
  
  generateTradeTimeline(
    userTrades: UserTrade[],
    paulWeiTrades: PaulWeiTrade[]
  ): TradeTimelineItem[];
}
