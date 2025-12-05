'use client';

import { useState, useMemo } from 'react';
import { Side, OrderType } from '@/types/common';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

interface LadderOrderFormProps {
  currentPrice: number;
  balance: number;
  onPlaceOrders: (orders: LadderOrder[]) => void;
}

export interface LadderOrder {
  side: Side;
  quantity: number;
  price: number;
  type: OrderType;
}

type LadderDirection = 'buy' | 'sell';
type DistributionType = 'equal' | 'pyramid' | 'reverse-pyramid';

export function LadderOrderForm({ currentPrice, balance, onPlaceOrders }: LadderOrderFormProps) {
  const [direction, setDirection] = useState<LadderDirection>('buy');
  const [orderCount, setOrderCount] = useState(5);
  const [priceStep, setPriceStep] = useState('25'); // 每档价差
  const [totalQuantity, setTotalQuantity] = useState('10000');
  const [distribution, setDistribution] = useState<DistributionType>('pyramid');
  const [startOffset, setStartOffset] = useState('0'); // 起始价格偏移

  // 计算阶梯订单
  const ladderOrders = useMemo((): LadderOrder[] => {
    const orders: LadderOrder[] = [];
    const qty = parseFloat(totalQuantity);
    const step = parseFloat(priceStep);
    const offset = parseFloat(startOffset);
    
    if (isNaN(qty) || qty <= 0 || isNaN(step) || step <= 0) return orders;

    // 计算起始价格
    const startPrice = direction === 'buy' 
      ? currentPrice - offset 
      : currentPrice + offset;

    // 计算每档数量权重
    const weights: number[] = [];
    for (let i = 0; i < orderCount; i++) {
      switch (distribution) {
        case 'equal':
          weights.push(1);
          break;
        case 'pyramid':
          // 买入时：越低价格越多量；卖出时：越高价格越多量
          weights.push(i + 1);
          break;
        case 'reverse-pyramid':
          // 买入时：越高价格越多量；卖出时：越低价格越多量
          weights.push(orderCount - i);
          break;
      }
    }
    const totalWeight = weights.reduce((a, b) => a + b, 0);

    // 生成订单
    for (let i = 0; i < orderCount; i++) {
      const price = direction === 'buy'
        ? startPrice - (i * step)  // 买单价格递减
        : startPrice + (i * step); // 卖单价格递增
      
      const orderQty = Math.round((qty * weights[i]) / totalWeight);
      
      if (orderQty > 0 && price > 0) {
        orders.push({
          side: direction === 'buy' ? 'Buy' : 'Sell',
          quantity: orderQty,
          price: Math.round(price * 10) / 10, // 保留一位小数
          type: 'Limit',
        });
      }
    }

    return orders;
  }, [direction, orderCount, priceStep, totalQuantity, distribution, startOffset, currentPrice]);

  const totalValue = ladderOrders.reduce((sum, o) => sum + o.quantity, 0);
  const priceRange = ladderOrders.length > 0 
    ? `$${Math.min(...ladderOrders.map(o => o.price)).toLocaleString()} - $${Math.max(...ladderOrders.map(o => o.price)).toLocaleString()}`
    : '-';

  const handleSubmit = () => {
    if (ladderOrders.length === 0) return;
    onPlaceOrders(ladderOrders);
  };

  return (
    <Card glass>
      <CardHeader className="pb-4">
        <CardTitle className="text-base flex items-center gap-2 text-foreground">
          阶梯挂单
          <Badge variant="outline" className="ml-auto text-xs font-mono border-border/50">学习 Paul Wei</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* 方向选择 */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={() => setDirection('buy')}
            variant={direction === 'buy' ? 'buy' : 'secondary'}
            className="w-full h-14"
          >
            <span className="flex flex-col items-center">
              <span className="text-base font-semibold">阶梯买入</span>
              <span className="text-xs opacity-80">底部吸筹</span>
            </span>
          </Button>
          <Button
            onClick={() => setDirection('sell')}
            variant={direction === 'sell' ? 'sell' : 'secondary'}
            className="w-full h-14"
          >
            <span className="flex flex-col items-center">
              <span className="text-base font-semibold">阶梯卖出</span>
              <span className="text-xs opacity-80">顶部出货</span>
            </span>
          </Button>
        </div>

        {/* 参数设置 */}
        <div className="space-y-4 p-4 rounded-lg glass">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground">订单数量</label>
              <div className="grid grid-cols-4 gap-1">
                {[3, 5, 7, 10].map(n => (
                  <button
                    key={n}
                    onClick={() => setOrderCount(n)}
                    className={cn(
                      'py-1.5 text-sm rounded-md transition-all border-2',
                      orderCount === n
                        ? 'bg-primary/80 text-primary-foreground border-primary'
                        : 'bg-muted/30 text-muted-foreground hover:bg-muted/70 border-transparent'
                    )}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground">每档价差 ($)</label>
              <Input
                type="number"
                value={priceStep}
                onChange={(e) => setPriceStep(e.target.value)}
                className="font-mono h-9 bg-transparent border-border/50 focus:border-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground">总数量 (张)</label>
              <Input
                type="number"
                value={totalQuantity}
                onChange={(e) => setTotalQuantity(e.target.value)}
                className="font-mono h-9 bg-transparent border-border/50 focus:border-primary"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground">起始偏移 ($)</label>
              <Input
                type="number"
                value={startOffset}
                onChange={(e) => setStartOffset(e.target.value)}
                placeholder="0"
                className="font-mono h-9 bg-transparent border-border/50 focus:border-primary"
              />
            </div>
          </div>

          {/* 分配方式 */}
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">数量分配</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'equal', label: '等量', icon: '▬▬▬' },
                { value: 'pyramid', label: '金字塔', icon: direction === 'buy' ? '▲' : '▼' },
                { value: 'reverse-pyramid', label: '倒金字塔', icon: direction === 'buy' ? '▼' : '▲' },
              ].map(d => (
                <button
                  key={d.value}
                  onClick={() => setDistribution(d.value as DistributionType)}
                  className={cn(
                    'py-2 text-xs rounded-md transition-all border-2 flex flex-col items-center gap-1',
                    distribution === d.value
                      ? 'bg-primary/80 text-primary-foreground border-primary'
                      : 'bg-muted/30 text-muted-foreground hover:bg-muted/70 border-transparent'
                  )}
                >
                  <span className="text-lg leading-none">{d.icon}</span>
                  <span>{d.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 订单预览 */}
        <div className="space-y-3 pt-4 border-t border-border/50">
          <div className="flex justify-between items-center text-sm">
            <span className="text-foreground font-medium">订单预览</span>
            <span className="font-mono text-muted-foreground text-xs">{priceRange}</span>
          </div>
          
          <div className="max-h-40 overflow-y-auto space-y-1.5 p-2 rounded-lg bg-background/50">
            {ladderOrders.map((order, i) => (
              <div
                key={i}
                className="flex items-center justify-between text-xs p-2 rounded-md glass"
              >
                <div className="flex items-center gap-2">
                  <span className="text-primary font-mono w-4">#{i + 1}</span>
                  <Badge variant={order.side === 'Buy' ? 'long' : 'short'} className="text-xs shadow-none w-10 justify-center">
                    {order.side}
                  </Badge>
                  <span className="font-mono font-medium text-foreground">{order.quantity.toLocaleString()}</span>
                </div>
                <span className="font-mono text-foreground">${order.price.toLocaleString()}</span>
              </div>
            ))}
             {ladderOrders.length === 0 && (
                <div className="text-center py-4 text-muted-foreground text-xs">调整参数以生成订单</div>
            )}
          </div>

          <div className="flex justify-between text-sm pt-2 border-t border-border/50">
            <span className="text-muted-foreground">总数量</span>
            <span className="font-mono font-semibold text-foreground">{totalValue.toLocaleString()} 张</span>
          </div>
        </div>

        <Button
          onClick={handleSubmit}
          disabled={ladderOrders.length === 0}
          className="w-full h-12 text-base"
          variant={direction === 'buy' ? 'buy' : 'sell'}
        >
          下达 {ladderOrders.length} 个{direction === 'buy' ? '买入' : '卖出'}订单
        </Button>

        {/* Paul Wei 策略提示 */}
        <div className="text-xs text-muted-foreground space-y-1 p-3 rounded-lg glass">
          <p className="font-medium text-primary/80">💡 Paul Wei 的阶梯策略:</p>
          <p className="font-mono">{'>'} 每档价差约 $25，共 5-8 档</p>
          <p className="font-mono">{'>'} 金字塔分配：越远离当前价，数量越大</p>
          <p className="font-mono">{'>'} 快速连续下单，1秒内完成所有挂单</p>
        </div>
      </CardContent>
    </Card>
  );
}
