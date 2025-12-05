'use client';

import { Side, OrderType, Symbol } from '@/types/common';
import { UserPosition, UserOrder, UserTrade } from '@/types/trading';
import { OrderForm } from './OrderForm';
import { LadderOrderForm, LadderOrder } from './LadderOrderForm';
import { PositionList } from './PositionList';
import { OrderHistory } from './OrderHistory';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface TradingPanelProps {
  currentPrice: number;
  balance: number;
  symbol: Symbol;
  positions: UserPosition[];
  orders: UserOrder[];
  trades: UserTrade[];
  onPlaceOrder: (side: Side, quantity: number, orderType: OrderType, price?: number) => void;
  onPlaceLadderOrders?: (orders: LadderOrder[]) => void;
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
  onPlaceLadderOrders,
  onClosePosition,
  onCloseAll,
  onCancelOrder,
}: TradingPanelProps) {
  return (
    <div className="space-y-4">
      <Tabs defaultValue="single" className="w-full">
        <TabsList className="glass-card grid grid-cols-2 p-1 border border-primary/30">
          <TabsTrigger value="single" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg">
            普通下单
          </TabsTrigger>
          {onPlaceLadderOrders && (
            <TabsTrigger value="ladder" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg">
              阶梯下单
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="single">
          <OrderForm
            currentPrice={currentPrice}
            balance={balance}
            symbol={symbol}
            onPlaceOrder={onPlaceOrder}
          />
        </TabsContent>

        {onPlaceLadderOrders && (
          <TabsContent value="ladder">
            <LadderOrderForm
              currentPrice={currentPrice}
              balance={balance}
              onPlaceOrders={onPlaceLadderOrders}
            />
          </TabsContent>
        )}
      </Tabs>
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
