// 交易引擎类型定义

import { Side, OrderType } from '@/types/common';
import { UserTrade, UserPosition, UserOrder, UserAccount } from '@/types/trading';

export interface TradingEngineConfig {
  initialBalance: number;
  challengeId: string;
  makerFeeRate: number;
  takerFeeRate: number;
  slippage: number; // 滑点，默认 0.1%
}

export interface PlaceOrderParams {
  side: Side;
  quantity: number;
  price?: number; // 限价单/止损单需要
  orderType: OrderType;
}

export interface OrderExecutionResult {
  success: boolean;
  trade?: UserTrade;
  order?: UserOrder;
  error?: string;
}

export interface TradingEngine {
  // 订单操作
  placeMarketOrder(
    side: Side,
    quantity: number,
    currentPrice: number,
    timestamp?: string
  ): OrderExecutionResult;
  placeLimitOrder(
    side: Side,
    quantity: number,
    price: number,
    timestamp?: string
  ): OrderExecutionResult;
  placeStopOrder(
    side: Side,
    quantity: number,
    triggerPrice: number,
    timestamp?: string
  ): OrderExecutionResult;
  cancelOrder(orderId: string): boolean;
  
  // 持仓操作
  closePosition(
    positionId: string,
    currentPrice: number,
    timestamp?: string
  ): OrderExecutionResult;
  closeAllPositions(currentPrice: number, timestamp?: string): OrderExecutionResult[];
  
  // 查询
  getAccount(): UserAccount;
  getPositions(): UserPosition[];
  getOrders(): UserOrder[];
  getTrades(): UserTrade[];
  getBalance(): number;
  getEquity(currentPrice: number): number;
  
  // 订单触发检查（用于限价单/止损单）
  checkOrderTriggers(currentPrice: number, currentTime: string): UserTrade[];
  
  // 更新浮动盈亏
  updateUnrealizedPnl(currentPrice: number): void;
  
  // 重置
  reset(): void;
}

export interface OrderManager {
  createOrder(params: PlaceOrderParams, challengeId: string, currentTime: string): UserOrder;
  updateOrderStatus(orderId: string, status: UserOrder['status']): boolean;
  cancelOrder(orderId: string): boolean;
  getPendingOrders(): UserOrder[];
  getOrderById(orderId: string): UserOrder | undefined;
  getAllOrders(): UserOrder[];
  reset(): void;
}

export interface PositionManager {
  openPosition(side: Side, quantity: number, entryPrice: number, entryTime: string): UserPosition;
  closePosition(positionId: string, exitPrice: number): { position: UserPosition; pnl: number } | null;
  updateUnrealizedPnl(currentPrice: number): void;
  getPositions(): UserPosition[];
  getPositionById(positionId: string): UserPosition | undefined;
  getNetPosition(): { side: 'Long' | 'Short' | 'Neutral'; quantity: number };
  reset(): void;
}

export interface OrderMatcher {
  matchMarketOrder(
    side: Side,
    quantity: number,
    currentPrice: number,
    slippage: number
  ): { executedPrice: number; executedQuantity: number };
  
  checkLimitOrder(order: UserOrder, currentPrice: number): boolean;
  checkStopOrder(order: UserOrder, currentPrice: number): boolean;
  
  getTriggeredOrders(orders: UserOrder[], currentPrice: number): UserOrder[];
}

export type { UserTrade, UserPosition, UserOrder, UserAccount };
