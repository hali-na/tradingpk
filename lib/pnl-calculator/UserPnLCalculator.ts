// 用户收益计算器实现

import { UserAccount, UserTrade, UserPosition } from '@/types/trading';
import { PnLSummary } from './types';

export class UserPnLCalculator {
  calculateUserReturn(account: UserAccount, currentPrice: number): number {
    const equity = this.calculateUserEquity(account, currentPrice);
    return ((equity - account.initialBalance) / account.initialBalance) * 100;
  }

  calculateUserEquity(account: UserAccount, currentPrice: number): number {
    const unrealizedPnl = account.positions.reduce(
      (sum, pos) => sum + this.calculateUnrealizedPnl(pos, currentPrice),
      0
    );
    return account.balance + unrealizedPnl;
  }

  calculateUnrealizedPnl(position: UserPosition, currentPrice: number): number {
    // 与交易引擎保持一致的盈亏计算（反向永续合约近似公式）
    // Long:  quantity * (currentPrice - entryPrice) / entryPrice
    // Short: quantity * (entryPrice - currentPrice) / entryPrice
    const direction = position.side === 'Long' ? 1 : -1;
    const priceChange = currentPrice - position.entryPrice;
    const priceChangeRate = priceChange / position.entryPrice;
    return position.quantity * priceChangeRate * direction;
  }

  calculateRealizedPnl(trades: UserTrade[]): number {
    // 按交易对计算已实现盈亏
    // 这里简化处理，假设所有交易都是同一个交易对
    let realizedPnl = 0;
    const openTrades: UserTrade[] = [];

    for (const trade of trades) {
      if (trade.side === 'Buy') {
        openTrades.push(trade);
      } else {
        // 卖出时，与之前的买入匹配
        let remainingQty = trade.quantity;
        while (remainingQty > 0 && openTrades.length > 0) {
          const openTrade = openTrades[0];
          const matchQty = Math.min(remainingQty, openTrade.quantity);
          
          realizedPnl += (trade.price - openTrade.price) * matchQty;
          
          remainingQty -= matchQty;
          openTrade.quantity -= matchQty;
          
          if (openTrade.quantity <= 0) {
            openTrades.shift();
          }
        }
      }
    }

    return realizedPnl;
  }

  calculateTotalFees(trades: UserTrade[]): number {
    return trades.reduce((sum, trade) => sum + trade.fee, 0);
  }

  getUserPnLSummary(account: UserAccount, currentPrice: number): PnLSummary {
    const unrealizedPnl = account.positions.reduce(
      (sum, pos) => sum + this.calculateUnrealizedPnl(pos, currentPrice),
      0
    );
    
    const totalFees = this.calculateTotalFees(account.trades);
    const equity = account.balance + unrealizedPnl;
    
    // 已实现盈亏 = 当前余额 - 初始余额 + 总手续费
    const realizedPnl = account.balance - account.initialBalance + totalFees;
    
    const totalPnl = realizedPnl + unrealizedPnl;
    const returnRate = ((equity - account.initialBalance) / account.initialBalance) * 100;

    return {
      realizedPnl,
      unrealizedPnl,
      totalPnl,
      totalFees,
      returnRate,
      equity,
    };
  }
}
