'use client';

import { UserPosition } from '@/types/trading';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

interface PositionListProps {
  positions: UserPosition[];
  onClosePosition: (positionId: string) => void;
  onCloseAll: () => void;
}

export function PositionList({ positions, onClosePosition, onCloseAll }: PositionListProps) {
  const totalPnl = positions.reduce((sum, pos) => sum + pos.unrealizedPnl, 0);

  return (
    <Card glass>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base text-foreground">持仓</CardTitle>
          {positions.length > 0 && (
            <Button variant="destructive" size="sm" onClick={onCloseAll} className="h-8 shadow-[0_0_10px_hsl(var(--destructive))] hover:shadow-[0_0_15px_hsl(var(--destructive))]">
              全部平仓
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {positions.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-3xl mb-2">🛰️</p>
            <p className="text-sm text-muted-foreground">暂无持仓</p>
          </div>
        ) : (
          <div className="space-y-3">
            {positions.map((position) => (
              <div
                key={position.id}
                className={cn(
                  'rounded-lg p-3 glass border-2',
                  position.side === 'Long'
                    ? 'border-profit/50'
                    : 'border-loss/50'
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <Badge variant={position.side === 'Long' ? 'long' : 'short'} className="shadow-none w-12 justify-center">
                        {position.side === 'Long' ? '多' : '空'}
                      </Badge>
                      <span className="font-mono text-sm font-semibold text-foreground">
                        {position.quantity.toLocaleString()} USD
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground font-mono">
                      开仓 @ ${position.entryPrice.toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right space-y-1">
                    <p
                      className={cn(
                        'font-mono font-semibold text-lg tabular-nums',
                        position.unrealizedPnl >= 0 ? 'text-profit' : 'text-loss'
                      )}
                      style={{
                        filter: `drop-shadow(0 0 5px hsl(var(--${position.unrealizedPnl >= 0 ? 'profit' : 'loss'})))`
                      }}
                    >
                      {position.unrealizedPnl >= 0 ? '+' : ''}
                      {position.unrealizedPnl.toFixed(2)}
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onClosePosition(position.id)}
                      className="h-7 text-xs text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                    >
                      平仓
                    </Button>
                  </div>
                </div>
              </div>
            ))}

            <div className="pt-3 border-t border-border/50 flex justify-between items-center">
              <span className="text-sm text-foreground">总浮动盈亏</span>
              <span
                className={cn(
                  'font-mono font-semibold text-lg tabular-nums',
                  totalPnl >= 0 ? 'text-profit' : 'text-loss'
                )}
                 style={{
                  filter: `drop-shadow(0 0 8px hsl(var(--${totalPnl >= 0 ? 'profit' : 'loss'})))`
                }}
              >
                {totalPnl >= 0 ? '+' : ''}{totalPnl.toFixed(2)}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
