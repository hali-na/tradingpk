// 挑战相关类型定义

import { Symbol, ChallengeStatus } from './common';
import { UserAccount } from './trading';
import { PaulWeiTrade } from './paulWei';
import { OHLCVData, OHLCVDataset } from './ohlcv';

export interface Challenge {
  id: string;
  startTime: string;
  endTime: string;
  symbol: Symbol;
  status: ChallengeStatus;
  userAccount: UserAccount;
  paulWeiTrades: PaulWeiTrade[];
  ohlcvData: OHLCVDataset;
  createdAt: string;
}

export interface ChallengeData {
  id: string;
  startTime: string;
  endTime: string;
  symbol: Symbol;
  paulWeiTrades: PaulWeiTrade[];
  ohlcvData: OHLCVDataset;
}

export interface ChallengeResult {
  challengeId: string;
  userReturn: number;
  paulWeiReturn: number;
  userTrades: import('./trading').UserTrade[];
  comparison: import('./comparison').ComparisonMetrics;
  timeSpent: number; // 实际花费的时间（秒）
  simulationTime: number; // 模拟的时间（秒）
  averageSpeed: number; // 平均时间流速
  completedAt: string;
}

