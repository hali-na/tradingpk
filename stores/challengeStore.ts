// 挑战状态管理

import { create } from 'zustand';
import { Symbol } from '@/types/common';
import { PaulWeiTrade } from '@/types/paulWei';
import { OHLCVData, OHLCVDataset } from '@/types/ohlcv';
import { Challenge, ChallengeResult } from '@/lib/challenge-manager/types';
import { ComparisonMetrics } from '@/lib/comparison/types';
import { PaulWeiOrder } from '@/lib/data-loader/paulWeiOrdersLoader';
import { PaulWeiOrdersLoader } from '@/lib/data-loader/paulWeiOrdersLoader';
import { PaulWeiDataLoader } from '@/lib/data-loader/paulWeiDataLoader';

interface ChallengeStore {
  // 当前挑战
  currentChallenge: Challenge | null;
  challengeResult: ChallengeResult | null;
  
  // 数据
  paulWeiTrades: PaulWeiTrade[];
  paulWeiOrders: PaulWeiOrder[];
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
  setPaulWeiOrders: (orders: PaulWeiOrder[]) => void;
  setOHLCVData: (data: OHLCVDataset) => void;
  setCurrentTimeframe: (timeframe: '1m' | '5m' | '1h' | '1d') => void;
  setComparisonMetrics: (metrics: ComparisonMetrics) => void;
  loadPaulWeiOrders: (startTime: string, endTime: string, symbol?: Symbol) => Promise<void>;
  loadPaulWeiTrades: (startTime: string, endTime: string) => Promise<void>;
  loadChallengeHistory: () => void;
  addToHistory: (result: ChallengeResult) => void;
  clearCurrentChallenge: () => void;
  
  // Getters
  getCurrentOHLCV: () => OHLCVData[];
  getFilteredOHLCV: (currentTime: string, historyDays?: number) => OHLCVData[]; // 获取过滤后的K线数据（与K线图使用相同的逻辑）
  get1mCurrentPrice: (currentTime: string) => number; // 获取1分钟K线的当前价格
  getPaulWeiTradesInRange: (startTime: string, endTime: string) => PaulWeiTrade[];
}

export const useChallengeStore = create<ChallengeStore>((set, get) => ({
  currentChallenge: null,
  challengeResult: null,
  paulWeiTrades: [],
  paulWeiOrders: [],
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

  setPaulWeiOrders: (orders: PaulWeiOrder[]) => {
    set({ paulWeiOrders: orders });
  },

  loadPaulWeiOrders: async (startTime: string, endTime: string, symbol?: Symbol) => {
    try {
      const loader = new PaulWeiOrdersLoader();
      const orders = await loader.loadOrders(startTime, endTime, symbol);
      set({ paulWeiOrders: orders });
    } catch (error) {
      console.error('加载Paul Wei订单数据失败:', error);
      set({ paulWeiOrders: [] });
    }
  },

  loadPaulWeiTrades: async (startTime: string, endTime: string) => {
    try {
      const loader = new PaulWeiDataLoader();
      const trades = await loader.loadPaulWeiTrades(startTime, endTime);
      set({ paulWeiTrades: trades });
    } catch (error) {
      console.error('加载Paul Wei交易数据失败:', error);
      set({ paulWeiTrades: [] });
    }
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
      paulWeiOrders: [],
      ohlcvData: null,
      comparisonMetrics: null,
    });
  },

  getCurrentOHLCV: () => {
    const { ohlcvData, currentTimeframe } = get();
    if (!ohlcvData) return [];
    return ohlcvData[currentTimeframe] || [];
  },

  // 获取过滤后的K线数据，与K线图使用相同的过滤逻辑
  getFilteredOHLCV: (currentTime: string, historyDays: number = 7) => {
    const { ohlcvData, currentTimeframe, currentChallenge } = get();
    if (!ohlcvData || !currentTime) {
      const data = ohlcvData?.[currentTimeframe] || [];
      return data;
    }
    
    const data = ohlcvData[currentTimeframe] || [];
    const currentTimeMs = new Date(currentTime).getTime();
    let startTimeMs: number;
    
    if (currentChallenge?.startTime) {
      // 如果有开始时间，显示开始时间前 historyDays 天到当前时间
      const start = new Date(currentChallenge.startTime).getTime();
      startTimeMs = start - (historyDays * 24 * 60 * 60 * 1000);
    } else {
      // 如果没有开始时间，从数据最早的时间开始
      startTimeMs = data.length > 0 ? new Date(data[0].timestamp).getTime() : 0;
    }
    
    return data.filter((item) => {
      const itemTime = new Date(item.timestamp).getTime();
      // 显示从历史时间到当前时间的所有K线（与K线图逻辑一致）
      return itemTime >= startTimeMs && itemTime <= currentTimeMs;
    });
  },

  // 获取1分钟K线的当前价格（始终使用1分钟数据，不受时间周期选择影响）
  get1mCurrentPrice: (currentTime: string) => {
    const { ohlcvData } = get();
    if (!ohlcvData || !currentTime) return 0;
    
    const data1m = ohlcvData['1m'] || [];
    if (data1m.length === 0) return 0;
    
    const currentTimeMs = new Date(currentTime).getTime();
    
    // 使用与K线图完全相同的过滤逻辑
    const filteredData = data1m.filter((item) => {
      const itemTime = new Date(item.timestamp).getTime();
      return itemTime <= currentTimeMs;
    });
    
    if (filteredData.length === 0) return data1m[0].close;
    
    // 返回过滤后的最后一根K线的收盘价（与K线图虚线显示一致）
    return filteredData[filteredData.length - 1].close;
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
