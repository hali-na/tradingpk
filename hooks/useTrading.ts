// 交易 Hook

import { useCallback } from 'react';
import { Side, OrderType } from '@/types/common';
import { useTradingStore } from '@/stores/tradingStore';
import { TradingEngineConfig } from '@/lib/trading-engine/types';

export function useTrading() {
  const {
    engine,
    account,
    currentPrice,
    initEngine,
    placeMarketOrder,
    placeLimitOrder,
    placeStopOrder,
    cancelOrder,
    closePosition,
    closeAllPositions,
    updateCurrentPrice,
    reset,
    getPositions,
    getOrders,
    getTrades,
    getBalance,
    getEquity,
  } = useTradingStore();

  // 初始化交易引擎
  const initTrading = useCallback(
    (challengeId: string, initialBalance: number = 10000) => {
      const config: TradingEngineConfig = {
        challengeId,
        initialBalance,
        makerFeeRate: 0.00025,
        takerFeeRate: 0.00075,
        slippage: 0.001,
      };
      initEngine(config);
    },
    [initEngine]
  );

  // 下单
  const placeOrder = useCallback(
    (
      side: Side,
      quantity: number,
      orderType: OrderType,
      price?: number,
      timestamp?: string
    ) => {
      switch (orderType) {
        case 'Market':
          return placeMarketOrder(side, quantity, timestamp);
        case 'Limit':
          if (price === undefined) {
            return { success: false, error: '限价单需要指定价格' };
          }
          return placeLimitOrder(side, quantity, price, timestamp);
        case 'Stop':
          if (price === undefined) {
            return { success: false, error: '止损单需要指定触发价格' };
          }
          return placeStopOrder(side, quantity, price, timestamp);
        default:
          return { success: false, error: '不支持的订单类型' };
      }
    },
    [placeMarketOrder, placeLimitOrder, placeStopOrder]
  );

  // 快速开多
  const openLong = useCallback(
    (quantity: number, timestamp?: string) => {
      return placeMarketOrder('Buy', quantity, timestamp);
    },
    [placeMarketOrder]
  );

  // 快速开空
  const openShort = useCallback(
    (quantity: number, timestamp?: string) => {
      return placeMarketOrder('Sell', quantity, timestamp);
    },
    [placeMarketOrder]
  );

  // 计算收益率
  const getReturnRate = useCallback(() => {
    if (!account) return 0;
    const equity = getEquity();
    return ((equity - account.initialBalance) / account.initialBalance) * 100;
  }, [account, getEquity]);

  // 计算浮动盈亏
  const getUnrealizedPnl = useCallback(() => {
    const positions = getPositions();
    return positions.reduce((sum, pos) => sum + pos.unrealizedPnl, 0);
  }, [getPositions]);

  // 获取待处理订单数
  const getPendingOrdersCount = useCallback(() => {
    const orders = getOrders();
    return orders.filter((o) => o.status === 'Pending').length;
  }, [getOrders]);

  // 包装closePosition和closeAllPositions以支持timestamp
  const closePositionWithTime = useCallback(
    (positionId: string, timestamp?: string) => {
      return closePosition(positionId, timestamp);
    },
    [closePosition]
  );

  const closeAllPositionsWithTime = useCallback(
    (timestamp?: string) => {
      return closeAllPositions(timestamp);
    },
    [closeAllPositions]
  );

  return {
    // State
    isInitialized: !!engine,
    account,
    currentPrice,
    positions: getPositions(),
    orders: getOrders(),
    trades: getTrades(),
    balance: getBalance(),
    equity: getEquity(),
    
    // Actions
    initTrading,
    placeOrder,
    openLong,
    openShort,
    cancelOrder,
    closePosition: closePositionWithTime,
    closeAllPositions: closeAllPositionsWithTime,
    updateCurrentPrice,
    reset,
    
    // Computed
    returnRate: getReturnRate(),
    unrealizedPnl: getUnrealizedPnl(),
    pendingOrdersCount: getPendingOrdersCount(),
  };
}
