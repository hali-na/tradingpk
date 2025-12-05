'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Symbol } from '@/types/common';
import { ChallengeSelector } from '@/components/challenge/ChallengeSelector';
import { Card, CardTitle } from '@/components/common/Card';

export default function HomePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreateChallenge = async (
    startTime: string,
    endTime: string,
    symbol: Symbol
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      // 存储挑战参数到 sessionStorage
      const challengeData = { startTime, endTime, symbol };
      sessionStorage.setItem(
        'pendingChallenge',
        JSON.stringify(challengeData)
      );
      
      // 验证数据已保存
      const saved = sessionStorage.getItem('pendingChallenge');
      if (!saved) {
        throw new Error('无法保存挑战数据');
      }

      // 使用 window.location 直接跳转，更可靠
      window.location.href = '/challenge/new';
      
      // 备用方案：如果上面的方法不行，尝试 router.push
      // setTimeout(() => {
      //   router.push('/challenge/new');
      // }, 100);
    } catch (err) {
      console.error('创建挑战失败:', err);
      setError(err instanceof Error ? err.message : '创建挑战失败');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-8 flex items-center justify-center">
      <div className="container mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        {/* Hero Section */}
        <div className="space-y-6">
          {/* Profile Image */}
          <div className="mb-6">
            <Image
              src="/截屏2025-12-04 01.31.15.png"
              alt="Profile"
              width={400}
              height={120}
              className="rounded-lg shadow-lg border border-primary/20"
              priority
            />
          </div>
          <h1 className="text-6xl font-bold text-foreground leading-tight" style={{ textShadow: '0 0 15px hsl(var(--primary)/0.5)' }}>
            挑战传奇
            <br />
            <span className="text-primary">复盘经典</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-lg">
            在 <span className="text-primary font-semibold">TradingPK</span>，你将直面传奇交易员 Paul Wei。我们为你复刻了真实历史行情，让你可以在相同的市场环境下，与顶级高手进行公平对决。
          </p>
          <div className="flex gap-4 pt-4">
            <div className="p-4 rounded-lg glass-card border-l-4 border-primary">
              <p className="text-3xl font-bold font-mono">100+</p>
              <p className="text-sm text-muted-foreground">经典战役</p>
            </div>
            <div className="p-4 rounded-lg glass-card border-l-4 border-cyan-400">
              <p className="text-3xl font-bold font-mono">10M+</p>
              <p className="text-sm text-muted-foreground">模拟成交额</p>
            </div>
          </div>
        </div>

        {/* Challenge Selector Section */}
        <div className="w-full">
          <ChallengeSelector
            onCreateChallenge={handleCreateChallenge}
            isLoading={isLoading}
          />
        </div>

        {/* Error message handling */}
        {error && (
          <div className="md:col-span-2 mt-6 p-4 bg-destructive/20 border border-destructive/50 rounded-lg text-destructive-foreground">
            {error}
          </div>
        )}
      </div>
    </div>
  );

}

