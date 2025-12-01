// 挑战数据处理器

import { ChallengeData } from '@/types/challenge';
import { DataLoader } from './types';
import { PaulWeiDataLoader } from './paulWeiDataLoader';
import { OHLCVDataLoader } from './ohlcvDataLoader';

export class ChallengeDataProcessor implements Pick<DataLoader, 'getChallengeData'> {
  private paulWeiLoader: PaulWeiDataLoader;
  private ohlcvLoader: OHLCVDataLoader;

  constructor() {
    this.paulWeiLoader = new PaulWeiDataLoader();
    this.ohlcvLoader = new OHLCVDataLoader();
  }

  async getChallengeData(challengeId: string): Promise<ChallengeData> {
    // 从 challengeId 中解析出时间段和交易对
    // 这里简化处理，实际应该从存储中读取挑战配置
    // TODO: 实现从存储中读取挑战配置的逻辑
    
    // 临时实现：从 URL 参数或存储中获取
    const config = this.parseChallengeId(challengeId);
    
    const [paulWeiTrades, ohlcvData] = await Promise.all([
      this.paulWeiLoader.loadPaulWeiTrades(config.startTime, config.endTime),
      this.ohlcvLoader.loadAllTimeframes(config.symbol, config.startTime, config.endTime),
    ]);

    return {
      id: challengeId,
      startTime: config.startTime,
      endTime: config.endTime,
      symbol: config.symbol,
      paulWeiTrades,
      ohlcvData,
    };
  }

  private parseChallengeId(challengeId: string): {
    startTime: string;
    endTime: string;
    symbol: 'XBTUSD' | 'ETHUSD';
  } {
    // TODO: 实现从 challengeId 解析配置的逻辑
    // 临时返回默认值
    return {
      startTime: '2020-05-01T00:00:00.000Z',
      endTime: '2020-05-07T23:59:59.999Z',
      symbol: 'XBTUSD',
    };
  }
}

