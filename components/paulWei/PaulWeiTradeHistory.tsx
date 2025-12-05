'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Symbol } from '@/types/common';
import { 
  PaulWeiRoundTrip, 
  getPaulWeiTradeAnalyzer,
  PaulWeiOrderStyle 
} from '@/lib/data-loader/paulWeiTradeAnalyzer';
import { cn } from '@/lib/utils';

interface PaulWeiTradeHistoryProps {
  startTime: string;
  endTime: string;
  symbol: Symbol;
}

export function PaulWeiTradeHistory({ startTime, endTime, symbol }: PaulWeiTradeHistoryProps) {
  const [roundTrips, setRoundTrips] = useState<PaulWeiRoundTrip[]>([]);
  const [orderStyle, setOrderStyle] = useState<PaulWeiOrderStyle | null>(null);
  const [stats, setStats] = useState<{
    totalTrades: number;
    winRate: number;
    totalPnl: number;
    netPnl: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const analyzer = getPaulWeiTradeAnalyzer();
        await analyzer.loadTrades();
        
        const tradeStats = analyzer.getTradeStats(startTime, endTime, symbol);
        const style = analyzer.analyzeOrderStyle(startTime, endTime, symbol);
        
        setRoundTrips(tradeStats.roundTrips);
        setOrderStyle(style);
        setStats({
          totalTrades: tradeStats.totalTrades,
          winRate: tradeStats.winRate,
          totalPnl: tradeStats.totalPnl,
          netPnl: tradeStats.netPnl,
        });
      } catch (error) {
        console.error('Failed to load Paul Wei trades:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [startTime, endTime, symbol]);

  const formatDuration = (ms: number) => {
    if (ms < 60000) return `${Math.floor(ms / 1000)}s`;
    const minutes = Math.floor(ms / 60000);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remMinutes = minutes % 60;
    return `${hours}h ${remMinutes}m`;
  };
  
  const formatTime = (datetime: string) => {
    return new Date(datetime).toLocaleString('zh-CN', {
      month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
  };

  if (loading) {
    return (
      <Card glass>
        <CardHeader>
          <CardTitle className="text-base text-foreground">📊 Paul Wei 交易记录</CardTitle>
        </CardHeader>
        <CardContent className="py-8 text-center text-muted-foreground">
          加载中...
        </CardContent>
      </Card>
    );
  }

  return (
    <Card glass>
      <CardHeader>
        <CardTitle className="text-base flex items-center justify-between text-foreground">
          <span>📊 Paul Wei 交易记录</span>
          <Badge variant="outline" className="border-border/50">{symbol}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-3 rounded-lg glass">
            <StatItem label="总交易" value={stats.totalTrades.toString()} />
            <StatItem label="胜率" value={`${stats.winRate.toFixed(1)}%`} />
            <StatItem label="总盈亏" value={`$${stats.totalPnl.toFixed(0)}`} pnl={stats.totalPnl} />
            <StatItem label="净盈亏" value={`$${stats.netPnl.toFixed(0)}`} pnl={stats.netPnl} />
          </div>
        )}

        {orderStyle && orderStyle.ladderOrderCount > 0 && (
          <div className="p-3 rounded-lg glass text-xs">
            <div className="text-sm font-medium mb-2 text-primary">💡 下单风格分析</div>
            <div className="grid grid-cols-2 gap-2">
              <AnalysisItem label="阶梯订单次数" value={orderStyle.ladderOrderCount.toString()} />
              <AnalysisItem label="平均价差" value={`$${orderStyle.avgPriceStep.toFixed(1)}`} />
              <AnalysisItem label="平均订单量" value={orderStyle.avgOrderSize.toFixed(0)} />
              <AnalysisItem label="分配方式" value={orderStyle.orderDistribution} />
            </div>
          </div>
        )}

        <div className="space-y-2 max-h-96 overflow-y-auto p-1">
          {roundTrips.length === 0 ? (
            <div className="text-center text-muted-foreground py-4">该时间段内没有完整的交易记录</div>
          ) : (
            roundTrips.map((rt) => (
              <div
                key={rt.id}
                className={cn(
                  'p-3 rounded-lg border-2 cursor-pointer transition-all glass',
                  expanded === rt.id ? (rt.pnl >= 0 ? 'border-profit/80' : 'border-loss/80') : 'border-transparent hover:border-primary/30'
                )}
                onClick={() => setExpanded(expanded === rt.id ? null : rt.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant={rt.direction === 'long' ? 'long' : 'short'} className="shadow-none w-14 justify-center">
                      {rt.direction === 'long' ? '做多' : '做空'}
                    </Badge>
                    <span className="font-mono text-sm text-foreground">{rt.quantity.toLocaleString()}</span>
                  </div>
                  <div className={cn(
                    'font-semibold font-mono text-lg',
                    rt.pnl >= 0 ? 'text-profit' : 'text-loss'
                  )} style={{filter: `drop-shadow(0 0 5px hsl(var(--${rt.pnl >= 0 ? 'profit' : 'loss'})))`}}>
                    {rt.pnl >= 0 ? '+' : ''}{rt.pnl.toFixed(0)}
                    <span className="text-xs ml-1 text-muted-foreground">({rt.pnlPercent.toFixed(2)}%)</span>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-2 text-xs font-mono">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <span>入: ${rt.entryPrice.toLocaleString()}</span>
                    <span>→</span>
                    <span>出: ${rt.exitPrice.toLocaleString()}</span>
                  </div>
                  <div className="text-muted-foreground">{formatDuration(rt.duration)}</div>
                </div>

                {expanded === rt.id && (
                  <div className="mt-3 pt-3 border-t border-border/50 space-y-2 text-xs font-mono">
                    <DetailRow label="入场时间" value={formatTime(rt.entryTime)} />
                    <DetailRow label="出场时间" value={formatTime(rt.exitTime)} />
                    <DetailRow label="手续费" value={`-${rt.feesBTC.toFixed(8)} BTC (≈$${rt.feesUSD.toFixed(2)})`} className="text-loss/80" />
                    
                    {rt.entryTrades.length > 1 && (
                      <div className="pt-2 border-t border-border/20">
                        <div className="text-muted-foreground mb-1">入场订单 ({rt.entryTrades.length} 笔)</div>
                        <div className="space-y-1 max-h-24 overflow-y-auto">
                          {rt.entryTrades.slice(0, 10).map((t, i) => (
                            <div key={i} className="flex justify-between">
                              <span>{t.amount.toLocaleString()}</span>
                              <span>@ ${t.price.toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

const StatItem = ({ label, value, pnl }: { label: string; value: string; pnl?: number }) => (
  <div className="text-center">
    <div className="text-xs text-muted-foreground">{label}</div>
    <div className={cn(
      'font-semibold font-mono text-lg',
      pnl !== undefined && (pnl >= 0 ? 'text-profit' : 'text-loss')
    )}>
      {value}
    </div>
  </div>
);

const AnalysisItem = ({ label, value }: { label: string; value: string }) => (
  <div>
    <span className="text-muted-foreground">{label}: </span>
    <span className="font-semibold text-foreground font-mono">{value}</span>
  </div>
);

const DetailRow = ({ label, value, className }: { label: string; value: string, className?: string }) => (
  <div className="flex justify-between">
    <span className="text-muted-foreground">{label}</span>
    <span className={cn('text-foreground', className)}>{value}</span>
  </div>
);
