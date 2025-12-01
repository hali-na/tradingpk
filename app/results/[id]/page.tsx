'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/common/Button';
import { Card, CardTitle } from '@/components/common/Card';
import { ShareCard } from '@/components/share/ShareCard';
import { ChallengeResult } from '@/lib/challenge-manager/types';

export default function ResultsPage() {
  const params = useParams();
  const router = useRouter();
  const [result, setResult] = useState<ChallengeResult | null>(null);

  useEffect(() => {
    // 从 sessionStorage 获取结果
    const savedResult = sessionStorage.getItem('challengeResult');
    if (savedResult) {
      setResult(JSON.parse(savedResult));
    }
  }, []);

  if (!result) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">没有找到挑战结果</p>
          <Button onClick={() => router.push('/')}>返回首页</Button>
        </div>
      </div>
    );
  }

  const isWinner = result.winner === 'user';
  const isTie = result.winner === 'tie';

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* 标题 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">挑战结束</h1>
          <p className="text-gray-600">
            {isTie
              ? '势均力敌！'
              : isWinner
              ? '恭喜你击败了 paul wei！'
              : '继续努力，下次一定能赢！'}
          </p>
        </div>

        {/* 结果卡片 */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* 详细数据 */}
          <Card padding="lg">
            <CardTitle>挑战详情</CardTitle>
            
            <div className="mt-6 space-y-6">
              {/* 收益对比 */}
              <div className="text-center">
                <div className="flex justify-center items-end gap-8 mb-4">
                  <div>
                    <div className="text-sm text-gray-500 mb-1">你的收益</div>
                    <div
                      className={`text-3xl font-bold ${
                        result.userReturn >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {result.userReturn >= 0 ? '+' : ''}
                      {result.userReturn.toFixed(2)}%
                    </div>
                  </div>
                  <div className="text-2xl text-gray-400">VS</div>
                  <div>
                    <div className="text-sm text-gray-500 mb-1">paul wei</div>
                    <div
                      className={`text-3xl font-bold ${
                        result.paulWeiReturn >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {result.paulWeiReturn >= 0 ? '+' : ''}
                      {result.paulWeiReturn.toFixed(2)}%
                    </div>
                  </div>
                </div>

                {/* 结果标签 */}
                <div
                  className={`inline-block px-4 py-2 rounded-full text-lg font-semibold ${
                    isTie
                      ? 'bg-gray-100 text-gray-700'
                      : isWinner
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }`}
                >
                  {isTie ? '🤝 平局' : isWinner ? '🏆 胜利' : '😔 惜败'}
                </div>
              </div>

              {/* 详细指标 */}
              {result.comparison?.metrics && (
                <div className="border-t pt-4 space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">交易次数</span>
                    <span>
                      {result.comparison.metrics.userTradeCount} vs{' '}
                      {result.comparison.metrics.paulWeiTradeCount}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">胜率</span>
                    <span>
                      {result.comparison.metrics.userWinRate?.toFixed(1)}% vs{' '}
                      {result.comparison.metrics.paulWeiWinRate?.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">总手续费</span>
                    <span>
                      ${result.comparison.metrics.userTotalFees?.toFixed(2)} vs $
                      {result.comparison.metrics.paulWeiTotalFees?.toFixed(2)}
                    </span>
                  </div>
                </div>
              )}

              {/* 洞察 */}
              {result.comparison?.insights && result.comparison.insights.length > 0 && (
                <div className="border-t pt-4">
                  <h4 className="font-medium text-gray-700 mb-2">分析建议</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {result.comparison.insights.map((insight, index) => (
                      <li key={index}>• {insight}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </Card>

          {/* 分享卡片 */}
          <div>
            <ShareCard result={result} />
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="mt-8 flex justify-center gap-4">
          <Button variant="secondary" onClick={() => router.push('/')}>
            返回首页
          </Button>
          <Button onClick={() => router.push('/')}>再来一局</Button>
        </div>
      </div>
    </div>
  );
}
