'use client';

import { Challenge } from '@/lib/challenge-manager/types';
import { Card } from '../common/Card';
import { Button } from '../common/Button';

interface ChallengeCardProps {
  challenge: Challenge;
  onStart?: () => void;
  onView?: () => void;
}

export function ChallengeCard({ challenge, onStart, onView }: ChallengeCardProps) {
  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-700',
    active: 'bg-blue-100 text-blue-700',
    completed: 'bg-green-100 text-green-700',
  };

  const statusLabels = {
    pending: '待开始',
    active: '进行中',
    completed: '已完成',
  };

  return (
    <Card padding="md" className="hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div>
          <span className="text-lg font-semibold">{challenge.symbol}</span>
          <span
            className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
              statusColors[challenge.status]
            }`}
          >
            {statusLabels[challenge.status]}
          </span>
        </div>
        <span className="text-sm text-gray-500">
          {challenge.paulWeiTrades.length} 笔交易
        </span>
      </div>

      <div className="text-sm text-gray-600 mb-4">
        <p>
          {formatDate(challenge.startTime)} ~ {formatDate(challenge.endTime)}
        </p>
      </div>

      <div className="flex gap-2">
        {challenge.status === 'pending' && onStart && (
          <Button onClick={onStart} size="sm" className="flex-1">
            开始挑战
          </Button>
        )}
        {challenge.status === 'active' && onView && (
          <Button onClick={onView} size="sm" className="flex-1">
            继续挑战
          </Button>
        )}
        {challenge.status === 'completed' && onView && (
          <Button onClick={onView} variant="secondary" size="sm" className="flex-1">
            查看结果
          </Button>
        )}
      </div>
    </Card>
  );
}
