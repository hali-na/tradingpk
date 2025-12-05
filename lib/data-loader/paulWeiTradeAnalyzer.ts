/**
 * Paul Wei 交易分析器
 * 分析他的交易记录，重建平仓盈亏
 */

import { Symbol } from '@/types/common';

export interface PaulWeiTrade {
  id: string;
  datetime: string;
  symbol: string;
  side: 'buy' | 'sell' | 'unknown';
  price: number;
  amount: number;
  cost: number;
  fee: number;
  isClose: boolean; // 是否是平仓
}

export interface PaulWeiRoundTrip {
  id: string;
  symbol: string;
  direction: 'long' | 'short';
  entryTime: string;
  exitTime: string;
  entryPrice: number;
  exitPrice: number;
  quantity: number; // 合约张数 = USD 名义价值
  pnl: number; // 盈亏（USD）
  pnlPercent: number;
  feesBTC: number; // 手续费（BTC）
  feesUSD: number; // 手续费（USD，按出场价换算）
  duration: number; // 持仓时间（毫秒）
  entryTrades: PaulWeiTrade[];
  exitTrades: PaulWeiTrade[];
}

export interface PaulWeiOrderStyle {
  hasStopLoss: boolean;
  ladderOrderCount: number;
  avgPriceStep: number;
  avgOrderSize: number;
  orderDistribution: 'equal' | 'pyramid' | 'mixed';
}

export class PaulWeiTradeAnalyzer {
  private trades: PaulWeiTrade[] = [];
  private loaded = false;

  async loadTrades(): Promise<void> {
    if (this.loaded) return;

    try {
      const response = await fetch('/api/paulwei/trades');
      if (!response.ok) {
        // 如果 API 不存在，尝试直接加载 CSV
        await this.loadFromCSV();
        return;
      }
      const data = await response.json();
      this.trades = data.trades;
      this.loaded = true;
    } catch {
      await this.loadFromCSV();
    }
  }

  private async loadFromCSV(): Promise<void> {
    try {
      const response = await fetch('/bitmex_paulwei/bitmex_trades.csv');
      const text = await response.text();
      this.trades = this.parseTradesCSV(text);
      this.loaded = true;
    } catch (error) {
      console.error('Failed to load Paul Wei trades:', error);
      this.trades = [];
      this.loaded = true;
    }
  }

  private parseTradesCSV(csv: string): PaulWeiTrade[] {
    const lines = csv.trim().split('\n');
    if (lines.length < 2) return [];

    const trades: PaulWeiTrade[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      // CSV 解析，处理引号内的逗号
      const values = this.parseCSVLine(line);
      if (values.length < 10) continue;

      const [id, datetime, symbol, side, price, amount, cost, fee_cost] = values;
      
      trades.push({
        id,
        datetime,
        symbol: this.normalizeSymbol(symbol),
        side: side.toLowerCase() as 'buy' | 'sell' | 'unknown',
        price: parseFloat(price) || 0,
        amount: parseFloat(amount) || 0,
        cost: parseFloat(cost) || 0,
        fee: parseFloat(fee_cost) || 0,
        isClose: false, // 稍后通过上下文判断
      });
    }

    return trades;
  }

