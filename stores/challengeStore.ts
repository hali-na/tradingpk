// 挑战状态管理

import { create } from 'zustand';
import { Symbol } from '@/types/common';
import { PaulWeiTrade } from '@/types/paulWei';
import { OHLCVData, OHLCVDataset } from '@/types/ohlcv';
import { Challenge, ChallengeResult } from '@/lib/challenge-manager/types';
import { ComparisonMetrics } from '@/lib/comparison/types';

interface ChallengeStore {
  // 当前挑战
  currentChallenge: Challenge | null;
  challengeResult: ChallengeResult | null;
  
  // 数据
  paulWeiTrades: PaulWeiTrade[];
  ohlcvData: OHLCVDataset | null;
  currentTimeframe: '1m' | '5m' | '1h' | '1d';
  
  // 对比数据
  comparisonMetrics: ComparisonMetrics | null;
  
  // 历史记录
  challengeHistory: ChallengeResult[];
  
  // Actions
  setCurrentChallenge: (challenge: Challenge) => void;
  setChallengeResult: (result: ChallengeResult) => void;
  setPaulWeiTrades: (trades: PaulWeiTrade[]) => void;
  setOHLCVData: (data: OHLCVDataset) => void;
  setCurrentTimeframe: (timeframe: '1m' | '5m' | '1h' | '1d') => void;
  setComparisonMetrics: (metrics: ComparisonMetrics) => void;
  loadChallengeHistory: () => void;
  addToHistory: (result: ChallengeResult) => void;
  clearCurrentChallenge: () => void;
  
  // Getters
  getCurrentOHLCV: () => OHLCVData[];
  getPaulWeiTradesInRange: (startTime: string, endTime: string) => PaulWeiTrade[];
}

export const useChallengeStore = create<ChallengeStore>((set, get) => ({
  currentChallenge: null,
  challengeResult: null,
  paulWeiTrades: [],
  ohlcvData: null,
  currentTimeframe: '5m',
  comparisonMetrics: null,
  challengeHistory: [],

  setCurrentChallenge: (challenge: Challenge) => {
    set({
      currentChallenge: challenge,
      paulWeiTrades: challenge.paulWeiTrades,
      ohlcvData: challenge.ohlcvData,
      challengeResult: null,
      comparisonMetrics: null,
    });
  },

  setChallengeResult: (result: ChallengeResult) => {
    set({ challengeResult: result });
    get().addToHistory(result);
  },

  setPaulWeiTrades: (trades: PaulWeiTrade[]) => {
    set({ paulWeiTrades: trades });
  },

  setOHLCVData: (data: OHLCVDataset) => {
    set({ ohlcvData: data });
  },

  setCurrentTimeframe: (timeframe: '1m' | '5m' | '1h' | '1d') => {
    set({ currentTimeframe: timeframe });
  },

  setComparisonMetrics: (metrics: ComparisonMetrics) => {
    set({ comparisonMetrics: metrics });
  },

  loadChallengeHistory: () => {
    try {
      const data = localStorage.getItem('tradingpk_challenge_results');
      if (data) {
        const history: ChallengeResult[] = JSON.parse(data);
        set({ challengeHistory: history });
      }
    } catch {
      console.error('Failed to load challenge history');
    }
  },

  addToHistory: (result: ChallengeResult) => {
    const { challengeHistory } = get();
    const newHistory = [result, ...challengeHistory].slice(0, 100); // 最多保存100条
    set({ challengeHistory: newHistory });
    
    try {
      localStorage.setItem('tradingpk_challenge_results', JSON.stringify(newHistory));
    } catch {
      console.error('Failed to save challenge history');
    }
  },

  clearCurrentChallenge: () => {
    set({
      currentChallenge: null,
      challengeResult: null,
      paulWeiTrades: [],
      ohlcvData: null,
      comparisonMetrics: null,
    });
  },

  getCurrentOHLCV: () => {
    const { ohlcvData, currentTimeframe } = get();
    if (!ohlcvData) return [];
    return ohlcvData[currentTimeframe] || [];
  },

  getPaulWeiTradesInRange: (startTime: string, endTime: string) => {
    const { paulWeiTrades } = get();
    const start = new Date(startTime).getTime();
    const end = new Date(endTime).getTime();
    
    return paulWeiTrades.filter((trade) => {
      const tradeTime = new Date(trade.datetime).getTime();
      return tradeTime >= start && tradeTime <= end;
    });
  },
}));
