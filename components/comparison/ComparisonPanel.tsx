'use client';

import { ComparisonMetrics } from '@/lib/comparison/types';

interface ComparisonPanelProps {
  metrics: ComparisonMetrics | null;
  isLoading?: boolean;
}

export function ComparisonPanel({ metrics, isLoading }: ComparisonPanelProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-semibold mb-4">实时对比</h3>
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-semibold mb-4">实时对比</h3>
        <p className="text-gray-500 text-sm">等待交易数据...</p>
      </div>
    );
  }

  const isWinning = metrics.returnDiff > 0;
  const isTie = Math.abs(metrics.returnDiff) < 0.01;

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="text-lg font-semibold mb-4">实时对比</h3>

      {/* 收益率对比 */}
      <div className="mb-6">
        <div className="flex justify-between items-end mb-2">
          <div className="text-center flex-1">
            <div className="text-sm text-gray-500">你的收益率</div>
            <div
              className={`text-2xl font-bold ${
                metrics.userReturn >= 0 ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {metrics.userReturn >= 0 ? '+' : ''}
              {metrics.userReturn.toFixed(2)}%
            </div>
          </div>
          <div className="text-gray-400 text-xl px-4">VS</div>
          <div className="text-center flex-1">
            <div className="text-sm text-gray-500">paul wei</div>
            <div
              className={`text-2xl font-bold ${
                metrics.paulWeiReturn >= 0 ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {metrics.paulWeiReturn >= 0 ? '+' : ''}
              {metrics.paulWeiReturn.toFixed(2)}%
            </div>
          </div>
        </div>

        {/* 差距 */}
        <div
          className={`text-center py-2 rounded-lg ${
            isTie
              ? 'bg-gray-100 text-gray-600'
              : isWinning
              ? 'bg-green-100 text-green-700'
              : 'bg-red-100 text-red-700'
          }`}
        >
          {isTie ? (
            '平局'
          ) : isWinning ? (
            <>领先 {metrics.returnDiff.toFixed(2)}% 🎉</>
          ) : (
            <>落后 {Math.abs(metrics.returnDiff).toFixed(2)}% 📈</>
          )}
        </div>
      </div>

      {/* 详细指标 */}
      <div className="space-y-3 text-sm">
        <MetricRow
          label="交易次数"
          userValue={metrics.userTradeCount.toString()}
          paulWeiValue={metrics.paulWeiTradeCount.toString()}
        />
        <MetricRow
          label="胜率"
          userValue={`${metrics.userWinRate.toFixed(1)}%`}
          paulWeiValue={`${metrics.paulWeiWinRate.toFixed(1)}%`}
        />
        <MetricRow
          label="平均持仓"
          userValue={formatHoldTime(metrics.userAvgHoldTime)}
          paulWeiValue={formatHoldTime(metrics.paulWeiAvgHoldTime)}
        />
        <MetricRow
          label="资金使用率"
          userValue={`${metrics.userCapitalUtilization.toFixed(1)}%`}
          paulWeiValue={`${metrics.paulWeiCapitalUtilization.toFixed(1)}%`}
        />
        <MetricRow
          label="总手续费"
          userValue={`$${metrics.userTotalFees.toFixed(2)}`}
          paulWeiValue={`$${metrics.paulWeiTotalFees.toFixed(2)}`}
        />
      </div>
    </div>
  );
}

function MetricRow({
  label,
  userValue,
  paulWeiValue,
}: {
  label: string;
  userValue: string;
  paulWeiValue: string;
}) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-500">{label}</span>
      <div className="flex gap-4">
        <span className="text-blue-600 font-mono">{userValue}</span>
        <span className="text-gray-400">/</span>
        <span className="text-orange-600 font-mono">{paulWeiValue}</span>
      </div>
    </div>
  );
}

function formatHoldTime(hours: number): string {
  if (hours < 1) {
    return `${Math.round(hours * 60)}分`;
  }
  if (hours < 24) {
    return `${hours.toFixed(1)}时`;
  }
  return `${(hours / 24).toFixed(1)}天`;
}