  private parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (const char of line) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  }

  private normalizeSymbol(symbol: string): string {
    // BTC/USD:BTC -> XBTUSD
    if (symbol.includes('BTC/USD')) return 'XBTUSD';
    if (symbol.includes('ETH/USD')) return 'ETHUSD';
    return symbol;
  }

  /**
   * 获取指定时间范围内的交易
   */
  getTradesInRange(startTime: string, endTime: string, symbol?: Symbol): PaulWeiTrade[] {
    const start = new Date(startTime).getTime();
    const end = new Date(endTime).getTime();

    return this.trades.filter(trade => {
      const time = new Date(trade.datetime).getTime();
      const inRange = time >= start && time <= end;
      const matchSymbol = !symbol || trade.symbol === symbol;
      return inRange && matchSymbol;
    });
  }

  /**
   * 分析交易，重建完整的开平仓记录
   * 
   * BitMEX XBTUSD 是反向合约：
   * - 1 张合约 = 1 USD 名义价值
   * - 保证金和盈亏以 BTC 计价
   * - 手续费以聪 (Satoshi) 为单位，需要除以 1e8 转换为 BTC
   * 
   * 盈亏公式（BTC）：
   * - 做多: 合约数量 × (1/入场价 - 1/出场价)
   * - 做空: 合约数量 × (1/出场价 - 1/入场价)
   */
  analyzeRoundTrips(startTime: string, endTime: string, symbol: Symbol): PaulWeiRoundTrip[] {
    const trades = this.getTradesInRange(startTime, endTime, symbol);
    const roundTrips: PaulWeiRoundTrip[] = [];
    
    let position = 0; // 当前持仓（合约张数）
    let entryTrades: PaulWeiTrade[] = [];
    let avgEntryPrice = 0;
    let entryTime = '';
    let direction: 'long' | 'short' = 'long';
    let totalFeesSatoshi = 0; // 手续费（聪）

    for (const trade of trades) {
      if (trade.side === 'unknown') continue;

      const qty = trade.side === 'buy' ? trade.amount : -trade.amount;
      const newPosition = position + qty;

      // 开仓
      if (position === 0 || Math.sign(newPosition) === Math.sign(position)) {
        if (position === 0) {
          entryTime = trade.datetime;
          direction = qty > 0 ? 'long' : 'short';
          entryTrades = [];
          totalFeesSatoshi = 0;
        }
        entryTrades.push(trade);
        
        // 计算加权平均入场价
        const totalQty = entryTrades.reduce((sum, t) => sum + t.amount, 0);
        avgEntryPrice = entryTrades.reduce((sum, t) => sum + t.price * t.amount, 0) / totalQty;
        totalFeesSatoshi += Math.abs(trade.fee);
      }
      // 平仓或反向
      else {
        const closeQty = Math.min(Math.abs(position), Math.abs(qty));
        totalFeesSatoshi += Math.abs(trade.fee);

        // BitMEX 反向合约盈亏计算（BTC）
        const pnlBTC = direction === 'long'
          ? closeQty * (1 / avgEntryPrice - 1 / trade.price)
          : closeQty * (1 / trade.price - 1 / avgEntryPrice);
        
        // 转换为 USD（按出场价）
        const pnlUSD = pnlBTC * trade.price;
        
        // 盈亏百分比（基于入场价值）
        const entryValueBTC = closeQty / avgEntryPrice;
        const pnlPercent = (pnlBTC / entryValueBTC) * 100;

        // 手续费转换
        const feesBTC = totalFeesSatoshi / 1e8;
        const feesUSD = feesBTC * trade.price;

        roundTrips.push({
          id: `${entryTime}-${trade.datetime}`,
          symbol,
          direction,
          entryTime,
          exitTime: trade.datetime,
          entryPrice: avgEntryPrice,
          exitPrice: trade.price,
          quantity: closeQty,
          pnl: pnlUSD,
          pnlPercent,
          feesBTC,
          feesUSD,
          duration: new Date(trade.datetime).getTime() - new Date(entryTime).getTime(),
          entryTrades: [...entryTrades],
          exitTrades: [trade],
        });

        // 如果完全平仓
        if (Math.abs(newPosition) < Math.abs(position)) {
          entryTrades = [];
          totalFeesSatoshi = 0;
        }
      }

      position = newPosition;
    }

    return roundTrips;
  }

  /**
   * 分析下单风格
   */
  analyzeOrderStyle(startTime: string, endTime: string, symbol: Symbol): PaulWeiOrderStyle {
    const trades = this.getTradesInRange(startTime, endTime, symbol);
    
    // 按时间分组，找出同一秒内的订单
    const timeGroups = new Map<string, PaulWeiTrade[]>();
    for (const trade of trades) {
      const timeKey = trade.datetime.slice(0, 19); // 精确到秒
      if (!timeGroups.has(timeKey)) {
        timeGroups.set(timeKey, []);
      }
      timeGroups.get(timeKey)!.push(trade);
    }

    // 分析阶梯订单
    let ladderCount = 0;
    let totalPriceSteps: number[] = [];
    let orderSizes: number[] = [];

    for (const [, group] of timeGroups) {
      if (group.length >= 3) {
        ladderCount++;
        
        // 计算价差
        const prices = group.map(t => t.price).sort((a, b) => a - b);
        for (let i = 1; i < prices.length; i++) {
          totalPriceSteps.push(prices[i] - prices[i - 1]);
        }
        
        // 记录订单大小
        group.forEach(t => orderSizes.push(t.amount));
      }
    }

    // 判断分配方式
    let distribution: 'equal' | 'pyramid' | 'mixed' = 'mixed';
    if (orderSizes.length > 0) {
      const avgSize = orderSizes.reduce((a, b) => a + b, 0) / orderSizes.length;
      const variance = orderSizes.reduce((sum, s) => sum + Math.pow(s - avgSize, 2), 0) / orderSizes.length;
      const stdDev = Math.sqrt(variance);
      
      if (stdDev / avgSize < 0.1) {
        distribution = 'equal';
      } else if (stdDev / avgSize > 0.3) {
        distribution = 'pyramid';
      }
    }

    return {
      hasStopLoss: false, // 2020年5月数据中没有止损
      ladderOrderCount: ladderCount,
      avgPriceStep: totalPriceSteps.length > 0 
        ? totalPriceSteps.reduce((a, b) => a + b, 0) / totalPriceSteps.length 
        : 0,
      avgOrderSize: orderSizes.length > 0 
        ? orderSizes.reduce((a, b) => a + b, 0) / orderSizes.length 
        : 0,
      orderDistribution: distribution,
    };
  }

  /**
   * 获取交易统计
   */
  getTradeStats(startTime: string, endTime: string, symbol: Symbol) {
    const roundTrips = this.analyzeRoundTrips(startTime, endTime, symbol);
    
    const wins = roundTrips.filter(rt => rt.pnl > 0);
    const losses = roundTrips.filter(rt => rt.pnl < 0);
    
    const totalPnlUSD = roundTrips.reduce((sum, rt) => sum + rt.pnl, 0);
    const totalFeesUSD = roundTrips.reduce((sum, rt) => sum + rt.feesUSD, 0);
    const totalFeesBTC = roundTrips.reduce((sum, rt) => sum + rt.feesBTC, 0);
    const avgHoldTime = roundTrips.length > 0
      ? roundTrips.reduce((sum, rt) => sum + rt.duration, 0) / roundTrips.length
      : 0;

    return {
      totalTrades: roundTrips.length,
      winCount: wins.length,
      lossCount: losses.length,
      winRate: roundTrips.length > 0 ? (wins.length / roundTrips.length) * 100 : 0,
      totalPnl: totalPnlUSD,
      totalFees: totalFeesUSD,
      totalFeesBTC,
      netPnl: totalPnlUSD - totalFeesUSD,
      avgPnl: roundTrips.length > 0 ? totalPnlUSD / roundTrips.length : 0,
      avgHoldTimeMs: avgHoldTime,
      avgHoldTimeHours: avgHoldTime / (1000 * 60 * 60),
      roundTrips,
    };
  }
}

// 单例
let analyzerInstance: PaulWeiTradeAnalyzer | null = null;

export function getPaulWeiTradeAnalyzer(): PaulWeiTradeAnalyzer {
  if (!analyzerInstance) {
    analyzerInstance = new PaulWeiTradeAnalyzer();
  }
  return analyzerInstance;
}
