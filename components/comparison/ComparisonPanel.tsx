'use client';

import { ComparisonMetrics } from '@/lib/comparison/types';

interface ComparisonPanelProps {
  metrics: ComparisonMetrics | null;
  isLoading?: boolean;
}

export function ComparisonPanel({ metrics, isLoading }: ComparisonPanelProps) {
  if (isLoading) {
    return (
      <div className="glass-card border-2 border-primary/30 rounded-xl shadow-lg p-4 backdrop-blur-xl">
        <h3 className="text-lg font-bold mb-4 text-primary" style={{ textShadow: '0 0 10px hsl(var(--primary)/0.5)' }}>实时对比</h3>
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-primary/20 rounded w-3/4"></div>
          <div className="h-4 bg-primary/20 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="glass-card border-2 border-primary/30 rounded-xl shadow-lg p-4 backdrop-blur-xl">
        <h3 className="text-lg font-bold mb-4 text-primary" style={{ textShadow: '0 0 10px hsl(var(--primary)/0.5)' }}>实时对比</h3>
        <p className="text-muted-foreground text-sm">等待交易数据...</p>
      </div>
    );
  }

  const isWinning = metrics.returnDiff > 0;
  const isTie = Math.abs(metrics.returnDiff) < 0.01;

  return (
    <div className="glass-card border-2 border-primary/30 rounded-xl shadow-lg p-4 backdrop-blur-xl">
      <h3 className="text-lg font-bold mb-4 text-primary" style={{ textShadow: '0 0 10px hsl(var(--primary)/0.5)' }}>实时对比</h3>

      {/* 收益率对比 */}
      <div className="mb-6">
        <div className="flex justify-between items-end mb-2">
          <div className="text-center flex-1">
            <div className="text-sm text-muted-foreground font-medium mb-1">你的收益率</div>
            <div
              className={`text-2xl font-bold font-mono ${
                metrics.userReturn >= 0 ? 'text-profit' : 'text-loss'
              }`}
              style={{ textShadow: metrics.userReturn >= 0 ? '0 0 10px hsl(var(--profit)/0.5)' : '0 0 10px hsl(var(--loss)/0.5)' }}
            >
              {metrics.userReturn >= 0 ? '+' : ''}
              {metrics.userReturn.toFixed(2)}%
            </div>
          </div>
          <div className="text-primary/60 text-xl px-4 font-bold">VS</div>
          <div className="text-center flex-1">
            <div className="text-sm text-muted-foreground font-medium mb-1">paul wei</div>
            <div
              className={`text-2xl font-bold font-mono ${
                metrics.paulWeiReturn >= 0 ? 'text-profit' : 'text-loss'
              }`}
              style={{ textShadow: metrics.paulWeiReturn >= 0 ? '0 0 10px hsl(var(--profit)/0.5)' : '0 0 10px hsl(var(--loss)/0.5)' }}
            >
              {metrics.paulWeiReturn >= 0 ? '+' : ''}
              {metrics.paulWeiReturn.toFixed(2)}%
            </div>
          </div>
        </div>

        {/* 差距 */}
        <div
          className={`text-center py-2 rounded-lg font-bold ${
            isTie
              ? 'bg-background/50 text-muted-foreground border border-primary/20'
              : isWinning
              ? 'bg-profit/20 text-profit border-2 border-profit/50'
              : 'bg-loss/20 text-loss border-2 border-loss/50'
          }`}
          style={isWinning ? { boxShadow: '0 0 15px hsl(var(--profit)/0.3)' } : isTie ? {} : { boxShadow: '0 0 15px hsl(var(--loss)/0.3)' }}
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
    <div className="flex justify-between py-1.5 border-b border-primary/10 last:border-0">
      <span className="text-muted-foreground font-medium">{label}</span>
      <div className="flex gap-4">
        <span className="text-primary font-mono font-semibold">{userValue}</span>
        <span className="text-primary/40">/</span>
        <span className="text-accent font-mono font-semibold">{paulWeiValue}</span>
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
