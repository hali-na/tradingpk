// paul wei 交易数据加载器

import Papa from 'papaparse';
import { PaulWeiTrade } from '@/types/paulWei';
import { DataLoader } from './types';

export class PaulWeiDataLoader implements Pick<DataLoader, 'loadPaulWeiTrades'> {
  private tradesCache: PaulWeiTrade[] | null = null;

  async loadPaulWeiTrades(startTime: string, endTime: string): Promise<PaulWeiTrade[]> {
    // 如果缓存为空，先加载所有数据
    if (!this.tradesCache) {
      await this.loadAllTrades();
    }

    if (!this.tradesCache || this.tradesCache.length === 0) {
      console.log('[PaulWeiDataLoader] 没有可用的交易数据');
      return [];
    }

    const start = new Date(startTime).getTime();
    const end = new Date(endTime).getTime();

    // 过滤指定时间段内的交易
    const filtered = this.tradesCache.filter((trade) => {
      const tradeTime = new Date(trade.datetime).getTime();
      return tradeTime >= start && tradeTime <= end;
    });

    console.log(`[PaulWeiDataLoader] 查询时间段: ${startTime} ~ ${endTime}`);
    console.log(`[PaulWeiDataLoader] 找到 ${filtered.length} 笔交易（总共 ${this.tradesCache.length} 笔）`);
    
    return filtered;
  }

  private async loadAllTrades(): Promise<void> {
    try {
      const response = await fetch('/bitmex_paulwei/bitmex_trades.csv');
      const csvText = await response.text();

      return new Promise((resolve, reject) => {
        Papa.parse<PaulWeiTrade>(csvText, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            this.tradesCache = results.data
              .map((row) => {
                // 转换 symbol: BTC/USD:BTC -> XBTUSD, ETH/USD:ETH -> ETHUSD
                let symbol: 'XBTUSD' | 'ETHUSD' | null = null;
                const symbolStr = String(row.symbol || '').toUpperCase();
                if (symbolStr.includes('BTC') || symbolStr.includes('XBT')) {
                  symbol = 'XBTUSD';
                } else if (symbolStr.includes('ETH')) {
                  symbol = 'ETHUSD';
                } else {
                  // 跳过不支持的交易对
                  return null;
                }

                // 转换 side: buy -> Buy, sell -> Sell
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
                  id: row.id,
                  datetime: row.datetime,
                  symbol,
                  side,
                  price: parseFloat(String(row.price)),
                  amount: parseFloat(String(row.amount)),
                  cost: parseFloat(String(row.cost)),
                  fee_cost: parseFloat(String(row.fee_cost)),
                  fee_currency: row.fee_currency,
                  execID: row.execID,
                };
              })
              .filter((trade): trade is PaulWeiTrade => trade !== null);
            
            console.log(`[PaulWeiDataLoader] 加载了 ${this.tradesCache.length} 笔交易`);
            if (this.tradesCache.length > 0) {
              const firstTrade = this.tradesCache[0];
              const lastTrade = this.tradesCache[this.tradesCache.length - 1];
              console.log(`[PaulWeiDataLoader] 时间范围: ${firstTrade.datetime} ~ ${lastTrade.datetime}`);
            }
            resolve();
          },
          error: (error: Error) => {
            console.error('Error loading paul wei trades:', error);
            reject(error);
          },
        });
      });
    } catch (error) {
      console.error('Error fetching paul wei trades:', error);
      this.tradesCache = [];
    }
  }
}

