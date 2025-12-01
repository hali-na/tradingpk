// 交易相关类型定义

import { Side, OrderType } from './common';

export interface UserTrade {
  id: string;
  challengeId: string;
  timestamp: string; // 交易时间（模拟时间）
  side: Side;
  price: number;
  quantity: number;
  orderType: OrderType;
  fee: number; // 手续费
}

export interface UserPosition {
  id: string;
  side: 'Long' | 'Short';
  quantity: number;
  entryPrice: number;
  entryTime: string; // 开仓时间（模拟时间）
  unrealizedPnl: number; // 浮动盈亏（基于当前模拟时间的价格）
}

export interface UserOrder {
  id: string;
  challengeId: string;
  type: 'Limit' | 'Stop';
  side: Side;
  price: number; // 限价或止损触发价
  quantity: number;
  createdAt: string; // 创建时间（模拟时间）
  status: 'Pending' | 'Filled' | 'Cancelled';
}

export interface UserAccount {
  balance: number;
  initialBalance: number;
  positions: UserPosition[];
  orders: UserOrder[];
  trades: UserTrade[];
}

