'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Side, OrderType } from '@/types/common';
import { KLineChart, TimeframeSelector } from '@/components/chart';
import { TimeController, TradingPanel } from '@/components/trading';
import { ComparisonPanel } from '@/components/comparison';
import { Button } from '@/components/common/Button';
import { useTimeSimulation } from '@/hooks/useTimeSimulation';
import { useTrading } from '@/hooks/useTrading';
import { useChallengeStore } from '@/stores/challengeStore';
import { ComparisonAnalyzerImpl } from '@/lib/comparison/ComparisonAnalyzer';

const comparisonAnalyzer = new ComparisonAnalyzerImpl();

export default function ChallengePage() {
  const params = useParams();
  const router = useRouter();
  const challengeId = params.id as string;

  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPaulWeiTrades, setShowPaulWeiTrades] = useState(false); // 是否显示 paul wei 交易标记

  const {
    currentChallenge,
    paulWeiTrades,
    ohlcvData,
    currentTimeframe,
    comparisonMetrics,
    setCurrentTimeframe,
    setComparisonMetrics,
    setCurrentChallenge,
    setOHLCVData,
    setPaulWeiTrades,
  } = useChallengeStore();

  const {
    currentTime,
    speed,
    isPaused,
    initEngine: initTimeEngine,
    start,
    pause,
    setSpeed,
    getProgress,
    formatRemainingTime,
    getCurrentPrice,
  } = useTimeSimulation();

  const {
    initTrading,
    account,
    currentPrice,
    positions,
    orders,
    trades,
    balance,
    placeOrder,
    closePosition,
    closeAllPositions,
    cancelOrder,
    updateCurrentPrice,
  } = useTrading();

  // 初始化挑战
  useEffect(() => {
    let mounted = true;

    const initializeChallenge = async () => {
      if (challengeId === 'new') {
        try {
          setIsLoading(true);
          setError(null);

          // 从 sessionStorage 获取挑战参数
          const pendingChallenge = sessionStorage.getItem('pendingChallenge');
          if (!pendingChallenge) {
            console.warn('未找到挑战参数，返回首页');
            if (mounted) {
              // 使用 window.location 直接跳转
              window.location.href = '/';
            }
            return;
          }

          const { startTime, endTime, symbol } = JSON.parse(pendingChallenge);
          
          // 创建模拟数据（实际应从API加载）
          const mockChallenge = {
            id: `challenge_${Date.now()}`,
            startTime,
            endTime,
            symbol,
            status: 'active' as const,
            userAccount: {
              balance: 10000,
              initialBalance: 10000,
              positions: [],
              orders: [],
              trades: [],
            },
            paulWeiTrades: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          if (!mounted) return;

          setCurrentChallenge(mockChallenge);
          
          // 生成模拟K线数据（包含开始时间前7天的历史数据）
          const historyStartTime = new Date(new Date(startTime).getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
          const mockOHLCV = generateMockOHLCV(historyStartTime, endTime);
          setOHLCVData(mockOHLCV);

          // 初始化引擎
          initTimeEngine(startTime, endTime);
          initTrading(mockChallenge.id, 10000);

          if (mounted) {
            setIsInitialized(true);
            setIsLoading(false);
            sessionStorage.removeItem('pendingChallenge');
          }
        } catch (err) {
          console.error('初始化挑战失败:', err);
          if (mounted) {
            setError(err instanceof Error ? err.message : '初始化挑战失败');
            setIsLoading(false);
            // 3秒后返回首页
            setTimeout(() => {
              router.push('/');
            }, 3000);
          }
        }
      } else {
        setIsLoading(false);
      }
    };

    initializeChallenge();

    return () => {
      mounted = false;
    };
  }, [challengeId]); // 只依赖 challengeId，避免重复执行

  // 更新当前价格和对比数据
  useEffect(() => {
    if (!isInitialized || !ohlcvData) return;

    const price = getCurrentPrice();
    if (price > 0) {
      // 使用节流更新，避免过于频繁的更新
      const timeoutId = setTimeout(() => {
        updateCurrentPrice(price);
      }, 100); // 100ms 节流

      return () => clearTimeout(timeoutId);
    }
  }, [currentTime, isInitialized, ohlcvData, getCurrentPrice, updateCurrentPrice]);

  // 单独处理对比数据更新，避免与价格更新形成循环
  useEffect(() => {
    if (!isInitialized || !account || !ohlcvData) return;

    const price = getCurrentPrice();
    if (price > 0) {
      // 节流更新对比数据
      const timeoutId = setTimeout(() => {
        const metrics = comparisonAnalyzer.calculateMetrics(
          account,
          paulWeiTrades,
          price,
          account.initialBalance
        );
        setComparisonMetrics(metrics);
      }, 500); // 500ms 节流，对比数据不需要太频繁更新

      return () => clearTimeout(timeoutId);
    }
  }, [currentTime, account, paulWeiTrades, isInitialized, ohlcvData, getCurrentPrice, setComparisonMetrics]);

  const handlePlaceOrder = useCallback(
    (side: Side, quantity: number, orderType: OrderType, price?: number) => {
      const timestamp = currentTime || new Date().toISOString();
      const result = placeOrder(side, quantity, orderType, price, timestamp);
      if (!result.success) {
        alert(result.error);
      }
    },
    [placeOrder, currentTime]
  );

  const handleClosePositionWithTime = useCallback(
    (positionId: string) => {
      const timestamp = currentTime || new Date().toISOString();
      closePosition(positionId, timestamp);
    },
    [closePosition, currentTime]
  );

  const handleCloseAllWithTime = useCallback(() => {
    const timestamp = currentTime || new Date().toISOString();
    closeAllPositions(timestamp);
  }, [closeAllPositions, currentTime]);

  const handleEndChallenge = useCallback(() => {
    if (confirm('确定要结束挑战吗？')) {
      // 保存结果到 sessionStorage
      const result = {
        challengeId: currentChallenge?.id,
        userReturn: comparisonMetrics?.userReturn || 0,
        paulWeiReturn: comparisonMetrics?.paulWeiReturn || 0,
        winner: (comparisonMetrics?.returnDiff || 0) > 0 ? 'user' : 'paulWei',
        comparison: { metrics: comparisonMetrics, insights: [], winner: 'user' },
        duration: 0,
        completedAt: new Date().toISOString(),
      };
      sessionStorage.setItem('challengeResult', JSON.stringify(result));
      router.push(`/results/${currentChallenge?.id}`);
    }
  }, [currentChallenge, comparisonMetrics, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">正在初始化挑战...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">初始化失败</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <p className="text-sm text-gray-500">3秒后自动返回首页...</p>
          <Button onClick={() => router.push('/')} className="mt-4">
            立即返回
          </Button>
        </div>
      </div>
    );
  }

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">正在加载挑战数据...</p>
        </div>
      </div>
    );
  }

  const currentOHLCV = ohlcvData?.[currentTimeframe] || [];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* 顶部栏 */}
      <header className="bg-white shadow-sm px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold">TradingPK</h1>
          <span className="text-gray-500">|</span>
          <span className="text-gray-600">
            {currentChallenge?.symbol}{' '}
            <span className="text-xs text-gray-400 ml-1">
              单位：下单金额 (USD) ≈ 合约张数
            </span>
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-right">
            <div>
              <span className="text-gray-500">权益: </span>
              <span className="font-mono font-semibold">
                ${(balance + positions.reduce((s, p) => s + p.unrealizedPnl, 0)).toLocaleString()}
              </span>
            </div>
            <div className="text-xs text-gray-500">
              可用余额: <span className="font-mono">${balance.toLocaleString()}</span>
            </div>
          </div>
          <Button variant="danger" size="sm" onClick={handleEndChallenge}>
            结束挑战
          </Button>
        </div>
      </header>

      {/* 主体区域 */}
      <div className="p-4 grid grid-cols-12 gap-4">
        {/* 左侧：K线图 */}
        <div className="col-span-8 space-y-4">
          {/* 时间周期选择器和控制按钮 */}
          <div className="flex items-center justify-between">
            <TimeframeSelector
              current={currentTimeframe}
              onChange={setCurrentTimeframe}
            />
            <div className="flex items-center gap-4">
              {/* 显示 paul wei 交易标记的开关 */}
              <button
                onClick={() => setShowPaulWeiTrades(!showPaulWeiTrades)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  showPaulWeiTrades
                    ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                title={showPaulWeiTrades ? '隐藏 paul wei 交易标记' : '显示 paul wei 交易标记（复盘模式）'}
              >
                <span className="text-lg">{showPaulWeiTrades ? '👁️' : '👁️‍🗨️'}</span>
                <span>{showPaulWeiTrades ? '显示PW' : '隐藏PW'}</span>
              </button>
              <div className="text-sm text-gray-500">
                当前价格: <span className="font-mono font-semibold text-gray-900">${currentPrice.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* K线图 */}
          <KLineChart
            data={currentOHLCV}
            paulWeiTrades={paulWeiTrades}
            userTrades={trades}
            currentTime={currentTime}
            startTime={currentChallenge?.startTime}
            height={450}
            showPaulWeiTrades={showPaulWeiTrades}
            historyDays={7}
          />

          {/* 时间控制器 */}
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

        {/* 右侧：交易面板和对比 */}
        <div className="col-span-4 space-y-4">
          {/* 对比面板 */}
          <ComparisonPanel metrics={comparisonMetrics} />
          
          {/* 交易面板 */}
          <TradingPanel
            currentPrice={currentPrice}
            balance={balance}
            symbol={currentChallenge?.symbol || 'XBTUSD'}
            positions={positions}
            orders={orders}
            trades={trades}
            onPlaceOrder={handlePlaceOrder}
            onClosePosition={handleClosePositionWithTime}
            onCloseAll={handleCloseAllWithTime}
            onCancelOrder={cancelOrder}
          />
        </div>
      </div>
    </div>
  );
}

// 生成模拟K线数据
// 注意：startTime 应该包含历史数据（如开始时间前7天）
function generateMockOHLCV(startTime: string, endTime: string) {
  const start = new Date(startTime).getTime();
  const end = new Date(endTime).getTime();
  
  const generate = (interval: number) => {
    const data = [];
    let price = 9000 + Math.random() * 1000;
    
    for (let time = start; time < end; time += interval) {
      const change = (Math.random() - 0.5) * 100;
      const open = price;
      const close = price + change;
      const high = Math.max(open, close) + Math.random() * 50;
      const low = Math.min(open, close) - Math.random() * 50;
      
      data.push({
        timestamp: new Date(time).toISOString(),
        open,
        high,
        low,
        close,
        volume: Math.random() * 1000000,
        trades: Math.floor(Math.random() * 1000),
      });
      
      price = close;
    }
    
    return data;
  };

  return {
    '1m': generate(60 * 1000),
    '5m': generate(5 * 60 * 1000),
    '1h': generate(60 * 60 * 1000),
    '1d': generate(24 * 60 * 60 * 1000),
  };
}
