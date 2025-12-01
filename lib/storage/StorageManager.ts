// 存储管理实现

import { StorageManager, StorageKeys } from './types';
import { Challenge } from '@/types/challenge';
import { ChallengeResult } from '@/lib/challenge-manager/types';

export class StorageManagerImpl implements StorageManager {
  saveChallenge(challenge: Challenge): void {
    try {
      const challenges = this.loadAllChallenges();
      const index = challenges.findIndex((c) => c.id === challenge.id);
      
      if (index >= 0) {
        challenges[index] = challenge;
      } else {
        challenges.push(challenge);
      }
      
      localStorage.setItem(StorageKeys.CHALLENGES, JSON.stringify(challenges));
    } catch (error) {
      console.error('Error saving challenge:', error);
    }
  }

  loadChallenge(challengeId: string): Challenge | null {
    try {
      const challenges = this.loadAllChallenges();
      return challenges.find((c) => c.id === challengeId) || null;
    } catch (error) {
      console.error('Error loading challenge:', error);
      return null;
    }
  }

  saveChallengeResult(result: ChallengeResult): void {
    try {
      const results = this.loadChallengeHistory();
      results.push(result);
      localStorage.setItem(StorageKeys.CHALLENGE_RESULTS, JSON.stringify(results));
    } catch (error) {
      console.error('Error saving challenge result:', error);
    }
  }

  loadChallengeHistory(): ChallengeResult[] {
    try {
      const data = localStorage.getItem(StorageKeys.CHALLENGE_RESULTS);
      if (!data) {
        return [];
      }
      return JSON.parse(data) as ChallengeResult[];
    } catch (error) {
      console.error('Error loading challenge history:', error);
      return [];
    }
  }

  clearStorage(): void {
    try {
      localStorage.removeItem(StorageKeys.CHALLENGES);
      localStorage.removeItem(StorageKeys.CHALLENGE_RESULTS);
      localStorage.removeItem(StorageKeys.USER_SETTINGS);
    } catch (error) {
      console.error('Error clearing storage:', error);
    }
  }

  private loadAllChallenges(): Challenge[] {
    try {
      const data = localStorage.getItem(StorageKeys.CHALLENGES);
      if (!data) {
        return [];
      }
      return JSON.parse(data) as Challenge[];
    } catch (error) {
      console.error('Error loading all challenges:', error);
      return [];
    }
  }
}

