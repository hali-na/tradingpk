// paul wei 收益计算器实现

import { PaulWeiTrade } from '@/types/paulWei';
import { PaulWeiPnLSummary } from './types';

interface WalletHistoryEntry {
  transactID: string;
  account: string;
  currency: string;
  transactType: string;
  amount: number;
  fee: number;
  timestamp: string;
  walletBalance: number;
  marginBalance?: number;
}

export class PaulWeiPnLCalculator {
  private walletHistory: WalletHistoryEntry[] | null = null;
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

  // 加载 wallet history
  async loadWalletHistory(): Promise<void> {
    if (this.walletHistory !== null) {
      return; // 已经加载过
    }

    try {
      const response = await fetch('/bitmex_paulwei/bitmex_wallet_history.csv');
      if (!response.ok) {
        console.warn('Failed to load wallet history');
        this.walletHistory = [];
        return;
      }

      const csvText = await response.text();
      const lines = csvText.trim().split('\n');
      if (lines.length < 2) {
        this.walletHistory = [];
        return;
      }

      this.walletHistory = [];
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const values = line.split(',');
        if (values.length < 12) continue;

        // CSV 字段顺序：transactID,account,currency,transactType,amount,fee,transactStatus,address,tx,text,timestamp,walletBalance,marginBalance
        // XBt 需要转换为 USD (1 XBt = 1 satoshi = 0.00000001 BTC)
        // walletBalance 是 satoshi 单位，需要乘以 BTC 价格转换为 USD
        const timestamp = values[10] || '';
        const walletBalance = parseFloat(values[11]) || 0;
        const marginBalance = values[12] ? parseFloat(values[12]) : undefined;

        this.walletHistory.push({
          transactID: values[0] || '',
          account: values[1] || '',
          currency: values[2] || '',
          transactType: values[3] || '',
          amount: parseFloat(values[4]) || 0,
          fee: parseFloat(values[5]) || 0,
          timestamp,
          walletBalance,
          marginBalance,
        });
      }

      // 按时间排序
      this.walletHistory.sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );

      console.log(`[PaulWeiPnLCalculator] Loaded ${this.walletHistory.length} wallet history entries`);
    } catch (error) {
      console.error('Error loading wallet history:', error);
      this.walletHistory = [];
    }
  }

  // 检查是否已加载 wallet history
  hasWalletHistory(): boolean {
    return this.walletHistory !== null && this.walletHistory.length > 0;
  }

  // 获取指定时间点的初始本金（USD）
  // XBt 需要转换为 USD：walletBalance (satoshi) * BTC价格 / 100000000
  getInitialCapitalAt(timestamp: string, btcPrice: number): number {
    if (!this.walletHistory || this.walletHistory.length === 0) {
      // 如果没有 wallet history，返回默认值
      return 10000;
    }

    const targetTime = new Date(timestamp).getTime();
    
    // 找到最接近但不超过目标时间的记录
    let closestEntry: WalletHistoryEntry | null = null;
    for (const entry of this.walletHistory) {
      const entryTime = new Date(entry.timestamp).getTime();
      if (entryTime <= targetTime) {
        closestEntry = entry;
      } else {
        break;
      }
    }

    if (!closestEntry) {
      // 如果找不到，使用第一条记录
      closestEntry = this.walletHistory[0];
    }

    // 将 XBt (satoshi) 转换为 USD
    // 1 XBt = 1 satoshi = 0.00000001 BTC
    const btcAmount = closestEntry.walletBalance / 100000000;
    const usdAmount = btcAmount * btcPrice;

    return Math.max(usdAmount, 1000); // 至少返回 1000 USD
  }

  // 从 wallet history 计算指定时间段的收益
  calculateFromWalletHistory(
    startTime: string,
    endTime: string,
    endPrice: number
  ): PaulWeiPnLSummary {
    if (!this.walletHistory || this.walletHistory.length === 0) {
      return {
        totalPnl: 0,
        totalFees: 0,
        returnRate: 0,
        tradeCount: 0,
      };
    }

    const start = new Date(startTime).getTime();
    const end = new Date(endTime).getTime();

    // 找到开始时间的余额
    let startBalance = 0;
    let startEntry: WalletHistoryEntry | null = null;
    for (const entry of this.walletHistory) {
      const entryTime = new Date(entry.timestamp).getTime();
      if (entryTime <= start) {
        startEntry = entry;
      } else {
        break;
      }
    }

    // 找到结束时间的余额
    let endBalance = 0;
    let endEntry: WalletHistoryEntry | null = null;
    for (const entry of this.walletHistory) {
      const entryTime = new Date(entry.timestamp).getTime();
      if (entryTime <= end) {
        endEntry = entry;
      } else {
        break;
      }
    }

    // 计算开始时的 USD 余额
    if (startEntry) {
      const startBtcAmount = startEntry.walletBalance / 100000000;
      startBalance = startBtcAmount * endPrice; // 使用结束价格作为参考
    }

    // 计算结束时的 USD 余额
    if (endEntry) {
      const endBtcAmount = endEntry.walletBalance / 100000000;
      endBalance = endBtcAmount * endPrice;
    }

    // 计算总盈亏
    const totalPnl = endBalance - startBalance;

    // 计算该时间段内的手续费（只统计 RealisedPNL 和 Funding 类型的手续费）
    let totalFees = 0;
    for (const entry of this.walletHistory) {
      const entryTime = new Date(entry.timestamp).getTime();
      if (entryTime >= start && entryTime <= end) {
        if (entry.transactType === 'RealisedPNL' || entry.transactType === 'Funding') {
          // fee 是 XBt，需要转换为 USD
          const feeBtc = Math.abs(entry.fee) / 100000000;
          totalFees += feeBtc * endPrice;
        }
      }
    }

    const netPnl = totalPnl - totalFees;
    const returnRate = startBalance > 0 ? (netPnl / startBalance) * 100 : 0;

    // 估算交易次数（基于 RealisedPNL 记录数）
    const tradeCount = this.walletHistory.filter(
      (entry) => {
        const entryTime = new Date(entry.timestamp).getTime();
        return (
          entryTime >= start &&
          entryTime <= end &&
          entry.transactType === 'RealisedPNL'
        );
      }
    ).length;

    return {
      totalPnl: netPnl,
      totalFees,
      returnRate,
      tradeCount,
    };
  }
}
