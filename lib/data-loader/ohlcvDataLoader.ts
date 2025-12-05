// K线数据加载器
// 优先从本地 public/ohlcv 加载，失败时从 Hugging Face 加载

import Papa from 'papaparse';
import { Symbol, Timeframe } from '@/types/common';
import { OHLCVData, OHLCVDataset } from '@/types/ohlcv';
import { DataLoader } from './types';

// Hugging Face 数据集 URL - 文件直接在根目录，不在 ohlcv 子目录
const HF_BASE_URL = 'https://huggingface.co/datasets/geeksaywhat/paulweitrading/resolve/main';

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
  
  // 缓存完整的 CSV 数据，避免重复下载
  private fullDataCache: Map<string, OHLCVData[]> = new Map();

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

    // 加载数据
    const data = await this.loadCSV(symbol, timeframe, start, end);
    
    if (data.length > 0) {
      this.cache.set(cacheKey, { start, end, data });
    }
    
    return data;
  }

  async loadAllTimeframes(
    symbol: Symbol,
    startTime: string,
    endTime: string
  ): Promise<OHLCVDataset> {
    // 优先加载 1h 数据，这是最常用的
    const data1h = await this.loadOHLCV(symbol, '1h', startTime, endTime);
    
    // 并行加载其他时间周期
    const [data1m, data5m, data1d] = await Promise.all([
      this.loadOHLCV(symbol, '1m', startTime, endTime),
      this.loadOHLCV(symbol, '5m', startTime, endTime),
      this.loadOHLCV(symbol, '1d', startTime, endTime),
    ]);

    console.log(`[OHLCVDataLoader] Loaded data for ${symbol}:`, {
      '1m': data1m.length,
      '5m': data5m.length,
      '1h': data1h.length,
      '1d': data1d.length,
      timeRange: `${startTime} - ${endTime}`,
    });

    return {
      '1m': data1m,
      '5m': data5m,
      '1h': data1h,
      '1d': data1d,
    };
  }

  /**
   * 加载 CSV 数据，优先本地，失败时从 Hugging Face 加载
   */
  private async loadCSV(symbol: Symbol, timeframe: Timeframe, startMs: number, endMs: number): Promise<OHLCVData[]> {
    const filename = `${symbol}_${timeframe}.csv`;
    const cacheKey = `${symbol}_${timeframe}_full`;
    
    // 检查是否已有完整数据缓存
    let fullData = this.fullDataCache.get(cacheKey);
    
    if (!fullData) {
      // 尝试从本地加载
      fullData = await this.fetchAndParseCSV(`/ohlcv/${filename}`, symbol, timeframe);
      
      // 如果本地加载失败或数据为空，尝试从 Hugging Face 加载
      if (!fullData || fullData.length === 0) {
        console.log(`[OHLCVDataLoader] Local load failed for ${filename}, trying Hugging Face...`);
        fullData = await this.fetchAndParseCSV(`${HF_BASE_URL}/${filename}`, symbol, timeframe);
      }
      
      // 缓存完整数据
      if (fullData && fullData.length > 0) {
        this.fullDataCache.set(cacheKey, fullData);
        console.log(`[OHLCVDataLoader] Cached ${fullData.length} records for ${filename}`);
      }
    }
    
    if (!fullData || fullData.length === 0) {
      console.warn(`[OHLCVDataLoader] No data available for ${filename}`);
      return [];
    }
    
    // 过滤时间范围
    const filtered = fullData.filter((item) => {
      const t = new Date(item.timestamp).getTime();
      return t >= startMs && t <= endMs;
    });
    
    console.log(`[OHLCVDataLoader] Filtered ${filename}: ${filtered.length} records in range`);
    return filtered;
  }

  /**
   * 从 URL 获取并解析 CSV
   */
  private async fetchAndParseCSV(url: string, symbol: Symbol, timeframe: Timeframe): Promise<OHLCVData[]> {
    try {
      console.log(`[OHLCVDataLoader] Fetching: ${url}`);
      const response = await fetch(url);
      
      if (!response.ok) {
        console.error(`[OHLCVDataLoader] HTTP ${response.status} for ${url}`);
        return [];
      }

      const csvText = await response.text();
      
      if (!csvText || csvText.length < 100) {
        console.error(`[OHLCVDataLoader] Empty or invalid response for ${url}`);
        return [];
      }

      return new Promise((resolve) => {
        const allData: OHLCVData[] = [];

        Papa.parse(csvText, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            results.data.forEach((row: any) => {
              const ts = row.timestamp;
              if (!ts) return;

              const open = parseFloat(String(row.open));
              const high = parseFloat(String(row.high));
              const low = parseFloat(String(row.low));
              const close = parseFloat(String(row.close));
              
              // 验证数据有效性
              if (isNaN(open) || isNaN(high) || isNaN(low) || isNaN(close)) {
                return;
              }

              allData.push({
                timestamp: ts,
                open,
                high,
                low,
                close,
                volume: parseFloat(String(row.volume)) || 0,
                trades: parseFloat(String(row.trades)) || 0,
              });
            });
            
            console.log(`[OHLCVDataLoader] Parsed ${allData.length} records from ${url}`);
            resolve(allData);
          },
          error: (error: Error) => {
            console.error(`[OHLCVDataLoader] Parse error for ${symbol} ${timeframe}:`, error);
            resolve([]);
          },
        });
      });
    } catch (error) {
      console.error(`[OHLCVDataLoader] Fetch error for ${url}:`, error);
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

