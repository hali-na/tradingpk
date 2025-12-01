// 收益计算模块类型定义

import { UserAccount, UserTrade, UserPosition } from '@/types/trading';
import { PaulWeiTrade } from '@/types/paulWei';

export interface FeeRate {
  maker: number; // 0.025%
  taker: number; // 0.075%
}

export interface PnLSummary {
  realizedPnl: number;
  unrealizedPnl: number;
  totalPnl: number;
  totalFees: number;
  returnRate: number; // 收益率百分比
  equity: number;
}

export interface PaulWeiPnLSummary {
  totalPnl: number;
  totalFees: number;
  returnRate: number;
  tradeCount: number;
}

export interface PnLCalculator {
  // 用户收益计算
  calculateUserReturn(account: UserAccount, currentPrice: number): number;
  calculateUserEquity(account: UserAccount, currentPrice: number): number;
  calculateUnrealizedPnl(position: UserPosition, currentPrice: number): number;
  calculateRealizedPnl(trades: UserTrade[]): number;
  getUserPnLSummary(account: UserAccount, currentPrice: number): PnLSummary;
  
  // paul wei 收益计算
  calculatePaulWeiReturn(
    trades: PaulWeiTrade[],
    initialBalance: number
  ): number;
  getPaulWeiPnLSummary(
    trades: PaulWeiTrade[],
    initialBalance: number
  ): PaulWeiPnLSummary;
}

export interface FeeCalculator {
  calculateFee(
    quantity: number,
    price: number,
    orderType: 'Market' | 'Limit',
    feeRate: FeeRate
  ): number;
  getHistoricalFeeRate(time: string): FeeRate;
}

export interface MaxDrawdownCalculator {
  calculateMaxDrawdown(equityHistory: number[]): number;
  calculateDrawdownSeries(equityHistory: number[]): number[];
}
