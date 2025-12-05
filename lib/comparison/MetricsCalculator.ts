// 指标计算器实现

import { UserTrade } from '@/types/trading';
import { PaulWeiTrade } from '@/types/paulWei';

export class MetricsCalculator {
  // 计算平均持仓时间（小时）
  calculateAvgHoldTime(trades: (UserTrade | PaulWeiTrade)[]): number {
    if (trades.length < 2) return 0;

    const sortedTrades = [...trades].sort((a, b) => {
      const timeA = 'timestamp' in a ? a.timestamp : a.datetime;
      const timeB = 'timestamp' in b ? b.timestamp : b.datetime;
      return new Date(timeA).getTime() - new Date(timeB).getTime();
    });

    let totalHoldTime = 0;
    let holdCount = 0;
    let openTime: number | null = null;

    for (const trade of sortedTrades) {
      const side = trade.side;
      const time = 'timestamp' in trade ? trade.timestamp : trade.datetime;
      const tradeTime = new Date(time).getTime();

      if (side === 'Buy' && openTime === null) {
        openTime = tradeTime;
      } else if (side === 'Sell' && openTime !== null) {
        totalHoldTime += tradeTime - openTime;
        holdCount++;
        openTime = null;
      }
    }

    if (holdCount === 0) return 0;
    return totalHoldTime / holdCount / (1000 * 60 * 60); // 转换为小时
  }

  // 计算胜率
  calculateWinRate(trades: (UserTrade | PaulWeiTrade)[]): number {
    if (trades.length < 2) return 0;

    let wins = 0;
    let totalTrades = 0;
    let entryPrice: number | null = null;

    const sortedTrades = [...trades].sort((a, b) => {
      const timeA = 'timestamp' in a ? a.timestamp : a.datetime;
      const timeB = 'timestamp' in b ? b.timestamp : b.datetime;
      return new Date(timeA).getTime() - new Date(timeB).getTime();
    });

    for (const trade of sortedTrades) {
      if (trade.side === 'Buy' && entryPrice === null) {
        entryPrice = trade.price;
      } else if (trade.side === 'Sell' && entryPrice !== null) {
        if (trade.price > entryPrice) {
          wins++;
        }
        totalTrades++;
        entryPrice = null;
      }
    }

    if (totalTrades === 0) return 0;
    return (wins / totalTrades) * 100;
  }

  // 计算资金使用率
  calculateCapitalUtilization(
    trades: (UserTrade | PaulWeiTrade)[],
    initialBalance: number
  ): number {
    if (trades.length === 0) return 0;

    let maxPositionValue = 0;

    for (const trade of trades) {
      const quantity = 'quantity' in trade ? trade.quantity : trade.amount;
      const positionValue = trade.price * quantity;
      if (positionValue > maxPositionValue) {
        maxPositionValue = positionValue;
      }
    }

    return (maxPositionValue / initialBalance) * 100;
  }

  // 计算总手续费
  calculateTotalFees(trades: (UserTrade | PaulWeiTrade)[]): number {
    return trades.reduce((sum, trade) => {
      const fee = 'fee' in trade ? trade.fee : trade.fee_cost;
      return sum + fee;
    }, 0);
  }

  // 计算盈亏比
  calculateProfitLossRatio(trades: (UserTrade | PaulWeiTrade)[]): number {
    let totalProfit = 0;
    let totalLoss = 0;
    let entryPrice: number | null = null;
    let entryQty: number = 0;

    const sortedTrades = [...trades].sort((a, b) => {
      const timeA = 'timestamp' in a ? a.timestamp : a.datetime;
      const timeB = 'timestamp' in b ? b.timestamp : b.datetime;
      return new Date(timeA).getTime() - new Date(timeB).getTime();
    });

    for (const trade of sortedTrades) {
      const quantity = 'quantity' in trade ? trade.quantity : trade.amount;

      if (trade.side === 'Buy' && entryPrice === null) {
        entryPrice = trade.price;
        entryQty = quantity;
      } else if (trade.side === 'Sell' && entryPrice !== null) {
        const pnl = (trade.price - entryPrice) * Math.min(quantity, entryQty);
        if (pnl > 0) {
          totalProfit += pnl;
        } else {
          totalLoss += Math.abs(pnl);
        }
        entryPrice = null;
        entryQty = 0;
      }
    }

    if (totalLoss === 0) return totalProfit > 0 ? Infinity : 0;
    return totalProfit / totalLoss;
  }
}
