// 交易状态管理

import { create } from 'zustand';
import { Side } from '@/types/common';
import { UserAccount, UserTrade, UserPosition, UserOrder } from '@/types/trading';
import { TradingEngineImpl } from '@/lib/trading-engine/TradingEngine';
import { TradingEngineConfig, OrderExecutionResult } from '@/lib/trading-engine/types';

interface TradingStore {
  engine: TradingEngineImpl | null;
  account: UserAccount | null;
  currentPrice: number;
  
  // Actions
  initEngine: (config: TradingEngineConfig) => void;
  placeMarketOrder: (side: Side, quantity: number, timestamp?: string) => OrderExecutionResult;
  placeLimitOrder: (side: Side, quantity: number, price: number, timestamp?: string) => OrderExecutionResult;
  placeStopOrder: (side: Side, quantity: number, triggerPrice: number, timestamp?: string) => OrderExecutionResult;
  cancelOrder: (orderId: string) => boolean;
  closePosition: (positionId: string, timestamp?: string) => OrderExecutionResult;
  closeAllPositions: (timestamp?: string) => OrderExecutionResult[];
  checkOrderTriggers: (currentTime: string) => UserTrade[];
  updateCurrentPrice: (price: number) => void;
  updateAccount: () => void;
  reset: () => void;
  
  // Getters
  getPositions: () => UserPosition[];
  getOrders: () => UserOrder[];
  getTrades: () => UserTrade[];
  getBalance: () => number;
  getEquity: () => number;
}

export const useTradingStore = create<TradingStore>((set, get) => ({
  engine: null,
  account: null,
  currentPrice: 0,

  initEngine: (config: TradingEngineConfig) => {
    const engine = new TradingEngineImpl(config);
    set({
      engine,
      account: engine.getAccount(),
    });
  },

  placeMarketOrder: (side: Side, quantity: number, timestamp?: string) => {
    const { engine, currentPrice } = get();
    if (!engine) {
      return { success: false, error: '交易引擎未初始化' };
    }
    // 使用K线图组件更新的currentPrice（单一数据源）
    const price = currentPrice;
    if (price <= 0) {
      return { success: false, error: '无法获取当前价格' };
    }
    const result = engine.placeMarketOrder(side, quantity, price, timestamp);
    get().updateAccount();
    return result;
  },

  placeLimitOrder: (side: Side, quantity: number, price: number, timestamp?: string) => {
    const { engine } = get();
    if (!engine) {
      return { success: false, error: '交易引擎未初始化' };
    }
    const result = engine.placeLimitOrder(side, quantity, price, timestamp);
    get().updateAccount();
    return result;
  },

  placeStopOrder: (side: Side, quantity: number, triggerPrice: number, timestamp?: string) => {
    const { engine } = get();
    if (!engine) {
      return { success: false, error: '交易引擎未初始化' };
    }
    const result = engine.placeStopOrder(side, quantity, triggerPrice, timestamp);
    get().updateAccount();
    return result;
  },

  cancelOrder: (orderId: string) => {
    const { engine } = get();
    if (!engine) return false;
    const result = engine.cancelOrder(orderId);
    get().updateAccount();
    return result;
  },

  closePosition: (positionId: string, timestamp?: string) => {
    const { engine, currentPrice } = get();
    if (!engine) {
      return { success: false, error: '交易引擎未初始化' };
    }
    const price = currentPrice;
    if (price <= 0) {
      return { success: false, error: '无法获取当前价格' };
    }
    const result = engine.closePosition(positionId, price, timestamp);
    get().updateAccount();
    return result;
  },

  closeAllPositions: (timestamp?: string) => {
    const { engine, currentPrice } = get();
    if (!engine) return [];
    const price = currentPrice;
    if (price <= 0) return [];
    const results = engine.closeAllPositions(price, timestamp);
    get().updateAccount();
    return results;
  },

  checkOrderTriggers: (currentTime: string) => {
    const { engine, currentPrice } = get();
    if (!engine) return [];
    const price = currentPrice;
    if (price <= 0) return [];
    const trades = engine.checkOrderTriggers(price, currentTime);
    if (trades.length > 0) {
      get().updateAccount();
    }
    return trades;
  },

  updateCurrentPrice: (price: number) => {
    const { engine, currentPrice } = get();
    // 只有当价格真正变化时才更新，避免无限循环
    if (Math.abs(price - currentPrice) < 0.01) {
      return;
    }
    set({ currentPrice: price });
    if (engine) {
      engine.updateUnrealizedPnl(price);
      get().updateAccount();
    }
  },

  updateAccount: () => {
    const { engine } = get();
    if (engine) {
      set({ account: engine.getAccount() });
    }
  },

  reset: () => {
    const { engine } = get();
    if (engine) {
      engine.reset();
      get().updateAccount();
    }
  },

  getPositions: () => {
    const { engine } = get();
    return engine?.getPositions() || [];
  },

  getOrders: () => {
    const { engine } = get();
    return engine?.getOrders() || [];
  },

  getTrades: () => {
    const { engine } = get();
    return engine?.getTrades() || [];
  },

  getBalance: () => {
    const { engine } = get();
    return engine?.getBalance() || 0;
  },

  getEquity: () => {
    const { engine, currentPrice } = get();
    const price = currentPrice;
    return engine?.getEquity(price) || 0;
  },
}));
