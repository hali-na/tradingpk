// Paul Wei 交易策略分析器

import { PaulWeiTrade } from '@/types/paulWei';
import { PaulWeiOrder } from '@/lib/data-loader/paulWeiOrdersLoader';

export interface StrategyMetrics {
  // 订单类型分布
  orderTypeDistribution: {
    limit: number;
    market: number;
    stop: number;
    total: number;
  };
  
  // 订单状态分布
  orderStatusDistribution: {
    filled: number;
    canceled: number;
    pending: number;
    total: number;
  };
  
  // 订单取消率
  cancelRate: number;
  
  // 平均订单大小
  avgOrderSize: number;
  
  // 常用订单数量（出现频率最高的数量）
  commonOrderSizes: Array<{ size: number; count: number }>;
  
  // 持仓变化时间线
  positionTimeline: Array<{
    time: string;
    netPosition: number; // 净持仓（正数=多头，负数=空头）
    longPosition: number;
    shortPosition: number;
  }>;
  
  // 价格网格分析
  priceGrid: Array<{
    price: number;
    buyOrders: number;
    sellOrders: number;
    totalQuantity: number;
  }>;
  
  // 交易频率
  tradeFrequency: {
    tradesPerHour: number;
    tradesPerDay: number;
    avgTimeBetweenTrades: number; // 分钟
  };
  
  // 持仓时间分析
  holdTimeAnalysis: {
    avgHoldTime: number; // 小时
    minHoldTime: number;
    maxHoldTime: number;
  };
}

