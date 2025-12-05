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
  // 开仓/平仓相关信息
  positionId?: string; // 关联的持仓ID（如果是开仓交易）
  isOpen: boolean; // 是否为开仓交易（true=开仓, false=平仓）
  entryPrice?: number; // 开仓价格（仅平仓交易有）
  exitPrice?: number; // 平仓价格（仅平仓交易有）
  pnl?: number; // 盈亏（仅平仓交易有，已扣除手续费）
  pnlBeforeFee?: number; // 盈亏（平仓交易，未扣除手续费前）
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

