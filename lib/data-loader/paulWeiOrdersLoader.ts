// paul wei 订单数据加载器

import Papa from 'papaparse';
import { PaulWeiExecution } from '@/types/paulWei';
import { Symbol } from '@/types/common';

export interface PaulWeiOrder {
  orderID: string;
  symbol: Symbol;
  side: 'Buy' | 'Sell';
  ordType: 'Limit' | 'Market' | 'Stop';
  orderQty: number;
  price?: number;
  stopPx?: number;
  avgPx?: number;
  cumQty: number;
  ordStatus: 'Pending' | 'Filled' | 'Canceled' | 'PartiallyFilled';
  timestamp: string;
  text: string;
  executions: PaulWeiExecution[];
}

export class PaulWeiOrdersLoader {
  private ordersCache: PaulWeiOrder[] | null = null;
  private executionsCache: PaulWeiExecution[] | null = null;

  async loadOrders(startTime: string, endTime: string, symbol?: Symbol): Promise<PaulWeiOrder[]> {
    if (!this.ordersCache || !this.executionsCache) {
      await Promise.all([this.loadAllOrders(), this.loadAllExecutions()]);
    }

    if (!this.ordersCache || !this.executionsCache) {
      return [];
    }

    const start = new Date(startTime).getTime();
    const end = new Date(endTime).getTime();

    // 过滤指定时间段内的订单
    let filtered = this.ordersCache.filter((order) => {
      const orderTime = new Date(order.timestamp).getTime();
      return orderTime >= start && orderTime <= end;
    });

    // 过滤交易对
    if (symbol) {
      filtered = filtered.filter((order) => order.symbol === symbol);
    }

    // 关联执行记录
    filtered.forEach((order) => {
      order.executions = this.executionsCache!.filter(
        (exec) => exec.orderID === order.orderID
      );
    });

    return filtered;
  }

  private async loadAllOrders(): Promise<void> {
    try {
      const response = await fetch('/bitmex_paulwei/bitmex_orders.csv');
      const csvText = await response.text();

      return new Promise((resolve, reject) => {
        Papa.parse(csvText, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            this.ordersCache = results.data
              .map((row) => {
                // 转换 symbol
                let symbol: 'XBTUSD' | 'ETHUSD' | null = null;
                const symbolStr = String(row.symbol || '').toUpperCase();
                if (symbolStr === 'XBTUSD' || symbolStr.includes('BTC')) {
                  symbol = 'XBTUSD';
                } else if (symbolStr === 'ETHUSD' || symbolStr.includes('ETH')) {
                  symbol = 'ETHUSD';
                } else {
                  return null;
                }

                // 转换 side
                const sideStr = String(row.side || '').toLowerCase();
                let side: 'Buy' | 'Sell' | null = null;
                if (sideStr === 'buy') {
                  side = 'Buy';
                } else if (sideStr === 'sell') {
                  side = 'Sell';
                } else {
                  return null;
                }

                // 转换订单状态
                const statusStr = String(row.ordStatus || '').toLowerCase();
                let ordStatus: 'Pending' | 'Filled' | 'Canceled' | 'PartiallyFilled' = 'Pending';
                if (statusStr.includes('filled')) {
                  ordStatus = row.cumQty && parseFloat(row.cumQty) < parseFloat(row.orderQty) 
                    ? 'PartiallyFilled' 
                    : 'Filled';
                } else if (statusStr.includes('cancel')) {
                  ordStatus = 'Canceled';
                }

                // 转换订单类型
                const ordTypeStr = String(row.ordType || '').toLowerCase();
                let ordType: 'Limit' | 'Market' | 'Stop' = 'Limit';
                if (ordTypeStr.includes('market')) {
                  ordType = 'Market';
                } else if (ordTypeStr.includes('stop')) {
                  ordType = 'Stop';
                }

                return {
                  orderID: row.orderID,
                  symbol,
                  side,
                  ordType,
                  orderQty: parseFloat(String(row.orderQty || 0)),
                  price: row.price ? parseFloat(String(row.price)) : undefined,
                  stopPx: row.stopPx ? parseFloat(String(row.stopPx)) : undefined,
                  avgPx: row.avgPx ? parseFloat(String(row.avgPx)) : undefined,
                  cumQty: parseFloat(String(row.cumQty || 0)),
                  ordStatus,
                  timestamp: row.timestamp,
                  text: row.text || '',
                  executions: [],
                };
              })
              .filter((order): order is PaulWeiOrder => order !== null);

            console.log(`[PaulWeiOrdersLoader] 加载了 ${this.ordersCache.length} 个订单`);
            resolve();
          },
          error: (error: Error) => {
            console.error('Error loading paul wei orders:', error);
            reject(error);
          },
        });
      });
    } catch (error) {
      console.error('Error fetching paul wei orders:', error);
      this.ordersCache = [];
    }
  }

  private async loadAllExecutions(): Promise<void> {
    try {
      const response = await fetch('/bitmex_paulwei/bitmex_executions.csv');
      const csvText = await response.text();

      return new Promise((resolve, reject) => {
        Papa.parse(csvText, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            this.executionsCache = results.data
              .map((row) => {
                // 转换 symbol
                let symbol: 'XBTUSD' | 'ETHUSD' | null = null;
                const symbolStr = String(row.symbol || '').toUpperCase();
                if (symbolStr === 'XBTUSD' || symbolStr.includes('BTC')) {
                  symbol = 'XBTUSD';
                } else if (symbolStr === 'ETHUSD' || symbolStr.includes('ETH')) {
                  symbol = 'ETHUSD';
                } else {
                  return null;
                }

                // 转换 side
                const sideStr = String(row.side || '').toLowerCase();
                let side: 'Buy' | 'Sell' | null = null;
                if (sideStr === 'buy') {
                  side = 'Buy';
                } else if (sideStr === 'sell') {
                  side = 'Sell';
                } else {
                  return null;
                }

                return {
                  execID: row.execID,
                  orderID: row.orderID,
                  symbol,
                  side,
                  lastQty: parseFloat(String(row.lastQty || 0)),
                  lastPx: parseFloat(String(row.lastPx || 0)),
                  execType: row.execType || '',
                  ordType: row.ordType || '',
                  ordStatus: row.ordStatus || '',
                  execCost: parseFloat(String(row.execCost || 0)),
                  execComm: parseFloat(String(row.execComm || 0)),
                  timestamp: row.timestamp,
                  text: row.text || '',
                };
              })
              .filter((exec): exec is PaulWeiExecution => exec !== null);

            console.log(`[PaulWeiOrdersLoader] 加载了 ${this.executionsCache.length} 条执行记录`);
            resolve();
          },
          error: (error: Error) => {
            console.error('Error loading paul wei executions:', error);
            reject(error);
          },
        });
      });
    } catch (error) {
      console.error('Error fetching paul wei executions:', error);
      this.executionsCache = [];
    }
  }
}