export class PaulWeiStrategyAnalyzer {
  /**
   * 分析订单策略
   */
  analyzeOrderStrategy(orders: PaulWeiOrder[]): Partial<StrategyMetrics> {
    if (orders.length === 0) {
      return {};
    }

    // 订单类型分布
    const orderTypeDistribution = {
      limit: orders.filter((o) => o.ordType === 'Limit').length,
      market: orders.filter((o) => o.ordType === 'Market').length,
      stop: orders.filter((o) => o.ordType === 'Stop').length,
      total: orders.length,
    };

    // 订单状态分布
    const orderStatusDistribution = {
      filled: orders.filter((o) => o.ordStatus === 'Filled').length,
      canceled: orders.filter((o) => o.ordStatus === 'Canceled').length,
      pending: orders.filter((o) => o.ordStatus === 'Pending').length,
      total: orders.length,
    };

    // 订单取消率
    const cancelRate = (orderStatusDistribution.canceled / orders.length) * 100;

    // 平均订单大小
    const filledOrders = orders.filter((o) => o.ordStatus === 'Filled');
    const avgOrderSize =
      filledOrders.length > 0
        ? filledOrders.reduce((sum, o) => sum + o.orderQty, 0) / filledOrders.length
        : 0;

    // 常用订单数量
    const sizeCount = new Map<number, number>();
    filledOrders.forEach((o) => {
      sizeCount.set(o.orderQty, (sizeCount.get(o.orderQty) || 0) + 1);
    });
    const commonOrderSizes = Array.from(sizeCount.entries())
      .map(([size, count]) => ({ size, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // 价格网格分析
    const priceMap = new Map<number, { buy: number; sell: number; totalQty: number }>();
    filledOrders.forEach((o) => {
      if (o.price) {
        const priceKey = Math.round(o.price);
        if (!priceMap.has(priceKey)) {
          priceMap.set(priceKey, { buy: 0, sell: 0, totalQty: 0 });
        }
        const entry = priceMap.get(priceKey)!;
        if (o.side === 'Buy') {
          entry.buy += 1;
        } else {
          entry.sell += 1;
        }
        entry.totalQty += o.orderQty;
      }
    });

    const priceGrid = Array.from(priceMap.entries())
      .map(([price, data]) => ({
        price,
        buyOrders: data.buy,
        sellOrders: data.sell,
        totalQuantity: data.totalQty,
      }))
      .sort((a, b) => a.price - b.price);

    return {
      orderTypeDistribution,
      orderStatusDistribution,
      cancelRate,
      avgOrderSize,
      commonOrderSizes,
      priceGrid,
    };
  }

  /**
   * 分析交易策略
   */
  analyzeTradeStrategy(trades: PaulWeiTrade[]): Partial<StrategyMetrics> {
    if (trades.length === 0) {
      return {};
    }

    // 持仓变化时间线
    const positionTimeline: StrategyMetrics['positionTimeline'] = [];
    let longPosition = 0;
    let shortPosition = 0;

    const sortedTrades = [...trades].sort((a, b) => {
      return new Date(a.datetime).getTime() - new Date(b.datetime).getTime();
    });

    sortedTrades.forEach((trade) => {
      if (trade.side === 'Buy') {
        // 先平空头，再开多头
        if (shortPosition > 0) {
          const closeQty = Math.min(shortPosition, trade.amount);
          shortPosition -= closeQty;
          const remainingQty = trade.amount - closeQty;
          if (remainingQty > 0) {
            longPosition += remainingQty;
          }
        } else {
          longPosition += trade.amount;
        }
      } else {
        // 先平多头，再开空头
        if (longPosition > 0) {
          const closeQty = Math.min(longPosition, trade.amount);
          longPosition -= closeQty;
          const remainingQty = trade.amount - closeQty;
          if (remainingQty > 0) {
            shortPosition += remainingQty;
          }
        } else {
          shortPosition += trade.amount;
        }
      }

      positionTimeline.push({
        time: trade.datetime,
        netPosition: longPosition - shortPosition,
        longPosition,
        shortPosition,
      });
    });

    // 交易频率分析
    if (sortedTrades.length > 1) {
      const firstTradeTime = new Date(sortedTrades[0].datetime).getTime();
      const lastTradeTime = new Date(sortedTrades[sortedTrades.length - 1].datetime).getTime();
      const totalTimeMs = lastTradeTime - firstTradeTime;
      const totalHours = totalTimeMs / (1000 * 60 * 60);
      const totalDays = totalHours / 24;

      const tradesPerHour = totalHours > 0 ? sortedTrades.length / totalHours : 0;
      const tradesPerDay = totalDays > 0 ? sortedTrades.length / totalDays : 0;

      // 计算平均交易间隔
      let totalInterval = 0;
      for (let i = 1; i < sortedTrades.length; i++) {
        const interval =
          (new Date(sortedTrades[i].datetime).getTime() -
            new Date(sortedTrades[i - 1].datetime).getTime()) /
          (1000 * 60); // 转换为分钟
        totalInterval += interval;
      }
      const avgTimeBetweenTrades =
        sortedTrades.length > 1 ? totalInterval / (sortedTrades.length - 1) : 0;

      // 持仓时间分析
      const holdTimes: number[] = [];
      let currentPosition: { side: 'Buy' | 'Sell'; time: string; amount: number } | null = null;

      sortedTrades.forEach((trade) => {
        if (trade.side === 'Buy') {
          if (currentPosition && currentPosition.side === 'Sell') {
            // 平空头
            const closeTime = new Date(trade.datetime).getTime();
            const openTime = new Date(currentPosition.time).getTime();
            holdTimes.push((closeTime - openTime) / (1000 * 60 * 60)); // 转换为小时
          }
          if (currentPosition && currentPosition.side === 'Buy') {
            currentPosition.amount += trade.amount;
          } else {
            currentPosition = {
              side: 'Buy',
              time: trade.datetime,
              amount: trade.amount,
            };
          }
        } else {
          if (currentPosition && currentPosition.side === 'Buy') {
            // 平多头
            const closeTime = new Date(trade.datetime).getTime();
            const openTime = new Date(currentPosition.time).getTime();
            holdTimes.push((closeTime - openTime) / (1000 * 60 * 60)); // 转换为小时
          }
          if (currentPosition && currentPosition.side === 'Sell') {
            currentPosition.amount += trade.amount;
          } else {
            currentPosition = {
              side: 'Sell',
              time: trade.datetime,
              amount: trade.amount,
            };
          }
        }
      });

      const avgHoldTime =
        holdTimes.length > 0
          ? holdTimes.reduce((sum, time) => sum + time, 0) / holdTimes.length
          : 0;
      const minHoldTime = holdTimes.length > 0 ? Math.min(...holdTimes) : 0;
      const maxHoldTime = holdTimes.length > 0 ? Math.max(...holdTimes) : 0;

      return {
        positionTimeline,
        tradeFrequency: {
          tradesPerHour,
          tradesPerDay,
          avgTimeBetweenTrades,
        },
        holdTimeAnalysis: {
          avgHoldTime,
          minHoldTime,
          maxHoldTime,
        },
      };
    }

    return {
      positionTimeline,
    };
  }

  /**
   * 完整策略分析
   */
  analyzeCompleteStrategy(
    orders: PaulWeiOrder[],
    trades: PaulWeiTrade[]
  ): StrategyMetrics {
    const orderAnalysis = this.analyzeOrderStrategy(orders);
    const tradeAnalysis = this.analyzeTradeStrategy(trades);

    return {
      orderTypeDistribution: orderAnalysis.orderTypeDistribution || {
        limit: 0,
        market: 0,
        stop: 0,
        total: 0,
      },
      orderStatusDistribution: orderAnalysis.orderStatusDistribution || {
        filled: 0,
        canceled: 0,
        pending: 0,
        total: 0,
      },
      cancelRate: orderAnalysis.cancelRate || 0,
      avgOrderSize: orderAnalysis.avgOrderSize || 0,
      commonOrderSizes: orderAnalysis.commonOrderSizes || [],
      priceGrid: orderAnalysis.priceGrid || [],
      positionTimeline: tradeAnalysis.positionTimeline || [],
      tradeFrequency: tradeAnalysis.tradeFrequency || {
        tradesPerHour: 0,
        tradesPerDay: 0,
        avgTimeBetweenTrades: 0,
      },
      holdTimeAnalysis: tradeAnalysis.holdTimeAnalysis || {
        avgHoldTime: 0,
        minHoldTime: 0,
        maxHoldTime: 0,
      },
    };
  }
}

