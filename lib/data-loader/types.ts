// 数据加载模块类型定义

import { Symbol, Timeframe } from '@/types/common';
import { PaulWeiTrade } from '@/types/paulWei';
import { OHLCVData, OHLCVDataset } from '@/types/ohlcv';
import { ChallengeData } from '@/types/challenge';

export interface DataLoader {
  loadPaulWeiTrades(startTime: string, endTime: string): Promise<PaulWeiTrade[]>;
  loadOHLCV(
    symbol: Symbol,
    timeframe: Timeframe,
    startTime: string,
    endTime: string
  ): Promise<OHLCVData[]>;
  getChallengeData(challengeId: string): Promise<ChallengeData>;
  loadAllTimeframes(
    symbol: Symbol,
    startTime: string,
    endTime: string
  ): Promise<OHLCVDataset>;
}

