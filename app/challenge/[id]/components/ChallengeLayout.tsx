// 挑战页面布局组件

'use client';

import { useState } from 'react';
import { KLineChart, TimeframeSelector } from '@/components/chart';
import { TimeController, TradingPanel } from '@/components/trading';
import { ComparisonPanel } from '@/components/comparison';
import { PaulWeiStrategyPanel, PaulWeiTradeHistory } from '@/components/paulWei';
import { Side, OrderType } from '@/types/common';
import { useChallengeStore } from '@/stores/challengeStore';
import { useTradingStore } from '@/stores/tradingStore';
import { useTimeSimulation } from '@/hooks/useTimeSimulation';
import { useTrading } from '@/hooks/useTrading';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

type PaulWeiViewMode = 'off' | 'trades' | 'orders' | 'all';

interface ChallengeLayoutProps {
  onPlaceOrder: (side: Side, quantity: number, orderType: OrderType, price?: number) => void;
  onPlaceLadderOrders?: (orders: Array<{ side: Side; quantity: number; price: number; type: OrderType }>) => void;
  onClosePosition: (positionId: string) => void;
  onCloseAll: () => void;
  onCancelOrder: (orderId: string) => void;
}

export function ChallengeLayout({
  onPlaceOrder,
  onPlaceLadderOrders,
  onClosePosition,
  onCloseAll,
  onCancelOrder,
}: ChallengeLayoutProps) {
  const [paulWeiViewMode, setPaulWeiViewMode] = useState<PaulWeiViewMode>('trades');

  const {
    currentChallenge,
    paulWeiTrades,
    paulWeiOrders,
    ohlcvData,
    currentTimeframe,
    comparisonMetrics,
    setCurrentTimeframe,
  } = useChallengeStore();

  const { currentPrice, updateCurrentPrice } = useTradingStore();
  const {
    currentTime,
    speed,
    isPaused,
    start,
    pause,
    setSpeed,
    getProgress,
    formatRemainingTime,
  } = useTimeSimulation();

  const {
    balance,
    positions,
    orders,
    trades,
  } = useTrading();

  const currentOHLCV = ohlcvData?.[currentTimeframe] || [];

  // K线图价格变化回调 - 单一数据源，确保下单价格与图表显示一致
  const handlePriceChange = (price: number) => {
    updateCurrentPrice(price);
  };

  return (
    <div className="p-4 grid grid-cols-12 gap-4 h-[calc(100vh-80px)]">
      {/* 左侧：K线图 */}
      <div className="col-span-8 space-y-4 flex flex-col min-w-0">
        <div className="glass-card p-4 rounded-xl flex-shrink-0">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <TimeframeSelector
              current={currentTimeframe}
              onChange={setCurrentTimeframe}
            />
            <div className="flex items-center gap-4">
              <div className="text-sm text-muted-foreground">
                当前价格: <span className="font-mono font-semibold text-foreground text-base">${currentPrice.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
              </div>
            </div>
          </div>
          {/* 状态栏 */}
          <div className="mt-3 grid grid-cols-2 lg:grid-cols-4 gap-2 text-xs text-muted-foreground">
            <div className="glass-card px-3 py-2 rounded-lg border border-primary/20">
              <div className="font-medium text-foreground">当前时间</div>
              <div className="font-mono text-sm text-primary truncate">{currentTime || '--'}</div>
            </div>
            <div className="glass-card px-3 py-2 rounded-lg border border-primary/20">
              <div className="font-medium text-foreground">速度</div>
              <div className="font-mono text-sm">{speed}x {isPaused ? '(暂停)' : '(播放中)'}</div>
            </div>
            <div className="glass-card px-3 py-2 rounded-lg border border-primary/20">
              <div className="font-medium text-foreground">进度</div>
              <div className="font-mono text-sm">{getProgress().toFixed(1)}%</div>
            </div>
            <div className="glass-card px-3 py-2 rounded-lg border border-primary/20">
              <div className="font-medium text-foreground">剩余</div>
              <div className="font-mono text-sm">{formatRemainingTime()}</div>
            </div>
          </div>
        </div>

        <div className="glass-card p-4 rounded-xl flex-grow min-h-0 relative overflow-hidden">
          {currentTimeframe === '1m' && currentOHLCV.length === 0 && (
            <div className="mb-3 text-xs text-muted-foreground">
              1m 数据加载中，文件较大，稍后自动显示。
            </div>
          )}
          <KLineChart
            data={currentOHLCV}
            paulWeiTrades={paulWeiTrades}
            userTrades={trades}
            paulWeiOrders={paulWeiOrders}
            userOrders={orders}
            currentTime={currentTime}
            startTime={currentChallenge?.startTime}
            height={400}
            paulWeiViewMode={paulWeiViewMode}
            onPaulWeiViewModeChange={setPaulWeiViewMode}
            historyDays={7}
            onPriceChange={handlePriceChange}
          />
        </div>
        
        {/* 播放器 - 独立在K线图下方，不遮挡坐标轴 */}
        <div className="flex-shrink-0">
          <TimeController
            currentTime={currentTime}
            speed={speed}
            isPaused={isPaused}
            remainingTime={formatRemainingTime()}
            progress={getProgress()}
            onPlay={start}
            onPause={pause}
            onSpeedChange={setSpeed}
          />
        </div>
      </div>

      {/* 右侧：分 Tab，交易/对比为主，Paul Wei 信息折叠 */}
      <div className="col-span-4 h-full overflow-y-auto space-y-4">
        <Tabs defaultValue="trade" className="glass-card rounded-xl p-3">
          <TabsList className="grid grid-cols-3 gap-1 glass-card border border-primary/30">
            <TabsTrigger value="trade">交易</TabsTrigger>
            <TabsTrigger value="compare">对比</TabsTrigger>
            <TabsTrigger value="paul">Paul Wei</TabsTrigger>
          </TabsList>

          <TabsContent value="trade" className="space-y-4 p-2">
            <TradingPanel
              currentPrice={currentPrice}
              balance={balance}
              symbol={currentChallenge?.symbol || 'XBTUSD'}
              positions={positions}
              orders={orders}
              trades={trades}
              onPlaceOrder={onPlaceOrder}
              onPlaceLadderOrders={onPlaceLadderOrders}
              onClosePosition={onClosePosition}
              onCloseAll={onCloseAll}
              onCancelOrder={onCancelOrder}
            />
          </TabsContent>

          <TabsContent value="compare" className="space-y-4 p-2">
            <ComparisonPanel metrics={comparisonMetrics} />
          </TabsContent>

          <TabsContent value="paul" className="space-y-4 p-2">
            {currentChallenge && (
              <PaulWeiTradeHistory
                startTime={currentChallenge.startTime}
                endTime={currentTime || currentChallenge.endTime}
                symbol={currentChallenge.symbol}
              />
            )}
            <PaulWeiStrategyPanel
              orders={paulWeiOrders}
              trades={paulWeiTrades}
              currentTime={currentTime}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

