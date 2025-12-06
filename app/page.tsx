'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Symbol } from '@/types/common';
import { ChallengeSelector } from '@/components/challenge/ChallengeSelector';
import { CalendarIcon, ChartIcon, TrophyIcon } from '@/components/common/icons';

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
      const challengeData = { startTime, endTime, symbol };
      sessionStorage.setItem('pendingChallenge', JSON.stringify(challengeData));

      const saved = sessionStorage.getItem('pendingChallenge');
      if (!saved) {
        throw new Error('无法保存挑战数据');
      }

      window.location.href = '/challenge/new';
    } catch (err) {
      console.error('创建挑战失败:', err);
      setError(err instanceof Error ? err.message : '创建挑战失败');
      setIsLoading(false);
    }
  };

  const quickChallenges = [
    { label: '312 暴跌', date: '2020-03-12', desc: '比特币单日跌幅超 50%' },
    { label: '519 崩盘', date: '2021-05-19', desc: '市场恐慌性抛售' },
    { label: '牛市启动', date: '2020-10-21', desc: 'PayPal 宣布支持加密货币' },
  ];

  const handleQuickChallenge = (date: string) => {
    const startTime = new Date(date + 'T00:00:00Z').toISOString();
    const endTime = new Date(date + 'T23:59:59Z').toISOString();
    handleCreateChallenge(startTime, endTime, 'XBTUSD');
  };

  return (
    <div className="min-h-screen overflow-y-auto">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center px-6 py-16">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left: Hero Content */}
            <div className="space-y-8 text-center lg:text-left order-2 lg:order-1">
              <div className="space-y-4">
                <p className="text-primary font-semibold tracking-widest uppercase text-sm">
                  Trading PK
                </p>
                <h1
                  className="text-4xl sm:text-5xl lg:text-6xl font-black leading-tight"
                  style={{ textShadow: '0 0 30px hsl(var(--primary)/0.4)' }}
                >
                  挑战传奇交易员
                  <br />
                  <span className="text-primary">复盘经典行情</span>
                </h1>
                <p className="text-lg text-muted-foreground max-w-lg mx-auto lg:mx-0">
                  在真实历史 K 线中与顶级交易员 Paul Wei 同台竞技。
                  <br className="hidden sm:block" />
                  相同行情、公平对决，用实力证明你的交易直觉。
                </p>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <a
                  href="#challenge"
                  className="px-8 py-4 rounded-xl font-bold text-lg bg-primary text-primary-foreground shadow-lg shadow-primary/40 hover:shadow-primary/60 hover:scale-105 transition-all duration-300 text-center"
                  style={{ textShadow: '0 0 10px rgba(255,255,255,0.3)' }}
                >
                  立即开始 PK
                </a>
                <a
                  href="#how-it-works"
                  className="px-8 py-4 rounded-xl font-bold text-lg border-2 border-primary/50 text-primary hover:bg-primary/10 hover:border-primary transition-all duration-300 text-center"
                >
                  了解更多
                </a>
              </div>

              {/* Stats */}
              <div className="flex gap-6 justify-center lg:justify-start pt-4">
                <div className="glass-card p-4 rounded-xl border-l-4 border-primary min-w-[120px]">
                  <p className="text-3xl font-black font-mono text-primary">100+</p>
                  <p className="text-xs text-muted-foreground mt-1">经典战役可选</p>
                </div>
                <div className="glass-card p-4 rounded-xl border-l-4 border-cyan-400 min-w-[120px]">
                  <p className="text-3xl font-black font-mono text-cyan-400">5年+</p>
                  <p className="text-xs text-muted-foreground mt-1">历史行情数据</p>
                </div>
                <div className="glass-card p-4 rounded-xl border-l-4 border-green-400 min-w-[120px]">
                  <p className="text-3xl font-black font-mono text-green-400">实时</p>
                  <p className="text-xs text-muted-foreground mt-1">收益对比分析</p>
                </div>
              </div>
            </div>

            {/* Right: Paul Wei Card */}
            <div className="flex justify-center order-1 lg:order-2">
              <div className="relative w-[300px] h-[400px] glass-card rounded-2xl overflow-hidden border-2 border-primary/40 shadow-2xl shadow-primary/20 group hover:shadow-primary/40 transition-all duration-500">
                <Image
                  src="/截屏2025-12-04 01.31.15.png"
                  alt="Paul Wei"
                  fill
                  className="object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                <div className="absolute inset-0 border-2 border-primary/30 rounded-2xl group-hover:border-primary/60 transition-colors duration-300" />
                
                {/* Glowing corners */}
                <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-primary rounded-tl-2xl" />
                <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-primary rounded-tr-2xl" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-primary rounded-bl-2xl" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-primary rounded-br-2xl" />

                <div className="absolute bottom-6 left-6 right-6 z-20">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-3 h-3 rounded-full bg-green-400 animate-pulse" />
                    <span className="text-xs text-green-400 font-mono">LEGENDARY</span>
                  </div>
                  <h3
                    className="text-3xl font-black text-white"
                    style={{ textShadow: '0 0 20px hsl(var(--primary))' }}
                  >
                    Paul Wei
                  </h3>
                  <p className="text-sm text-primary-foreground/70 mt-1">
                    BitMEX 传奇交易员
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce">
          <span className="text-xs text-muted-foreground">向下滚动</span>
          <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 px-6 bg-card/30">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-16">
            <p className="text-primary font-semibold tracking-widest uppercase text-sm mb-2">How It Works</p>
            <h2 className="text-3xl sm:text-4xl font-bold" style={{ textShadow: '0 0 20px hsl(var(--primary)/0.3)' }}>
              三步开启你的挑战
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: '选择战役',
                desc: '挑选一个历史时间段，可以是 312 暴跌、519 崩盘，或任意你感兴趣的日期。',
                IconComponent: CalendarIcon,
              },
              {
                step: '02',
                title: '实时交易',
                desc: '在真实历史 K 线上下单，系统会同步展示 Paul Wei 当时的操作与收益。',
                IconComponent: ChartIcon,
              },
              {
                step: '03',
                title: '对比结算',
                desc: '挑战结束后，系统自动计算双方收益率、胜率等指标，给出胜负判定。',
                IconComponent: TrophyIcon,
              },
            ].map((item, i) => (
              <div
                key={i}
                className="glass-card p-8 rounded-2xl border border-primary/20 hover:border-primary/50 transition-all duration-300 group"
              >
                <div className="flex items-center gap-4 mb-4">
                  <span className="text-4xl">
                    <item.IconComponent />
                  </span>
                  <span className="text-5xl font-black text-primary/20 group-hover:text-primary/40 transition-colors">
                    {item.step}
                  </span>
                </div>
                <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Quick Challenges Section */}
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <p className="text-primary font-semibold tracking-widest uppercase text-sm mb-2">Featured Battles</p>
            <h2 className="text-3xl sm:text-4xl font-bold" style={{ textShadow: '0 0 20px hsl(var(--primary)/0.3)' }}>
              精选经典战役
            </h2>
            <p className="text-muted-foreground mt-4 max-w-lg mx-auto">
              这些日期见证了加密市场的剧烈波动，也是检验交易能力的绝佳试炼场。
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {quickChallenges.map((c, i) => (
              <button
                key={i}
                onClick={() => handleQuickChallenge(c.date)}
                disabled={isLoading}
                className="glass-card p-6 rounded-2xl border border-primary/20 hover:border-primary hover:shadow-lg hover:shadow-primary/20 transition-all duration-300 text-left group disabled:opacity-50"
              >
                <p className="text-xs text-muted-foreground font-mono mb-1">{c.date}</p>
                <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">
                  {c.label}
                </h3>
                <p className="text-sm text-muted-foreground mt-2">{c.desc}</p>
                <div className="mt-4 flex items-center gap-2 text-primary text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                  <span>立即挑战</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Challenge Selector Section */}
      <section id="challenge" className="py-20 px-6 bg-card/30">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <p className="text-primary font-semibold tracking-widest uppercase text-sm mb-2">Start Your Challenge</p>
            <h2 className="text-3xl sm:text-4xl font-bold" style={{ textShadow: '0 0 20px hsl(var(--primary)/0.3)' }}>
              自定义挑战
            </h2>
            <p className="text-muted-foreground mt-4 max-w-lg mx-auto">
              选择任意时间段和交易对，与 Paul Wei 在相同行情下一决高下。
            </p>
          </div>

          <div className="max-w-2xl mx-auto">
            <ChallengeSelector onCreateChallenge={handleCreateChallenge} isLoading={isLoading} />
          </div>

          {error && (
            <div className="mt-6 p-4 bg-destructive/20 border border-destructive/50 rounded-lg text-destructive-foreground text-center max-w-md mx-auto">
              {error}
            </div>
          )}
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-16 px-6">
        <div className="container mx-auto max-w-4xl">
          <div className="glass-card p-8 rounded-2xl border border-primary/20 text-center">
            <h3 className="text-xl font-bold mb-4">数据来源与公平性</h3>
            <p className="text-muted-foreground text-sm leading-relaxed max-w-2xl mx-auto">
              所有 K 线数据来自 BitMEX 历史行情（2019-2021），Paul Wei 的交易记录为真实公开数据。
              <br />
              系统在相同时间点、相同价格下撮合你的订单，确保对比公平公正。
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-border/50">
        <div className="container mx-auto max-w-4xl text-center text-sm text-muted-foreground">
          <p>TradingPK · 与传奇交易员同台竞技</p>
          <p className="mt-2 text-xs">
            本平台仅供学习与研究，不构成任何投资建议。
          </p>
        </div>
      </footer>
    </div>
  );
}
