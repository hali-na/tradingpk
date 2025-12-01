'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/common/Button';
import { Card, CardTitle } from '@/components/common/Card';
import { ChallengeResult } from '@/lib/challenge-manager/types';

export default function HistoryPage() {
  const router = useRouter();
  const [history, setHistory] = useState<ChallengeResult[]>([]);

  useEffect(() => {
    // 从 localStorage 加载历史记录
    try {
      const data = localStorage.getItem('tradingpk_challenge_results');
      if (data) {
        setHistory(JSON.parse(data));
      }
    } catch {
      console.error('Failed to load history');
    }
  }, []);

  const stats = {
    total: history.length,
    wins: history.filter((r) => r.winner === 'user').length,
    losses: history.filter((r) => r.winner === 'paulWei').length,
    ties: history.filter((r) => r.winner === 'tie').length,
    avgReturn:
      history.length > 0
        ? history.reduce((sum, r) => sum + r.userReturn, 0) / history.length
        : 0,
  };

  const clearHistory = () => {
    if (confirm('确定要清除所有历史记录吗？')) {
      localStorage.removeItem('tradingpk_challenge_results');
      setHistory([]);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* 标题 */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">挑战历史</h1>
            <p className="text-gray-600 mt-1">查看你与 paul wei 的对战记录</p>
          </div>
          <Button variant="secondary" onClick={() => router.push('/')}>
            返回首页
          </Button>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <Card padding="md" className="text-center">
            <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-sm text-gray-500">总场次</div>
          </Card>
          <Card padding="md" className="text-center">
            <div className="text-3xl font-bold text-green-600">{stats.wins}</div>
            <div className="text-sm text-gray-500">胜利</div>
          </Card>
          <Card padding="md" className="text-center">
            <div className="text-3xl font-bold text-red-600">{stats.losses}</div>
            <div className="text-sm text-gray-500">失败</div>
          </Card>
          <Card padding="md" className="text-center">
            <div
              className={`text-3xl font-bold ${
                stats.avgReturn >= 0 ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {stats.avgReturn >= 0 ? '+' : ''}
              {stats.avgReturn.toFixed(2)}%
            </div>
            <div className="text-sm text-gray-500">平均收益</div>
          </Card>
        </div>

        {/* 历史列表 */}
        <Card padding="lg">
          <div className="flex items-center justify-between mb-4">
            <CardTitle>挑战记录</CardTitle>
            {history.length > 0 && (
              <Button variant="ghost" size="sm" onClick={clearHistory}>
                清除历史
              </Button>
            )}
          </div>

          {history.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">暂无挑战记录</p>
              <Button onClick={() => router.push('/')}>开始第一次挑战</Button>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((result, index) => (
                <div
                  key={index}
                  className="border rounded-lg p-4 flex items-center justify-between hover:bg-gray-50"
                >
                  <div className="flex items-center gap-4">
                    <span
                      className={`text-2xl ${
                        result.winner === 'user'
                          ? ''
                          : result.winner === 'tie'
                          ? ''
                          : ''
                      }`}
                    >
                      {result.winner === 'user'
                        ? '🏆'
                        : result.winner === 'tie'
                        ? '🤝'
                        : '😔'}
                    </span>
                    <div>
                      <div className="font-medium">
                        {result.winner === 'user'
                          ? '胜利'
                          : result.winner === 'tie'
                          ? '平局'
                          : '失败'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(result.completedAt).toLocaleDateString('zh-CN')}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2">
                      <span
                        className={`font-mono font-semibold ${
                          result.userReturn >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {result.userReturn >= 0 ? '+' : ''}
                        {result.userReturn.toFixed(2)}%
                      </span>
                      <span className="text-gray-400">vs</span>
                      <span
                        className={`font-mono ${
                          result.paulWeiReturn >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {result.paulWeiReturn >= 0 ? '+' : ''}
                        {result.paulWeiReturn.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
