// 挑战页面头部组件

'use client';

import { useChallengeStore } from '@/stores/challengeStore';
import { useTrading } from '@/hooks/useTrading';
import { Button } from '@/components/common/Button';

interface ChallengeHeaderProps {
  onEndChallenge: () => void;
}

export function ChallengeHeader({ onEndChallenge }: ChallengeHeaderProps) {
  const { currentChallenge } = useChallengeStore();
  const { balance, positions } = useTrading();

  const safeBalance = balance ?? 0;
  const safePositions = positions || [];
  
  const unrealizedPnl = safePositions.reduce((sum, pos) => sum + (pos.unrealizedPnl || 0), 0);
  const equity = safeBalance + unrealizedPnl;

  const displayBalance = isNaN(safeBalance) ? 0 : safeBalance;
  const displayEquity = isNaN(equity) ? 0 : equity;

  return (
    <header className="glass-card rounded-none border-b border-border/50 px-6 py-3 flex items-center justify-between sticky top-0 z-50">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-bold text-primary" style={{ textShadow: '0 0 5px hsl(var(--primary))' }}>TradingPK</h1>
        <span className="text-muted-foreground">|</span>
        <span className="text-foreground">
          {currentChallenge?.symbol || 'XBTUSD'}{' '}
          <span className="text-xs text-muted-foreground ml-1">
            (USD ≈ 张数)
          </span>
        </span>
      </div>
      <div className="flex items-center gap-6">
        <div className="text-sm text-right">
          <div>
            <span className="text-muted-foreground">权益: </span>
            <span className="font-mono font-semibold text-lg text-foreground">
              ${displayEquity.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="text-xs text-muted-foreground">
            可用: <span className="font-mono">${displayBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
        </div>
        <Button variant="danger" size="sm" onClick={onEndChallenge} className="shadow-[0_0_10px_hsl(var(--destructive))] hover:shadow-[0_0_20px_hsl(var(--destructive))] transition-all">
          结束挑战
        </Button>
      </div>
    </header>
  );
}

