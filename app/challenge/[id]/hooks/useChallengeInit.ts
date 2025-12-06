// 挑战初始化Hook

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useChallengeStore } from '@/stores/challengeStore';
import { useTimeSimulation } from '@/hooks/useTimeSimulation';
import { useTrading } from '@/hooks/useTrading';
import { getOHLCVDataLoader } from '@/lib/data-loader/ohlcvDataLoader';
import { getPaulWeiPnLCalculator } from '@/lib/pnl-calculator';

interface UseChallengeInitResult {
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;
}

/**
 * 挑战初始化Hook
 */
export function useChallengeInit(challengeId: string): UseChallengeInitResult {
  const router = useRouter();
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const {
    setCurrentChallenge,
    setOHLCVData,
    loadPaulWeiOrders,
    loadPaulWeiTrades,
  } = useChallengeStore();

  const { initEngine: initTimeEngine } = useTimeSimulation();
  const { initTrading } = useTrading();

  useEffect(() => {
    mountedRef.current = true;

    const initializeChallenge = async () => {
      if (challengeId !== 'new') {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // 从 sessionStorage 获取挑战参数
        const pendingChallenge = sessionStorage.getItem('pendingChallenge');
        if (!pendingChallenge) {
          console.warn('未找到挑战参数，返回首页');
          if (mountedRef.current) {
            window.location.href = '/';
          }
          return;
        }

        const { startTime, endTime, symbol } = JSON.parse(pendingChallenge);
        
        // 创建模拟挑战数据
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

        if (!mountedRef.current) return;

        setCurrentChallenge(mockChallenge);
        
        // 加载真实K线数据（先加载轻量周期，首屏更快；再懒加载 1m）
        const historyStartTime = new Date(
          new Date(startTime).getTime() - 7 * 24 * 60 * 60 * 1000
        ).toISOString();
        
        const ohlcvLoader = getOHLCVDataLoader();

        // 1) 先加载 5m/1h/1d，快速展示
        const [data5m, data1h, data1d] = await Promise.all([
          ohlcvLoader.loadOHLCV(symbol, '5m', historyStartTime, endTime),
          ohlcvLoader.loadOHLCV(symbol, '1h', historyStartTime, endTime),
          ohlcvLoader.loadOHLCV(symbol, '1d', historyStartTime, endTime),
        ]);

        // 先放一个占位 1m（空数组），让 UI 先渲染
        setOHLCVData({
          '1m': [],
          '5m': data5m,
          '1h': data1h,
          '1d': data1d,
        });

        // 2) 再懒加载 1m，加载完再更新
        const data1m = await ohlcvLoader.loadOHLCV(symbol, '1m', historyStartTime, endTime);

        setOHLCVData({
          '1m': data1m,
          '5m': data5m,
          '1h': data1h,
          '1d': data1d,
        });
        
        console.log('Loaded real OHLCV data:', {
          '1m': data1m.length,
          '5m': data5m.length,
          '1h': data1h.length,
          '1d': data1d.length,
        });

        // 获取挑战开始时的价格（用于计算 Paul Wei 的初始本金）
        const startPriceCandle = data1h.find(
          (c) => new Date(c.timestamp).getTime() >= new Date(startTime).getTime()
        );
        const startPrice = startPriceCandle?.open || 10000;

        // 加载 Paul Wei 的 wallet history，获取他当时的本金
        const paulWeiCalc = getPaulWeiPnLCalculator();
        await paulWeiCalc.loadWalletHistory();
        
        // 用户初始本金 = Paul Wei 当时的余额（USD）
        // 这样两边本金一样，收益率对比才公平
        const initialBalance = paulWeiCalc.getInitialCapitalAt(startTime, startPrice);
        console.log(`Initial balance (Paul Wei's capital at ${startTime}): $${initialBalance.toFixed(2)}`);

        // 更新挑战的初始本金
        mockChallenge.userAccount.balance = initialBalance;
        mockChallenge.userAccount.initialBalance = initialBalance;

        // 初始化引擎
        initTimeEngine(startTime, endTime);
        initTrading(mockChallenge.id, initialBalance);

        // 加载Paul Wei的订单和交易数据
        await Promise.all([
          loadPaulWeiOrders(startTime, endTime, symbol),
          loadPaulWeiTrades(startTime, endTime),
        ]);

        if (mountedRef.current) {
          setIsInitialized(true);
          setIsLoading(false);
          sessionStorage.removeItem('pendingChallenge');
        }
      } catch (err) {
        console.error('初始化挑战失败:', err);
        if (mountedRef.current) {
          setError(err instanceof Error ? err.message : '初始化挑战失败');
          setIsLoading(false);
          // 3秒后返回首页
          setTimeout(() => {
            router.push('/');
          }, 3000);
        }
      }
    };

    initializeChallenge();

    return () => {
      mountedRef.current = false;
    };
  }, [challengeId, router, setCurrentChallenge, setOHLCVData, loadPaulWeiOrders, loadPaulWeiTrades, initTimeEngine, initTrading]);

  return { isInitialized, isLoading, error };
}

