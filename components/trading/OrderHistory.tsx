'use client';

import { UserOrder, UserTrade } from '@/types/trading';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

interface OrderHistoryProps {
  orders: UserOrder[];
  trades: UserTrade[];
  onCancelOrder: (orderId: string) => void;
}

export function OrderHistory({ orders, trades, onCancelOrder }: OrderHistoryProps) {
  const pendingOrders = orders.filter((o) => o.status === 'Pending');

  return (
    <Card glass>
      <CardHeader className="pb-4">
        <CardTitle className="text-base text-foreground">订单记录</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <Tabs defaultValue="trades">
          <TabsList className="w-full grid grid-cols-2 bg-muted/30 p-1 rounded-lg mb-4">
            <TabsTrigger 
              value="trades"
              className="data-[state=active]:bg-primary/80 data-[state=active]:text-primary-foreground data-[state=active]:shadow-md rounded-md"
            >
              成交 ({trades.length})
            </TabsTrigger>
            <TabsTrigger 
              value="pending"
              className="data-[state=active]:bg-primary/80 data-[state=active]:text-primary-foreground data-[state=active]:shadow-md rounded-md"
            >
              挂单 ({pendingOrders.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="mt-0">
            {pendingOrders.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-3xl mb-2">📥</p>
                <p className="text-sm text-muted-foreground">暂无挂单</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto p-1">
            {pendingOrders.map((order) => (
              <div
                key={order.id}
                    className="flex items-center justify-between p-2 rounded-md glass"
              >
                    <div className="flex items-center gap-2">
                      <Badge variant={order.side === 'Buy' ? 'long' : 'short'} className="shadow-none w-10 justify-center">
                    {order.side}
                      </Badge>
                      <Badge variant="outline" className="border-border/50">{order.type}</Badge>
                      <span className="font-mono text-sm text-foreground">
                    {order.quantity} @ ${order.price.toLocaleString()}
                  </span>
                </div>
                <Button
                  variant="ghost"
                      size="icon"
                  onClick={() => onCancelOrder(order.id)}
                      className="h-7 w-7 text-muted-foreground hover:bg-destructive/20 hover:text-destructive"
                >
                      ✕
                </Button>
              </div>
            ))}
        </div>
      )}
          </TabsContent>

          <TabsContent value="trades" className="mt-0">
        {trades.length === 0 ? (
               <div className="text-center py-6">
                <p className="text-3xl mb-2">🧾</p>
                <p className="text-sm text-muted-foreground">暂无成交</p>
              </div>
        ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto p-1">
            {trades
              .slice()
              .reverse()
                  .map((trade) => {
                    const isClosing = !trade.isOpen;
                    const pnl = trade.pnl ?? 0;
                    const isProfit = pnl > 0;
                    const isLoss = pnl < 0;

                    return (
                <div
                  key={trade.id}
                        className={cn(
                          'rounded-lg p-3 glass border-2',
                          isClosing
                            ? isProfit
                              ? 'border-profit/50'
                              : isLoss
                              ? 'border-loss/50'
                              : 'border-transparent'
                            : 'border-transparent'
                        )}
                >
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant={trade.side === 'Buy' ? 'long' : 'short'} className="shadow-none w-10 justify-center">
                        {trade.side}
                          </Badge>
                          <Badge variant={isClosing ? 'secondary' : 'outline'} className="bg-muted/50 border-transparent">
                            {isClosing ? '平仓' : '开仓'}
                          </Badge>
                          <span className="text-xs text-muted-foreground ml-auto font-mono">
                            {new Date(trade.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                        <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                          {isClosing && trade.entryPrice && trade.exitPrice ? (
                            <>
                              <div>
                                <span className="text-muted-foreground">开:</span>
                                <span className="ml-1.5 text-foreground">
                                  ${trade.entryPrice.toLocaleString()}
                    </span>
                  </div>
                              <div>
                                <span className="text-muted-foreground">平:</span>
                                <span className="ml-1.5 text-foreground">
                                  ${trade.exitPrice.toLocaleString()}
                    </span>
                  </div>
                            </>
                          ) : (
                            <div className="col-span-2">
                              <span className="text-muted-foreground">成交 @</span>
                              <span className="ml-1.5 text-foreground">
                                ${trade.price.toLocaleString()}
                              </span>
                              <span className="ml-2 text-muted-foreground">×</span>
                              <span className="ml-1 text-foreground">{trade.quantity}</span>
                            </div>
                          )}
                </div>

                        {isClosing && trade.pnl !== undefined && (
                          <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/50">
                            <span className="text-xs text-muted-foreground font-mono">
                              Fee ${trade.fee.toFixed(4)}
                            </span>
                            <span
                              className={cn(
                                'font-mono font-semibold tabular-nums',
                                isProfit ? 'text-profit' : isLoss ? 'text-loss' : 'text-foreground'
                              )}
                            >
                              {isProfit ? '+' : ''}${pnl.toFixed(2)}
                            </span>
          </div>
        )}
      </div>
                    );
                  })}
    </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
