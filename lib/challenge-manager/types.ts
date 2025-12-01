// 挑战管理模块类型定义

import { Symbol, ChallengeStatus } from '@/types/common';
import { UserAccount } from '@/types/trading';
import { PaulWeiTrade } from '@/types/paulWei';
import { OHLCVDataset } from '@/types/ohlcv';
import { ComparisonResult } from '../comparison/types';

export interface Challenge {
  id: string;
  startTime: string;
  endTime: string;
  symbol: Symbol;
  status: ChallengeStatus;
  userAccount: UserAccount;
  paulWeiTrades: PaulWeiTrade[];
  ohlcvData?: OHLCVDataset;
  createdAt: string;
  updatedAt: string;
}

export interface ChallengeResult {
  challengeId: string;
  userReturn: number;
  paulWeiReturn: number;
  winner: 'user' | 'paulWei' | 'tie';
  comparison: ComparisonResult;
  duration: number; // 挑战时长（毫秒）
  completedAt: string;
}

export interface CreateChallengeParams {
  startTime: string;
  endTime: string;
  symbol: Symbol;
  initialBalance?: number;
}

export interface ChallengeManager {
  createChallenge(params: CreateChallengeParams): Promise<Challenge>;
  startChallenge(challengeId: string): void;
  endChallenge(challengeId: string, currentPrice: number): ChallengeResult;
  getChallenge(challengeId: string): Challenge | null;
  updateChallenge(challenge: Challenge): void;
  getAllChallenges(): Challenge[];
  getActiveChallenge(): Challenge | null;
}

export interface ChallengeValidator {
  validateTimeRange(startTime: string, endTime: string): boolean;
  validateSymbol(symbol: Symbol): boolean;
  canStartChallenge(challenge: Challenge): boolean;
}
