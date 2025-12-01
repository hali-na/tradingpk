// paul wei 收益计算器实现

import { PaulWeiTrade } from '@/types/paulWei';
import { PaulWeiPnLSummary } from './types';

export class PaulWeiPnLCalculator {
  calculatePaulWeiReturn(
    trades: PaulWeiTrade[],
    initialBalance: number
  ): number {
    const summary = this.getPaulWeiPnLSummary(trades, initialBalance);
    return summary.returnRate;
  }

  getPaulWeiPnLSummary(
    trades: PaulWeiTrade[],
    initialBalance: number
  ): PaulWeiPnLSummary {
    if (trades.length === 0) {
      return {
        totalPnl: 0,
        totalFees: 0,
        returnRate: 0,
        tradeCount: 0,
      };
    }

    // 计算总盈亏和手续费
    let totalPnl = 0;
    let totalFees = 0;
    const openPositions: Map<string, { side: 'Buy' | 'Sell'; price: number; amount: number }[]> = new Map();

    for (const trade of trades) {
      totalFees += trade.fee_cost;

      const symbol = trade.symbol;
      if (!openPositions.has(symbol)) {
        openPositions.set(symbol, []);
      }

      const positions = openPositions.get(symbol)!;

      if (trade.side === 'Buy') {
        // 检查是否有空头持仓需要平仓
        const shortPositions = positions.filter((p) => p.side === 'Sell');
        let remainingQty = trade.amount;

        for (const pos of shortPositions) {
          if (remainingQty <= 0) break;

          const matchQty = Math.min(remainingQty, pos.amount);
          // 空头平仓盈亏 = (开仓价 - 平仓价) * 数量
          totalPnl += (pos.price - trade.price) * matchQty;

          remainingQty -= matchQty;
          pos.amount -= matchQty;
        }

        // 移除已平仓的持仓
        const remaining = positions.filter((p) => p.amount > 0);
        openPositions.set(symbol, remaining);

        // 如果还有剩余，开多头仓位
        if (remainingQty > 0) {
          positions.push({ side: 'Buy', price: trade.price, amount: remainingQty });
        }
      } else {
        // 检查是否有多头持仓需要平仓
        const longPositions = positions.filter((p) => p.side === 'Buy');
        let remainingQty = trade.amount;

        for (const pos of longPositions) {
          if (remainingQty <= 0) break;

          const matchQty = Math.min(remainingQty, pos.amount);
          // 多头平仓盈亏 = (平仓价 - 开仓价) * 数量
          totalPnl += (trade.price - pos.price) * matchQty;

          remainingQty -= matchQty;
          pos.amount -= matchQty;
        }

        // 移除已平仓的持仓
        const remaining = positions.filter((p) => p.amount > 0);
        openPositions.set(symbol, remaining);

        // 如果还有剩余，开空头仓位
        if (remainingQty > 0) {
          positions.push({ side: 'Sell', price: trade.price, amount: remainingQty });
        }
      }
    }

    // 扣除手续费
    const netPnl = totalPnl - totalFees;
    const returnRate = (netPnl / initialBalance) * 100;

    return {
      totalPnl: netPnl,
      totalFees,
      returnRate,
      tradeCount: trades.length,
    };
  }

  // 计算特定时间段内的收益
  calculateReturnInPeriod(
    trades: PaulWeiTrade[],
    startTime: string,
    endTime: string,
    initialBalance: number
  ): number {
    const filteredTrades = trades.filter((trade) => {
      const tradeTime = new Date(trade.datetime).getTime();
      const start = new Date(startTime).getTime();
      const end = new Date(endTime).getTime();
      return tradeTime >= start && tradeTime <= end;
    });

    return this.calculatePaulWeiReturn(filteredTrades, initialBalance);
  }
}
