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
      <div className="container mx-auto grid grid-cols-1 lg:grid-cols-5 gap-12 items-center">
        {/* Hero Section */}
        <div className="md:flex-row items-center gap-8 lg:col-span-3">
          {/* New Profile Card */}
          <div className="w-[280px] h-[380px] glass-card rounded-2xl overflow-hidden border border-primary/30 p-4 flex flex-col items-center justify-center flex-shrink-0 shadow-lg hover:shadow-primary/20 transition-shadow duration-300">
            <div className="relative w-full h-full rounded-lg overflow-hidden group">
              <Image
                src="/截屏2025-12-04 01.31.15.png"
                alt="Paul Wei"
                layout="fill"
                objectFit="cover"
                className="z-0 opacity-70 group-hover:opacity-90 transition-opacity duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent z-10"></div>
              <div className="absolute inset-0 border-2 border-primary/50 rounded-lg group-hover:border-primary transition-colors duration-300 animate-pulse"></div>
              <div className="absolute bottom-4 left-4 z-20">
                <h3 className="text-2xl font-bold text-white" style={{ textShadow: '0 0 10px hsl(var(--primary))' }}>Paul Wei</h3>
                <p className="text-sm text-primary-foreground/80">传奇交易员</p>
              </div>
            </div>
          </div>

          {/* Hero Text */}
          <div className="space-y-6 text-center md:text-left">
            <h1 className="text-5xl lg:text-6xl font-bold text-foreground leading-tight" style={{ textShadow: '0 0 20px hsl(var(--primary)/0.5)' }}>
              挑战传奇
              <br />
              <span className="text-primary">复盘经典</span>
            </h1>
            <p className="text-lg lg:text-xl text-muted-foreground max-w-md mx-auto md:mx-0">
              在 <span className="text-primary font-semibold">TradingPK</span>，你将直面传奇交易员 Paul Wei。我们为你复刻了真实历史行情，让你可以在相同的市场环境下，与顶级高手进行公平对决。
            </p>
            <div className="flex gap-4 pt-4 justify-center md:justify-start">
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
        </div>

        {/* Challenge Selector Section */}
        <div className="w-full lg:col-span-2">
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

