// 数据加载模块统一导出

import { DataLoader } from './types';
import { PaulWeiDataLoader } from './paulWeiDataLoader';
import { OHLCVDataLoader } from './ohlcvDataLoader';
import { ChallengeDataProcessor } from './challengeDataProcessor';
import { Symbol, Timeframe } from '@/types/common';

export class DataLoaderModule implements DataLoader {
  private paulWeiLoader: PaulWeiDataLoader;
  private ohlcvLoader: OHLCVDataLoader;
  private challengeProcessor: ChallengeDataProcessor;

  constructor() {
    this.paulWeiLoader = new PaulWeiDataLoader();
    this.ohlcvLoader = new OHLCVDataLoader();
    this.challengeProcessor = new ChallengeDataProcessor();
  }

  async loadPaulWeiTrades(startTime: string, endTime: string) {
    return this.paulWeiLoader.loadPaulWeiTrades(startTime, endTime);
  }

  async loadOHLCV(symbol: Symbol, timeframe: Timeframe, startTime: string, endTime: string) {
    return this.ohlcvLoader.loadOHLCV(symbol, timeframe, startTime, endTime);
  }

  async getChallengeData(challengeId: string) {
    return this.challengeProcessor.getChallengeData(challengeId);
  }

  async loadAllTimeframes(symbol: Symbol, startTime: string, endTime: string) {
    return this.ohlcvLoader.loadAllTimeframes(symbol, startTime, endTime);
  }
}

// 导出工厂函数
export function createDataLoader(): DataLoader {
  return new DataLoaderModule();
}

// 导出单独的加载器工厂函数
export function createPaulWeiDataLoader() {
  return new PaulWeiDataLoaderExtended();
}

export function createOHLCVDataLoader() {
  return new OHLCVDataLoader();
}

// 扩展的 paul wei 数据加载器
class PaulWeiDataLoaderExtended extends PaulWeiDataLoader {
  async loadTrades(startTime: string, endTime: string, symbol?: Symbol) {
    const trades = await this.loadPaulWeiTrades(startTime, endTime);
    if (symbol) {
      return trades.filter(t => t.symbol === symbol);
    }
    return trades;
  }
}

// 导出类
export { PaulWeiDataLoader } from './paulWeiDataLoader';
export { OHLCVDataLoader } from './ohlcvDataLoader';
export { ChallengeDataProcessor } from './challengeDataProcessor';

// 导出类型
export * from './types';

