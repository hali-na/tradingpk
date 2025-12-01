'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* 标题区域 */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            TradingPK
          </h1>
          <p className="text-xl text-gray-600 mb-2">
            PK 顶级交易员 paul wei
          </p>
          <p className="text-gray-500">
            选择历史时间段，在相同的市场环境下进行模拟交易，对比双方的交易表现
          </p>
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* 挑战选择器 */}
        <div className="grid md:grid-cols-2 gap-8">
          <ChallengeSelector
            onCreateChallenge={handleCreateChallenge}
            isLoading={isLoading}
          />

          {/* 游戏说明 */}
          <Card padding="lg">
            <CardTitle>游戏规则</CardTitle>
            <div className="mt-4 space-y-4 text-sm text-gray-600">
              <div className="flex gap-3">
                <span className="text-2xl">🎯</span>
                <div>
                  <p className="font-medium text-gray-800">选择时间段</p>
                  <p>选择包含 paul wei 交易记录的历史时间段</p>
                </div>
              </div>
              <div className="flex gap-3">
                <span className="text-2xl">📈</span>
                <div>
                  <p className="font-medium text-gray-800">模拟交易</p>
                  <p>在相同的市场环境下进行模拟交易，支持时间加速</p>
                </div>
              </div>
              <div className="flex gap-3">
                <span className="text-2xl">⚖️</span>
                <div>
                  <p className="font-medium text-gray-800">公平对比</p>
                  <p>双方使用相同的初始资金($10,000)和手续费率</p>
                </div>
              </div>
              <div className="flex gap-3">
                <span className="text-2xl">🏆</span>
                <div>
                  <p className="font-medium text-gray-800">查看结果</p>
                  <p>挑战结束后对比收益率，生成分享卡片</p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* 特色功能 */}
        <div className="mt-12 grid grid-cols-3 gap-6 text-center">
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="text-3xl mb-2">⏱️</div>
            <h3 className="font-semibold mb-1">时间加速</h3>
            <p className="text-sm text-gray-500">1x ~ 100x 速度控制</p>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="text-3xl mb-2">📊</div>
            <h3 className="font-semibold mb-1">多周期K线</h3>
            <p className="text-sm text-gray-500">1m/5m/1h/1d 自由切换</p>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="text-3xl mb-2">🎨</div>
            <h3 className="font-semibold mb-1">分享卡片</h3>
            <p className="text-sm text-gray-500">精美结果图一键分享</p>
          </div>
        </div>
      </div>
    </div>
  );
}

