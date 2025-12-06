'use client';

import { useState, useEffect, useRef } from 'react';
import { Symbol } from '@/types/common';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { PaulWeiDataLoader } from '@/lib/data-loader/paulWeiDataLoader';
import { HighlightMoments, HighlightMoment } from './HighlightMoments';
import { SparklesIcon, TargetIcon, TrendingUpIcon, CalendarIcon, DollarSignIcon } from '@/components/common/icons';

type ChallengeMode = 'highlight' | 'custom';

interface ChallengeSelectorProps {
  onCreateChallenge: (startTime: string, endTime: string, symbol: Symbol) => void;
  isLoading?: boolean;
}

export function ChallengeSelector({ onCreateChallenge, isLoading }: ChallengeSelectorProps) {
  const [mode, setMode] = useState<ChallengeMode>('highlight');
  const [startDate, setStartDate] = useState('2020-05-01');
  const [endDate, setEndDate] = useState('2020-05-07');
  const [symbol, setSymbol] = useState<Symbol>('XBTUSD');
  const [tradeDates, setTradeDates] = useState<Set<string>>(new Set());
  const [tradeCount, setTradeCount] = useState(0);
  const [isLoadingTrades, setIsLoadingTrades] = useState(false);
  
  // 将 loader 移到组件内部，使用 useRef 确保只创建一次，避免模块级别的实例化导致 SSR 问题
  const paulWeiLoaderRef = useRef<PaulWeiDataLoader | null>(null);
  if (!paulWeiLoaderRef.current) {
    paulWeiLoaderRef.current = new PaulWeiDataLoader();
  }

  const handleHighlightSelect = (moment: HighlightMoment) => {
    onCreateChallenge(moment.startTime, moment.endTime, moment.symbol);
  };

  useEffect(() => {
    const loadTrades = async () => {
      if (!startDate || !endDate) return;
      
      setIsLoadingTrades(true);
      try {
        const startTime = new Date(startDate + 'T00:00:00.000Z').toISOString();
        const endTime = new Date(endDate + 'T23:59:59.999Z').toISOString();
        
        const trades = await paulWeiLoaderRef.current!.loadPaulWeiTrades(startTime, endTime);
        const filteredTrades = symbol 
          ? trades.filter(t => t.symbol === symbol)
          : trades;
        
        const dates = new Set<string>();
        filteredTrades.forEach(trade => {
          const date = new Date(trade.datetime).toISOString().split('T')[0];
          dates.add(date);
        });
        
        setTradeDates(dates);
        setTradeCount(filteredTrades.length);
      } catch (error) {
        console.error('加载交易数据失败:', error);
        setTradeDates(new Set());
        setTradeCount(0);
      } finally {
        setIsLoadingTrades(false);
      }
    };

    loadTrades();
  }, [startDate, endDate, symbol]);

  const handleSubmit = () => {
    const startTime = new Date(startDate).toISOString();
    const endTime = new Date(endDate + 'T23:59:59').toISOString();
    onCreateChallenge(startTime, endTime, symbol);
  };

  const presets = [
    { label: '7天', days: 7 },
    { label: '30天', days: 30 },
    { label: '90天', days: 90 },
  ];

  const applyPreset = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);
    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
  };

  const symbols: { value: Symbol; label: string }[] = [
    { value: 'XBTUSD', label: 'BTC' },
    { value: 'ETHUSD', label: 'ETH' },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* 模式选择 */}
      <Card glass>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setMode('highlight')}
              className={cn(
                'group relative p-4 rounded-lg border-2 text-left transition-all overflow-hidden',
                mode === 'highlight'
                  ? 'border-primary shadow-[0_0_15px_hsl(var(--primary))]'
                  : 'border-border hover:border-primary/50'
              )}
            >
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-2">
                  <SparklesIcon className="w-6 h-6" />
                  <span className="font-semibold text-lg text-foreground">高光时刻</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  挑战 Paul Wei 的经典操作，学习顶级策略
                </p>
              </div>
            </button>
            
            <button
              onClick={() => setMode('custom')}
              className={cn(
                'group relative p-4 rounded-lg border-2 text-left transition-all overflow-hidden',
                mode === 'custom'
                  ? 'border-primary shadow-[0_0_15px_hsl(var(--primary))]'
                  : 'border-border hover:border-primary/50'
              )}
            >
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-2">
                  <TargetIcon className="w-6 h-6" />
                  <span className="font-semibold text-lg text-foreground">自定义挑战</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  选择任意时间段，与 Paul Wei 同台竞技
                </p>
              </div>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* 高光时刻模式 */}
      {mode === 'highlight' && (
        <HighlightMoments onSelectMoment={handleHighlightSelect} />
      )}

      {/* 自定义模式 */}
      {mode === 'custom' && (
        <Card glass>
          <CardHeader>
            <CardTitle>自定义挑战</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 快速选择 */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">快速选择</label>
          <div className="flex gap-2">
            {presets.map((preset) => (
              <Button
                key={preset.days}
                variant="outline"
                size="sm"
                className="bg-transparent hover:bg-primary/10 hover:text-primary transition-all"
                onClick={() => applyPreset(preset.days)}
              >
                {preset.label}
              </Button>
            ))}
          </div>
        </div>

        {/* 日期选择 */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">开始日期</label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-transparent border-border/50 focus:border-primary focus:ring-primary/50"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">结束日期</label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-transparent border-border/50 focus:border-primary focus:ring-primary/50"
            />
          </div>
        </div>

        {/* 交易对选择 */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">交易对</label>
          <div className="flex gap-2">
            {symbols.map((s) => (
              <button
                key={s.value}
                onClick={() => setSymbol(s.value)}
                className={cn(
                  'flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all border-2',
                  symbol === s.value
                    ? 'bg-primary/90 text-primary-foreground shadow-[0_0_10px_hsl(var(--primary))] border-primary'
                    : 'bg-secondary/50 text-muted-foreground hover:bg-secondary/80 border-transparent'
                )}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <Separator className="bg-border/50" />

        {/* Paul Wei 数据预览 */}
        <div className="rounded-lg glass p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">Paul Wei 交易数据</span>
            {isLoadingTrades && (
              <span className="text-xs text-muted-foreground animate-pulse">加载中...</span>
            )}
          </div>

          {isLoadingTrades ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-24 bg-muted/50" />
              <Skeleton className="h-4 w-32 bg-muted/50" />
            </div>
          ) : tradeCount > 0 ? (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2">
                  <TrendingUpIcon className="w-4 h-4" />
                  <span className="text-sm text-foreground">
                    <span className="font-mono font-semibold">{tradeCount}</span> 笔交易
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4" />
                  <span className="text-sm text-foreground">
                    <span className="font-mono font-semibold">{tradeDates.size}</span> 天
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto rounded-md p-1 bg-background/30">
                {Array.from(tradeDates).sort().map((date) => (
                  <Badge key={date} variant="secondary" className="font-mono text-xs bg-primary/10 text-primary-foreground">
                    {date.slice(5)}
                  </Badge>
                ))}
              </div>
            </>
          ) : (
            <p className="text-sm text-amber-500">
              该时间段内没有 {symbol} 交易记录
            </p>
          )}
        </div>

        {/* 挑战信息 */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <DollarSignIcon className="w-4 h-4" />
          <span>初始资金 $10,000 USD</span>
        </div>

            {/* 开始按钮 */}
            <Button
              onClick={handleSubmit}
              disabled={isLoading || tradeCount === 0}
              className="w-full h-12 text-base bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-300 hover:shadow-[0_0_20px_hsl(var(--primary))] disabled:bg-muted/50 disabled:shadow-none"
            >
              {isLoading ? '创建中...' : '开始挑战'}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
