// K线数据加载器

import Papa from 'papaparse';
import { Symbol, Timeframe } from '@/types/common';
import { OHLCVData, OHLCVDataset } from '@/types/ohlcv';
import { DataLoader } from './types';

export class OHLCVDataLoader implements Pick<DataLoader, 'loadOHLCV' | 'loadAllTimeframes'> {
  private cache: Map<string, OHLCVData[]> = new Map();

  async loadOHLCV(
    symbol: Symbol,
    timeframe: Timeframe,
    startTime: string,
    endTime: string
  ): Promise<OHLCVData[]> {
    const cacheKey = `${symbol}_${timeframe}`;
    
    // 如果缓存中没有，先加载
    if (!this.cache.has(cacheKey)) {
      await this.loadCSV(symbol, timeframe);
    }

    const allData = this.cache.get(cacheKey) || [];
    const start = new Date(startTime).getTime();
    const end = new Date(endTime).getTime();

    // 过滤指定时间段内的数据
    return allData.filter((item) => {
      const itemTime = new Date(item.timestamp).getTime();
      return itemTime >= start && itemTime <= end;
    });
  }

  async loadAllTimeframes(
    symbol: Symbol,
    startTime: string,
    endTime: string
  ): Promise<OHLCVDataset> {
    const timeframes: Timeframe[] = ['1m', '5m', '1h', '1d'];
    
    const [data1m, data5m, data1h, data1d] = await Promise.all([
      this.loadOHLCV(symbol, '1m', startTime, endTime),
      this.loadOHLCV(symbol, '5m', startTime, endTime),
      this.loadOHLCV(symbol, '1h', startTime, endTime),
      this.loadOHLCV(symbol, '1d', startTime, endTime),
    ]);

    return {
      '1m': data1m,
      '5m': data5m,
      '1h': data1h,
      '1d': data1d,
    };
  }

  private async loadCSV(symbol: Symbol, timeframe: Timeframe): Promise<void> {
    const cacheKey = `${symbol}_${timeframe}`;
    const filename = `${symbol}_${timeframe}.csv`;
    
    try {
      const response = await fetch(`/ohlcv/${filename}`);
      const csvText = await response.text();

      return new Promise((resolve, reject) => {
        Papa.parse<OHLCVData>(csvText, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            const data = results.data.map((row) => ({
              timestamp: row.timestamp,
              open: parseFloat(String(row.open)),
              high: parseFloat(String(row.high)),
              low: parseFloat(String(row.low)),
              close: parseFloat(String(row.close)),
              volume: parseFloat(String(row.volume)),
              trades: parseFloat(String(row.trades)),
            }));
            this.cache.set(cacheKey, data);
            resolve();
          },
          error: (error: Error) => {
            console.error(`Error loading OHLCV data for ${symbol} ${timeframe}:`, error);
            reject(error);
          },
        });
      });
    } catch (error) {
      console.error(`Error fetching OHLCV data for ${symbol} ${timeframe}:`, error);
      this.cache.set(cacheKey, []);
    }
  }
}

