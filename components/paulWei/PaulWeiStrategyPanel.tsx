'use client';

import { useMemo, useRef } from 'react';
import { PaulWeiOrder } from '@/lib/data-loader/paulWeiOrdersLoader';
import { PaulWeiTrade } from '@/types/paulWei';
import { PaulWeiStrategyAnalyzer, StrategyMetrics } from '@/lib/analysis/PaulWeiStrategyAnalyzer';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface PaulWeiStrategyPanelProps {
  orders: PaulWeiOrder[];
  trades: PaulWeiTrade[];
  currentTime?: string;
}

export function PaulWeiStrategyPanel({
  orders,
  trades,
  currentTime,
}: PaulWeiStrategyPanelProps) {
  // 使用 useRef 确保 analyzer 只创建一次，避免模块级别的实例化导致 SSR 问题
  const analyzerRef = useRef<PaulWeiStrategyAnalyzer | null>(null);
  if (!analyzerRef.current) {
    analyzerRef.current = new PaulWeiStrategyAnalyzer();
  }
  
  const filteredOrders = useMemo(() => {
    if (!currentTime) return orders;
    const currentTimeMs = new Date(currentTime).getTime();
    return orders.filter((o) => new Date(o.timestamp).getTime() <= currentTimeMs);
  }, [orders, currentTime]);

  const filteredTrades = useMemo(() => {
    if (!currentTime) return trades;
    const currentTimeMs = new Date(currentTime).getTime();
    return trades.filter((t) => new Date(t.datetime).getTime() <= currentTimeMs);
  }, [trades, currentTime]);

  const metrics = useMemo(() => {
    return analyzerRef.current!.analyzeCompleteStrategy(filteredOrders, filteredTrades);
  }, [filteredOrders, filteredTrades]);

  if (filteredOrders.length === 0 && filteredTrades.length === 0) {
    return (
      <Card glass>
        <CardHeader>
          <CardTitle className="text-base text-foreground">Paul Wei 策略分析</CardTitle>
        </CardHeader>
        <CardContent className="text-center py-6">
          <p className="text-3xl mb-2">🧬</p>
          <p className="text-sm text-muted-foreground">暂无数据</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card glass>
      <CardHeader>
        <CardTitle className="text-base flex items-center justify-between text-foreground">
          <span>🧬 Paul Wei 策略分析</span>
          <span className="text-sm text-muted-foreground font-mono">
            {filteredOrders.length} ord / {filteredTrades.length} trd
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        
        {/* Order Type Distribution */}
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-2">订单类型分布</h4>
          <div className="grid grid-cols-3 gap-3">
            <StrategyStatBox label="限价单" value={metrics.orderTypeDistribution.limit} total={metrics.orderTypeDistribution.total} color="primary" />
            <StrategyStatBox label="市价单" value={metrics.orderTypeDistribution.market} total={metrics.orderTypeDistribution.total} color="profit" />
            <StrategyStatBox label="止损单" value={metrics.orderTypeDistribution.stop} total={metrics.orderTypeDistribution.total} color="loss" />
          </div>
        </div>

        {/* Order Status */}
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-2">订单执行情况</h4>
          <div className="space-y-3">
            <StatusProgressBar label="已成交" value={metrics.orderStatusDistribution.filled} total={metrics.orderStatusDistribution.total} variant="profit" />
            <StatusProgressBar label="已取消" value={metrics.orderStatusDistribution.canceled} total={metrics.orderStatusDistribution.total} variant="loss" />
          </div>
        </div>

        {/* Trade Frequency */}
        {metrics.tradeFrequency.tradesPerHour > 0 && (
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2">交易频率</h4>
            <div className="grid grid-cols-3 gap-3">
                <FreqStatBox label="每小时" value={metrics.tradeFrequency.tradesPerHour.toFixed(1)} />
                <FreqStatBox label="每天" value={metrics.tradeFrequency.tradesPerDay.toFixed(1)} />
                <FreqStatBox label="平均间隔" value={`${metrics.tradeFrequency.avgTimeBetweenTrades.toFixed(1)}m`} />
            </div>
          </div>
        )}
        
        {/* Strategy Summary */}
        <div className="pt-3 border-t border-border/50">
          <h4 className="text-sm font-medium text-muted-foreground mb-2">策略特点</h4>
          <div className="space-y-1.5 text-xs font-mono text-muted-foreground">
            {metrics.orderTypeDistribution.limit / metrics.orderTypeDistribution.total > 0.7 && (
              <p>{'>'} 主要使用 <span className="text-primary">限价单</span> 进行精准价格控制</p>
            )}
            {metrics.cancelRate > 20 && (
              <p>{'>'} 高订单取消率 (<span className="text-loss">{metrics.cancelRate.toFixed(1)}%</span>), 策略动态调整频繁</p>
            )}
            {metrics.tradeFrequency.tradesPerDay > 10 && (
              <p>{'>'} 高频交易策略, 平均每天 <span className="text-profit">{metrics.tradeFrequency.tradesPerDay.toFixed(0)}</span> 笔交易</p>
            )}
            {metrics.commonOrderSizes.length > 0 && (
              <p>{'>'} 使用固定订单大小模式, 主要使用 <span className="text-accent">{metrics.commonOrderSizes[0].size.toLocaleString()}</span> 等标准化数量</p>
            )}
          </div>
        </div>

      </CardContent>
    </Card>
  );
}

// Helper components for consistent styling

const StrategyStatBox = ({label, value, total, color}: {label: string, value: number, total: number, color: 'primary' | 'profit' | 'loss'}) => (
    <div className="p-3 rounded-lg glass text-center">
        <div className="text-xs text-muted-foreground mb-1">{label}</div>
        <div className={`text-2xl font-bold font-mono text-${color}`}>{value}</div>
        <div className="text-xs text-muted-foreground mt-1">
            {((value / total) * 100).toFixed(1)}%
        </div>
    </div>
)

const StatusProgressBar = ({label, value, total, variant}: {label: string, value: number, total: number, variant: 'profit' | 'loss'}) => (
    <div className="p-3 rounded-lg glass">
        <div className="flex items-center justify-between mb-1.5">
            <span className="text-sm text-foreground">{label}</span>
            <span className={`text-lg font-semibold font-mono text-${variant}`}>{value}</span>
        </div>
        <Progress value={(value / total) * 100} variant={variant} />
    </div>
)

const FreqStatBox = ({label, value}: {label: string, value: string}) => (
    <div className="p-3 rounded-lg glass text-center">
        <div className="text-xs text-muted-foreground mb-1">{label}</div>
        <div className="text-lg font-semibold font-mono text-foreground">{value}</div>
    </div>
)


