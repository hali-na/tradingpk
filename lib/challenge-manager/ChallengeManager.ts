// 挑战管理器实现

import { PaulWeiTrade } from '@/types/paulWei';
import { UserAccount } from '@/types/trading';
import { createPaulWeiDataLoader, createOHLCVDataLoader } from '../data-loader';
import { getComparisonAnalyzer } from '../comparison';
import { StorageManagerImpl } from '../storage/StorageManager';
import { ChallengeValidatorImpl } from './ChallengeValidator';
import {
  Challenge,
  ChallengeResult,
  CreateChallengeParams,
  ChallengeManager,
} from './types';

export class ChallengeManagerImpl implements ChallengeManager {
  private challenges: Map<string, Challenge> = new Map();
  private activeChallenge: Challenge | null = null;
  private paulWeiDataLoader = createPaulWeiDataLoader();
  private ohlcvDataLoader = createOHLCVDataLoader();
  private comparisonAnalyzer = getComparisonAnalyzer();
  private storageManager = new StorageManagerImpl();
  private validator = new ChallengeValidatorImpl();
  private challengeCounter = 0;

  constructor() {
    // 从存储加载挑战记录
    this.loadFromStorage();
  }

  async createChallenge(params: CreateChallengeParams): Promise<Challenge> {
    const { startTime, endTime, symbol, initialBalance = 10000 } = params;

    // 验证时间范围
    if (!this.validator.validateTimeRange(startTime, endTime)) {
      throw new Error('无效的时间范围');
    }

    // 验证交易对
    if (!this.validator.validateSymbol(symbol)) {
      throw new Error('不支持的交易对');
    }

    // 加载 paul wei 交易数据
    const paulWeiTrades = await this.paulWeiDataLoader.loadTrades(
      startTime,
      endTime,
      symbol
    );

    // 加载 K 线数据
    const ohlcvData = await this.ohlcvDataLoader.loadAllTimeframes(
      symbol,
      startTime,
      endTime
    );

    // 创建初始用户账户
    const userAccount: UserAccount = {
      balance: initialBalance,
      initialBalance,
      positions: [],
      orders: [],
      trades: [],
    };

    const challengeId = `challenge_${++this.challengeCounter}_${Date.now()}`;
    const now = new Date().toISOString();

    const challenge: Challenge = {
      id: challengeId,
      startTime,
      endTime,
      symbol,
      status: 'pending',
      userAccount,
      paulWeiTrades,
      ohlcvData,
      createdAt: now,
      updatedAt: now,
    };

    this.challenges.set(challengeId, challenge);
    this.saveToStorage();

    return challenge;
  }

  startChallenge(challengeId: string): void {
    const challenge = this.challenges.get(challengeId);
    if (!challenge) {
      throw new Error('挑战不存在');
    }

    if (!this.validator.canStartChallenge(challenge)) {
      const errors = this.validator.getValidationErrors(challenge);
      throw new Error(`无法开始挑战: ${errors.join(', ')}`);
    }

    challenge.status = 'active';
    challenge.updatedAt = new Date().toISOString();
    this.activeChallenge = challenge;
    this.saveToStorage();
  }

  endChallenge(challengeId: string, currentPrice: number): ChallengeResult {
    const challenge = this.challenges.get(challengeId);
    if (!challenge) {
      throw new Error('挑战不存在');
    }

    if (challenge.status !== 'active') {
      throw new Error('挑战未在进行中');
    }

    // 计算对比结果
    const comparison = this.comparisonAnalyzer.getComparisonResult(
      challenge.userAccount,
      challenge.paulWeiTrades,
      currentPrice,
      challenge.userAccount.initialBalance
    );

    // 计算挑战时长
    const duration =
      new Date(challenge.endTime).getTime() -
      new Date(challenge.startTime).getTime();

    const result: ChallengeResult = {
      challengeId,
      userReturn: comparison.metrics.userReturn,
      paulWeiReturn: comparison.metrics.paulWeiReturn,
      winner: comparison.winner,
      comparison,
      duration,
      completedAt: new Date().toISOString(),
    };

    // 更新挑战状态
    challenge.status = 'completed';
    challenge.updatedAt = new Date().toISOString();
    this.activeChallenge = null;

    // 保存结果
    this.storageManager.saveChallengeResult(result);
    this.saveToStorage();

    return result;
  }

  getChallenge(challengeId: string): Challenge | null {
    return this.challenges.get(challengeId) || null;
  }

  updateChallenge(challenge: Challenge): void {
    if (!this.challenges.has(challenge.id)) {
      throw new Error('挑战不存在');
    }

    challenge.updatedAt = new Date().toISOString();
    this.challenges.set(challenge.id, challenge);
    this.saveToStorage();
  }

  getAllChallenges(): Challenge[] {
    return Array.from(this.challenges.values());
  }

  getActiveChallenge(): Challenge | null {
    return this.activeChallenge;
  }

  private saveToStorage(): void {
    const challenges = Array.from(this.challenges.values());
    // 只保存基本信息，不保存大量 K 线数据
    const storageChallenges = challenges.map((c) => ({
      ...c,
      ohlcvData: undefined, // 不保存 K 线数据
    }));
    
    try {
      localStorage.setItem('tradingpk_challenges', JSON.stringify(storageChallenges));
    } catch {
      console.error('Failed to save challenges to storage');
    }
  }

  private loadFromStorage(): void {
    try {
      const data = localStorage.getItem('tradingpk_challenges');
      if (data) {
        const challenges: Challenge[] = JSON.parse(data);
        challenges.forEach((c) => {
          this.challenges.set(c.id, c);
          if (c.status === 'active') {
            this.activeChallenge = c;
          }
        });
        this.challengeCounter = challenges.length;
      }
    } catch {
      console.error('Failed to load challenges from storage');
    }
  }
}
