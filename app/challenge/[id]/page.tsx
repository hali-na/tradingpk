'use client';

import React, { useCallback, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Side, OrderType } from '@/types/common';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { Button } from '@/components/common/Button';
import { useChallengeInit, useChallengeMetrics } from './hooks';
import { ChallengeHeader } from './components/ChallengeHeader';
import { ChallengeLayout } from './components/ChallengeLayout';
import { useTrading } from '@/hooks/useTrading';
import { useTimeSimulation } from '@/hooks/useTimeSimulation';
import { useChallengeStore } from '@/stores/challengeStore';

export default function ChallengePage() {
  const params = useParams();
  const router = useRouter();
  const challengeId = params.id as string;

  // 初始化逻辑
  const { isInitialized, isLoading, error } = useChallengeInit(challengeId);

  // 指标更新逻辑
  useChallengeMetrics(isInitialized);

  // 交易相关
  // 价格现在由K线图组件通过onPriceChange回调更新（单一数据源）
  const { currentTime, start, pause, setSpeed, getProgress, formatRemainingTime } = useTimeSimulation();
  const {
    placeOrder,
    closePosition,
    closeAllPositions,
    cancelOrder,
  } = useTrading();

  const { currentChallenge, comparisonMetrics } = useChallengeStore();

  // 交易处理函数
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

  // 金字塔下单处理函数
  const handlePlaceLadderOrders = useCallback(
    (orders: Array<{ side: Side; quantity: number; price: number; type: OrderType }>) => {
      const timestamp = currentTime || new Date().toISOString();
      let successCount = 0;
      let failCount = 0;
      
      orders.forEach((order) => {
        const result = placeOrder(order.side, order.quantity, order.type, order.price, timestamp);
        if (result.success) {
          successCount++;
        } else {
          failCount++;
        }
      });
      
      if (failCount > 0) {
        alert(`成功下达 ${successCount} 个订单，失败 ${failCount} 个`);
      } else {
        alert(`成功下达 ${successCount} 个订单`);
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
    const id = currentChallenge?.id || challengeId;
    if (!id) {
      alert('挑战ID无效');
      return;
    }
    
    if (confirm('确定要结束挑战吗？')) {
      // 保存结果到 sessionStorage
      const result = {
        challengeId: id,
        userReturn: comparisonMetrics?.userReturn || 0,
        paulWeiReturn: comparisonMetrics?.paulWeiReturn || 0,
        winner: (comparisonMetrics?.returnDiff || 0) > 0 ? 'user' : 'paulWei',
        comparison: { metrics: comparisonMetrics, insights: [], winner: 'user' },
        duration: 0,
        completedAt: new Date().toISOString(),
      };
      sessionStorage.setItem('challengeResult', JSON.stringify(result));
      router.push(`/results/${id}`);
    }
  }, [currentChallenge, challengeId, comparisonMetrics, router]);

  // 加载状态
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4 animate-spin" style={{ filter: 'drop-shadow(0 0 10px hsl(var(--primary)))' }}></div>
          <p className="text-muted-foreground">正在初始化挑战...</p>
        </div>
      </div>
    );
  }

  // 错误状态
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-md glass-card p-8 rounded-2xl">
          <div className="text-destructive text-5xl mb-4">🚫</div>
          <h2 className="text-xl font-semibold text-foreground mb-2">初始化失败</h2>
          <p className="text-muted-foreground mb-6">{error}</p>
          <Button onClick={() => router.push('/')} className="mt-4 bg-primary text-primary-foreground hover:bg-primary/90">
            返回首页
          </Button>
        </div>
      </div>
    );
  }

  // 未初始化状态
  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4 animate-spin" style={{ filter: 'drop-shadow(0 0 10px hsl(var(--primary)))' }}></div>
          <p className="text-muted-foreground">正在加载挑战数据...</p>
        </div>
      </div>
    );
  }

  // 主要内容
  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-background text-foreground">
        <ChallengeHeader onEndChallenge={handleEndChallenge} />
        <ChallengeLayout
            onPlaceOrder={handlePlaceOrder}
          onPlaceLadderOrders={handlePlaceLadderOrders}
            onClosePosition={handleClosePositionWithTime}
            onCloseAll={handleCloseAllWithTime}
            onCancelOrder={cancelOrder}
          />
        </div>
    </ErrorBoundary>
  );
}
