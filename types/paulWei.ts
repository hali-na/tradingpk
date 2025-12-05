// paul wei 交易数据类型定义

import { Side, Symbol } from './common';

export interface PaulWeiTrade {
  id: string;
  datetime: string;
  symbol: Symbol;
  side: Side;
  price: number;
  amount: number;
  cost: number;
  fee_cost: number;
  fee_currency: string;
  execID: string;
}

export interface PaulWeiExecution {
  execID: string;
  orderID: string;
  symbol: Symbol;
  side: Side;
  lastQty: number;
  lastPx: number;
  execType: string;
  ordType: string;
  ordStatus: string;
  execCost: number;
  execComm: number;
  timestamp: string;
  text: string;
}

export interface PaulWeiOrder {
  orderID: string;
  symbol: Symbol;
  side: 'Buy' | 'Sell';
  ordType: 'Limit' | 'Market' | 'Stop';
  orderQty: number;
  price?: number;
  stopPx?: number;
  avgPx?: number;
  cumQty: number;
  ordStatus: 'Pending' | 'Filled' | 'Canceled' | 'PartiallyFilled';
  timestamp: string;
  text: string;
  executions: PaulWeiExecution[];
}


