'use client';

import { UserPosition } from '@/types/trading';
import { Button } from '../common/Button';

interface PositionListProps {
  positions: UserPosition[];
  onClosePosition: (positionId: string) => void;
  onCloseAll: () => void;
}

export function PositionList({ positions, onClosePosition, onCloseAll }: PositionListProps) {
  if (positions.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-semibold mb-4">持仓</h3>
        <p className="text-gray-500 text-sm">暂无持仓</p>
      </div>
    );
  }

  const totalPnl = positions.reduce((sum, pos) => sum + pos.unrealizedPnl, 0);

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">持仓</h3>
        <Button variant="danger" size="sm" onClick={onCloseAll}>
          全部平仓
        </Button>
      </div>

      <div className="space-y-3">
        {positions.map((position) => (
          <div
            key={position.id}
            className="border rounded-lg p-3 flex items-center justify-between"
          >
            <div>
              <div className="flex items-center gap-2">
                <span
                  className={`px-2 py-0.5 text-xs rounded ${
                    position.side === 'Long'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }`}
                >
                  {position.side === 'Long' ? '多' : '空'}
                </span>
                <span className="font-mono text-sm">
                  {position.quantity.toLocaleString()} USD
                </span>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                开仓价: ${position.entryPrice.toLocaleString()}
              </div>
            </div>
            <div className="text-right">
              <div
                className={`font-mono font-semibold ${
                  position.unrealizedPnl >= 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {position.unrealizedPnl >= 0 ? '+' : ''}
                ${position.unrealizedPnl.toFixed(2)}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onClosePosition(position.id)}
                className="mt-1"
              >
                平仓
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-3 border-t">
        <div className="flex justify-between">
          <span className="text-gray-600">总浮动盈亏:</span>
          <span
            className={`font-mono font-semibold ${
              totalPnl >= 0 ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {totalPnl >= 0 ? '+' : ''}${totalPnl.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
}
