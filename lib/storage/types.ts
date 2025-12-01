// 存储管理模块类型定义

import { Challenge } from '@/types/challenge';
import { ChallengeResult } from '@/lib/challenge-manager/types';

export interface StorageManager {
  saveChallenge(challenge: Challenge): void;
  loadChallenge(challengeId: string): Challenge | null;
  saveChallengeResult(result: ChallengeResult): void;
  loadChallengeHistory(): ChallengeResult[];
  clearStorage(): void;
}

export const StorageKeys = {
  CHALLENGES: 'tradingpk_challenges',
  CHALLENGE_RESULTS: 'tradingpk_challenge_results',
  USER_SETTINGS: 'tradingpk_user_settings',
} as const;

