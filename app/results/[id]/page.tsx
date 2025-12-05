'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Award,
  BarChart,
  Frown,
  Handshake,
  TrendingUp,
  User,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

import { ShareCard } from '@/components/share/ShareCard';
import { ChallengeResult } from '@/lib/challenge-manager/types';
import { cn } from '@/lib/utils';

function MetricRow({
  label,
  userValue,
  paulValue,
}: {
  label: string;
  userValue: string | number | undefined;
  paulValue: string | number | undefined;
}) {
  return (
    <div className="flex justify-between items-center text-sm">
      <p className="text-muted-foreground">{label}</p>
      <div className="flex items-center gap-2 font-medium tabular-nums">
        <span>{userValue ?? '-'}</span>
        <span className="text-muted-foreground text-xs">vs</span>
        <span>{paulValue ?? '-'}</span>
      </div>
    </div>
  );
}

export default function ResultsPage() {
  const router = useRouter();
  const [result, setResult] = useState<ChallengeResult | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const savedResult = sessionStorage.getItem('challengeResult');
    if (savedResult) {
      setResult(JSON.parse(savedResult));
    }
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null; // or a loading spinner
  }
  
  if (!result) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <Card className="w-full max-w-md text-center animate-in fade-in zoom-in-95">
          <CardHeader>
            <CardTitle>没有找到挑战结果</CardTitle>
            <CardDescription>
              似乎没有有效的挑战结果。您可以返回首页重新开始。
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex justify-center">
            <Button onClick={() => router.push('/')}>
              <User className="mr-2 h-4 w-4" /> 返回首页
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  const isWinner = result.winner === 'user';
  const isTie = result.winner === 'tie';

  const resultIcon = isTie ? (
    <Handshake className="h-20 w-20 text-slate-400" />
  ) : isWinner ? (
    <Award className="h-20 w-20 text-primary" style={{ filter: 'drop-shadow(0 0 15px hsl(var(--primary)/0.8))' }} />
  ) : (
    <Frown className="h-20 w-20 text-destructive" />
  );

  const resultText = isTie
    ? '势均力敌！'
    : isWinner
    ? '恭喜你，挑战成功！'
    : '惜败，请继续努力！';

  const resultDescription = isTie
    ? '你和 Paul Wei 的表现不分上下。'
    : isWinner
    ? '你的表现超越了 Paul Wei，取得了胜利！'
    : '虽然这次失败了，但从中学到的经验更有价值。';

  return (
    <div className="min-h-screen bg-background text-foreground p-4 sm:p-8 overflow-hidden">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10 animate-in fade-in slide-in-from-top-10 duration-500">
          <div className="flex justify-center items-center mb-4">{resultIcon}</div>
          <h1 className="text-5xl font-bold tracking-tight mb-2">{resultText}</h1>
          <p className="text-lg text-muted-foreground">{resultDescription}</p>
        </div>

        <div className="grid md:grid-cols-5 gap-8">
          {/* Main Results */}
          <div className="md:col-span-3 animate-in fade-in slide-in-from-bottom-5 duration-700">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>核心战绩</CardTitle>
                <CardDescription>你与 Paul Wei 的核心指标对比</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Return Comparison */}
                <div className="flex items-center justify-around text-center">
                  <div className="flex flex-col items-center gap-2">
                    <p className="text-sm font-medium text-muted-foreground">
                      你的收益率
                    </p>
                    <p
                      className={cn('text-5xl font-bold tabular-nums', {
                        'text-profit': result.userReturn >= 0,
                        'text-loss': result.userReturn < 0,
                      })}
                    >
                      {result.userReturn >= 0 ? '+' : ''}
                      {result.userReturn.toFixed(2)}%
                    </p>
                  </div>
                  <div className="h-16 w-px bg-border" />
                  <div className="flex flex-col items-center gap-2">
                    <p className="text-sm font-medium text-muted-foreground">
                      Paul Wei 收益率
                    </p>
                    <p
                       className={cn('text-5xl font-bold tabular-nums', {
                        'text-profit': result.paulWeiReturn >= 0,
                        'text-loss': result.paulWeiReturn < 0,
                      })}
                    >
                      {result.paulWeiReturn >= 0 ? '+' : ''}
                      {result.paulWeiReturn.toFixed(2)}%
                    </p>
                  </div>
                </div>

                <Separator />

                {/* Detailed Metrics */}
                {result.comparison?.metrics && (
                  <div className="space-y-4">
                    <MetricRow
                      label="交易次数"
                      userValue={result.comparison.metrics.userTradeCount}
                      paulValue={result.comparison.metrics.paulWeiTradeCount}
                    />
                    <MetricRow
                      label="胜率"
                      userValue={`${result.comparison.metrics.userWinRate?.toFixed(
                        1
                      )}%`}
                      paulValue={`${result.comparison.metrics.paulWeiWinRate?.toFixed(
                        1
                      )}%`}
                    />
                    <MetricRow
                      label="总手续费"
                      userValue={`$${result.comparison.metrics.userTotalFees?.toFixed(
                        2
                      )}`}
                      paulValue={`$${result.comparison.metrics.paulWeiTotalFees?.toFixed(
                        2
                      )}`}
                    />
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex-col items-start gap-4">
                {result.comparison?.insights &&
                  result.comparison.insights.length > 0 && (
                    <>
                      <Separator />
                      <div className="pt-4 w-full">
                        <h4 className="font-semibold mb-2 flex items-center">
                          <BarChart className="mr-2 h-4 w-4 text-primary" />
                          分析与建议
                        </h4>
                        <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
                          {result.comparison.insights.map((insight, index) => (
                            <li key={index}>{insight}</li>
                          ))}
                        </ul>
                      </div>
                    </>
                  )}
              </CardFooter>
            </Card>
          </div>

          {/* Side Panel */}
          <div className="md:col-span-2 space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-900">
            <ShareCard result={result} />
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>再战一场？</CardTitle>
                <CardDescription>
                  准备好后，随时可以开始新的挑战。
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col sm:flex-row gap-4">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => router.push('/')}
                >
                  <User className="mr-2 h-4 w-4" /> 返回首页
                </Button>
                <Button
                  className="w-full"
                  onClick={() => router.push('/')}
                >
                  <TrendingUp className="mr-2 h-4 w-4" /> 开始新挑战
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}