// K线数据加载器

import Papa from 'papaparse';
import { Symbol, Timeframe } from '@/types/common';
import { OHLCVData, OHLCVDataset } from '@/types/ohlcv';
import { DataLoader } from './types';

type CachedRange = {
  start: number;
  end: number;
  data: OHLCVData[];
};

export class OHLCVDataLoader implements Pick<DataLoader, 'loadOHLCV' | 'loadAllTimeframes'> {
  /**
   * 按交易对/周期缓存最近一次加载的时间范围数据
   * key: `${symbol}_${timeframe}`
   */
  private cache: Map<string, CachedRange> = new Map();

  async loadOHLCV(
    symbol: Symbol,
    timeframe: Timeframe,
    startTime: string,
    endTime: string
  ): Promise<OHLCVData[]> {
    const start = new Date(startTime).getTime();
    const end = new Date(endTime).getTime();

    const cacheKey = `${symbol}_${timeframe}`;
    const cached = this.cache.get(cacheKey);

    // 如果已有缓存且覆盖所需区间，直接切片返回
    if (cached && start >= cached.start && end <= cached.end) {
      return cached.data.filter((item) => {
        const t = new Date(item.timestamp).getTime();
        return t >= start && t <= end;
      });
    }

    // 增量解析：仅解析所需时间窗口，超过 end 立即中止
    const data = await this.loadCSV(symbol, timeframe, start, end);
    this.cache.set(cacheKey, { start, end, data });
    return data;
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

  /**
   * 解析 CSV，但只保留 [startMs, endMs] 区间，并在超过 endMs 时终止解析，减少等待时间
   */
  private async loadCSV(symbol: Symbol, timeframe: Timeframe, startMs: number, endMs: number): Promise<OHLCVData[]> {
    const filename = `${symbol}_${timeframe}.csv`;
    
    try {
      const response = await fetch(`/ohlcv/${filename}`);
      if (!response.ok) {
        console.error(`Error fetching OHLCV data for ${symbol} ${timeframe}: ${response.status}`);
        return [];
      }

      const csvText = await response.text();

      return new Promise((resolve, reject) => {
        const windowData: OHLCVData[] = [];
        let aborted = false;

        Papa.parse<OHLCVData>(csvText, {
          header: true,
          skipEmptyLines: true,
          step: (row, parser) => {
            const ts = (row.data as any).timestamp;
            if (!ts) return;

            const t = new Date(ts).getTime();
            if (t < startMs) return; // 尚未到达窗口起点，跳过

            if (t > endMs) {
              aborted = true;
              parser.abort();
              resolve(windowData);
              return;
            }

            windowData.push({
              timestamp: ts,
              open: parseFloat(String((row.data as any).open)),
              high: parseFloat(String((row.data as any).high)),
              low: parseFloat(String((row.data as any).low)),
              close: parseFloat(String((row.data as any).close)),
              volume: parseFloat(String((row.data as any).volume)),
              trades: parseFloat(String((row.data as any).trades)),
            });
          },
          complete: () => {
            if (!aborted) {
              resolve(windowData);
            }
          },
          error: (error: Error) => {
            console.error(`Error loading OHLCV data for ${symbol} ${timeframe}:`, error);
            reject(error);
          },
        });
      });
    } catch (error) {
      console.error(`Error fetching OHLCV data for ${symbol} ${timeframe}:`, error);
      return [];
    }
  }
}

// 单例工厂，避免重复实例化
let ohlcvLoaderInstance: OHLCVDataLoader | null = null;

export function getOHLCVDataLoader(): OHLCVDataLoader {
  if (!ohlcvLoaderInstance) {
    ohlcvLoaderInstance = new OHLCVDataLoader();
  }
  return ohlcvLoaderInstance;
}

