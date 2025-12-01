'use client';

import { Side, OrderType, Symbol } from '@/types/common';
import { UserPosition, UserOrder, UserTrade } from '@/types/trading';
import { OrderForm } from './OrderForm';
import { PositionList } from './PositionList';
import { OrderHistory } from './OrderHistory';

interface TradingPanelProps {
  currentPrice: number;
  balance: number;
  symbol: Symbol;
  positions: UserPosition[];
  orders: UserOrder[];
  trades: UserTrade[];
  onPlaceOrder: (side: Side, quantity: number, orderType: OrderType, price?: number) => void;
  onClosePosition: (positionId: string) => void;
  onCloseAll: () => void;
  onCancelOrder: (orderId: string) => void;
}

export function TradingPanel({
  currentPrice,
  balance,
  symbol,
  positions,
  orders,
  trades,
  onPlaceOrder,
  onClosePosition,
  onCloseAll,
  onCancelOrder,
}: TradingPanelProps) {
  return (
    <div className="space-y-4">
      <OrderForm
        currentPrice={currentPrice}
        balance={balance}
        symbol={symbol}
        onPlaceOrder={onPlaceOrder}
      />
      <PositionList
        positions={positions}
        onClosePosition={onClosePosition}
        onCloseAll={onCloseAll}
      />
      <OrderHistory
        orders={orders}
        trades={trades}
        onCancelOrder={onCancelOrder}
      />
    </div>
  );
}
