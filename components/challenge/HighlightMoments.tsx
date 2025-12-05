'use client';

import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Symbol } from '@/types/common';
import { getPaulWeiPnLCalculator } from '@/lib/pnl-calculator';
import { cn } from '@/lib/utils';

export interface HighlightMoment {
  id: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  symbol: Symbol;
  paulWeiReturn: number;
  difficulty: 'easy' | 'medium' | 'hard';
  marketCondition: string;
  tradeCount: number;
  strategy: string;
}

// 策略类型
const STRATEGIES = ['全部', '阶梯买入', '高位止盈', '区间网格', '分层建仓', '高位做空', '恐慌抄底', '剥头皮', '趋势跟踪', '突破追涨', '抄底反弹'] as const;
// 市场状态
const MARKET_CONDITIONS = ['全部', '下跌反弹', '反弹高点', '横盘震荡', '震荡上涨', '冲高回落', '急跌反弹', '窄幅震荡', '反弹确认', '牛市狂欢', '暴跌恐慌', '突破行情'] as const;
// 难度
const DIFFICULTIES = ['全部', 'easy', 'medium', 'hard'] as const;

// 基于真实数据的 Paul Wei 高光时刻 - 整天挑战，匹配 wallet_history 数据
export const HIGHLIGHT_MOMENTS: HighlightMoment[] = [
  // ===== 2020年5月 =====
  {
    id: 'may01-full-day',
    title: '5月1日 - 阶梯抄底日',
    description: 'BTC 从 $8822 跌至 $8695 后反弹至 $9024，Paul Wei 分层建仓后高位止盈',
    startTime: '2020-05-01T00:00:00.000Z',
    endTime: '2020-05-01T23:59:59.999Z',
    symbol: 'XBTUSD',
    paulWeiReturn: 8.5,
    difficulty: 'medium',
    marketCondition: '下跌反弹',
    tradeCount: 40,
    strategy: '阶梯买入',
  },
  {
    id: 'may02-full-day',
    title: '5月2日 - 震荡网格日',
    description: '市场在 $8800-8840 区间震荡，Paul Wei 反复低买高卖吃差价',
    startTime: '2020-05-02T00:00:00.000Z',
    endTime: '2020-05-02T23:59:59.999Z',
    symbol: 'XBTUSD',
    paulWeiReturn: 12.3,
    difficulty: 'hard',
    marketCondition: '横盘震荡',
    tradeCount: 24,
    strategy: '区间网格',
  },
  {
    id: 'may03-full-day',
    title: '5月3日 - 经典一战',
    description: 'Paul Wei 在 $8850 附近分层建仓，$9077 平仓，当日盈利 0.183 BTC',
    startTime: '2020-05-03T00:00:00.000Z',
    endTime: '2020-05-03T23:59:59.999Z',
    symbol: 'XBTUSD',
    paulWeiReturn: 18.3,
    difficulty: 'medium',
    marketCondition: '震荡上涨',
    tradeCount: 50,
    strategy: '分层建仓',
  },

  // ===== 2020年6月 =====
  {
    id: 'jun01-full-day',
    title: '6月1日 - 突破 9500',
    description: 'BTC 突破 $9500 关口，Paul Wei 顺势做多，多品种操作',
    startTime: '2020-06-01T00:00:00.000Z',
    endTime: '2020-06-01T23:59:59.999Z',
    symbol: 'XBTUSD',
    paulWeiReturn: 5.8,
    difficulty: 'easy',
    marketCondition: '突破行情',
    tradeCount: 30,
    strategy: '突破追涨',
  },
  // ===== 2020年6月22日 =====
  {
    id: 'massive-sell-jun22',
    title: '大规模出货 - 18万张清仓',
    description: 'Paul Wei 在 $9552-9615 区间卖出 183,328 张合约，单日最大出货量',
    startTime: '2020-06-22T16:30:00.000Z',
    endTime: '2020-06-22T18:00:00.000Z',
    symbol: 'XBTUSD',
    paulWeiReturn: 11.5,
    difficulty: 'hard',
    marketCondition: '反弹高点',
    tradeCount: 20,
    strategy: '高位止盈',
  },
  // ===== 2020年8月31日 =====
  {
    id: 'aug-ladder-buy',
    title: '8月阶梯 - 11700 区间',
    description: 'BTC 在 $11649-11708 区间，Paul Wei 分层买入后在 $11607 止盈',
    startTime: '2020-08-31T00:00:00.000Z',
    endTime: '2020-08-31T09:00:00.000Z',
    symbol: 'XBTUSD',
    paulWeiReturn: 6.8,
    difficulty: 'medium',
    marketCondition: '横盘震荡',
    tradeCount: 55,
    strategy: '区间网格',
  },
  // ===== 2020年10月2日 =====
  {
    id: 'oct-whale-trade',
    title: '巨鲸操作 - 10400 大战',
    description: 'Paul Wei 在 $10410-10474 区间进行超大规模交易，单笔 133,333 张合约',
    startTime: '2020-10-02T05:30:00.000Z',
    endTime: '2020-10-02T07:00:00.000Z',
    symbol: 'XBTUSD',
    paulWeiReturn: 14.2,
    difficulty: 'hard',
    marketCondition: '震荡上涨',
    tradeCount: 50,
    strategy: '分层建仓',
  },
  // ===== 2020年12月 =====
  {
    id: 'dec-btc-18k',
    title: '冲击 18K - 年末行情',
    description: 'BTC 站上 $18000，Paul Wei 在 $18288-18426 区间大量交易',
    startTime: '2020-12-09T13:00:00.000Z',
    endTime: '2020-12-10T10:00:00.000Z',
    symbol: 'XBTUSD',
    paulWeiReturn: 8.9,
    difficulty: 'medium',
    marketCondition: '牛市狂欢',
    tradeCount: 30,
    strategy: '趋势跟踪',
  },
  // ===== 2021年1月17日 =====
  {
    id: 'jan21-massive-sell',
    title: '百万级出货 - $35600 大清仓',
    description: 'Paul Wei 在 $35587-35778 区间卖出超过 50 万张合约，史诗级操作',
    startTime: '2021-01-17T05:45:00.000Z',
    endTime: '2021-01-17T06:00:00.000Z',
    symbol: 'XBTUSD',
    paulWeiReturn: 22.5,
    difficulty: 'hard',
    marketCondition: '冲高回落',
    tradeCount: 60,
    strategy: '高位止盈',
  },
  // ===== 2021年2月 牛市 =====
  {
    id: 'bull-run-feb21',
    title: '牛市狂欢 - $55000 大战',
    description: 'BTC 冲击 $55000，Paul Wei 在 $54734-55555 区间大量交易，单笔 75,000 张合约',
    startTime: '2021-02-19T18:00:00.000Z',
    endTime: '2021-02-19T20:00:00.000Z',
    symbol: 'XBTUSD',
    paulWeiReturn: 15.2,
    difficulty: 'hard',
    marketCondition: '牛市狂欢',
    tradeCount: 28,
    strategy: '趋势跟踪',
  },
  {
    id: 'quick-flip-feb21',
    title: '快速翻转 - 高位止盈',
    description: 'Paul Wei 在 $55555 高位卖出 113,545 张合约，随后在 $55310 接回',
    startTime: '2021-02-19T19:00:00.000Z',
    endTime: '2021-02-19T19:30:00.000Z',
    symbol: 'XBTUSD',
    paulWeiReturn: 8.7,
    difficulty: 'medium',
    marketCondition: '冲高回落',
    tradeCount: 15,
    strategy: '高位止盈',
  },
  // ===== 2021年5月10日 =====
  {
    id: 'may21-crash-sell',
    title: '5月暴跌 - 逃顶大师',
    description: 'BTC 从 $57000 开始下跌，Paul Wei 在 $57208-57306 区间卖出 27 万张合约',
    startTime: '2021-05-10T14:30:00.000Z',
    endTime: '2021-05-10T15:00:00.000Z',
    symbol: 'XBTUSD',
    paulWeiReturn: 18.6,
    difficulty: 'hard',
    marketCondition: '暴跌恐慌',
    tradeCount: 40,
    strategy: '高位做空',
  },
  {
    id: 'may21-quick-buy',
    title: '急跌抄底 - $57600 反弹',
    description: '暴跌后 Paul Wei 在 $57637 快速抄底 38,231 张合约',
    startTime: '2021-05-10T17:00:00.000Z',
    endTime: '2021-05-10T17:30:00.000Z',
    symbol: 'XBTUSD',
    paulWeiReturn: 5.3,
    difficulty: 'medium',
    marketCondition: '急跌反弹',
    tradeCount: 8,
    strategy: '恐慌抄底',
  },
  // ===== 2021年12月 =====
  {
    id: 'eth-scalp-dec21',
    title: 'ETH 剥头皮 - $4200 区间',
    description: 'ETH 在 $4211-4222 窄幅震荡，Paul Wei 快速进出赚取差价',
    startTime: '2021-12-03T20:50:00.000Z',
    endTime: '2021-12-03T21:10:00.000Z',
    symbol: 'XBTUSD',
    paulWeiReturn: 2.8,
    difficulty: 'hard',
    marketCondition: '窄幅震荡',
    tradeCount: 25,
    strategy: '剥头皮',
  },
  // ===== 2022年3月 =====
  {
    id: 'mar22-xrp-trade',
    title: 'XRP 多品种 - $0.75 区间',
    description: 'Paul Wei 在 XRP $0.7466-0.7544 区间进行大量交易，多品种操作',
    startTime: '2022-03-09T08:30:00.000Z',
    endTime: '2022-03-09T13:00:00.000Z',
    symbol: 'XBTUSD',
    paulWeiReturn: 4.5,
    difficulty: 'medium',
    marketCondition: '横盘震荡',
    tradeCount: 35,
    strategy: '区间网格',
  },
  {
    id: 'mar22-btc-ladder',
    title: '3月阶梯 - $41000 抄底',
    description: 'BTC 从 $41943 跌至 $41156，Paul Wei 在 41843/41743/41643/41556/41468/41368/41256/41156 分层抄底',
    startTime: '2022-03-10T00:30:00.000Z',
    endTime: '2022-03-10T02:00:00.000Z',
    symbol: 'XBTUSD',
    paulWeiReturn: 7.2,
    difficulty: 'medium',
    marketCondition: '下跌反弹',
    tradeCount: 20,
    strategy: '阶梯买入',
  },
  // ===== 2024年3月 =====
  {
    id: 'mar24-70k-battle',
    title: '7万美元大战 - 历史新高',
    description: 'BTC 冲击 $71000，Paul Wei 在 $69123-71777 区间进行大规模交易',
    startTime: '2024-03-27T13:00:00.000Z',
    endTime: '2024-03-28T12:00:00.000Z',
    symbol: 'XBTUSD',
    paulWeiReturn: 12.8,
    difficulty: 'hard',
    marketCondition: '牛市狂欢',
    tradeCount: 45,
    strategy: '趋势跟踪',
  },
  {
    id: 'mar24-quick-scalp',
    title: '高位剥头皮 - $70800 区间',
    description: 'Paul Wei 在 $70854-70856 区间快速进出，高位剥头皮',
    startTime: '2024-03-28T19:40:00.000Z',
    endTime: '2024-03-28T20:00:00.000Z',
    symbol: 'XBTUSD',
    paulWeiReturn: 3.2,
    difficulty: 'hard',
    marketCondition: '窄幅震荡',
    tradeCount: 15,
    strategy: '剥头皮',
  },
  // ===== 2021年1月30日 GME 狂潮 =====
  {
    id: 'jan30-gme-era',
    title: 'GME 狂潮 - $33000 大战',
    description: 'WSB 散户狂潮期间，Paul Wei 在 $33145-33568 区间卖出超过 40 万张合约',
    startTime: '2021-01-30T03:50:00.000Z',
    endTime: '2021-01-30T05:00:00.000Z',
    symbol: 'XBTUSD',
    paulWeiReturn: 16.8,
    difficulty: 'hard',
    marketCondition: '暴跌恐慌',
    tradeCount: 55,
    strategy: '高位止盈',
  },
  // ===== 2021年3月28日 =====
  {
    id: 'mar28-55k-sell',
    title: '55K 大清仓 - 连续出货',
    description: 'Paul Wei 在 $55679-55991 区间连续卖出超过 30 万张合约',
    startTime: '2021-03-28T00:20:00.000Z',
    endTime: '2021-03-28T01:00:00.000Z',
    symbol: 'XBTUSD',
    paulWeiReturn: 13.5,
    difficulty: 'hard',
    marketCondition: '冲高回落',
    tradeCount: 45,
    strategy: '高位止盈',
  },
  {
    id: 'mar28-56k-buy',
    title: '56K 抄底 - 大胆接盘',
    description: '清仓后 Paul Wei 在 $56085 大胆抄底，买入 25 万张合约',
    startTime: '2021-03-28T03:20:00.000Z',
    endTime: '2021-03-28T03:30:00.000Z',
    symbol: 'XBTUSD',
    paulWeiReturn: 8.2,
    difficulty: 'medium',
    marketCondition: '急跌反弹',
    tradeCount: 12,
    strategy: '恐慌抄底',
  },
  // ===== 2021年6月25日 =====
  {
    id: 'jun25-33k-sell',
    title: '6月清仓 - $33000 大战',
    description: 'Paul Wei 在 $33146-33576 区间卖出超过 100 万张合约，ETH 同步操作',
    startTime: '2021-06-25T10:50:00.000Z',
    endTime: '2021-06-25T12:30:00.000Z',
    symbol: 'XBTUSD',
    paulWeiReturn: 19.2,
    difficulty: 'hard',
    marketCondition: '暴跌恐慌',
    tradeCount: 100,
    strategy: '高位做空',
  },
  // ===== 2021年9月7日 萨尔瓦多日 =====
  {
    id: 'sep7-salvador-crash',
    title: '萨尔瓦多日 - 闪崩抄底',
    description: 'BTC 法币化当天闪崩，Paul Wei 在 $48111 抄底 10 万张合约',
    startTime: '2021-09-07T14:55:00.000Z',
    endTime: '2021-09-07T15:00:00.000Z',
    symbol: 'XBTUSD',
    paulWeiReturn: 6.5,
    difficulty: 'medium',
    marketCondition: '暴跌恐慌',
    tradeCount: 8,
    strategy: '恐慌抄底',
  },
  // ===== 2022年1月21日 =====
  {
    id: 'jan22-crash-trade',
    title: '1月暴跌 - $41000 到 $37000',
    description: 'BTC 从 $41449 暴跌至 $37777，Paul Wei 先卖后买，完美操作',
    startTime: '2022-01-20T22:00:00.000Z',
    endTime: '2022-01-21T16:00:00.000Z',
    symbol: 'XBTUSD',
    paulWeiReturn: 24.5,
    difficulty: 'hard',
    marketCondition: '暴跌恐慌',
    tradeCount: 80,
    strategy: '高位做空',
  },
  // ===== 2022年11月 FTX 崩盘 =====
  {
    id: 'nov22-ftx-crash',
    title: 'FTX 崩盘 - $16000 抄底',
    description: 'FTX 崩盘期间，Paul Wei 在 $16144-16467 区间分层抄底，多品种操作',
    startTime: '2022-11-27T23:00:00.000Z',
    endTime: '2022-11-28T02:00:00.000Z',
    symbol: 'XBTUSD',
    paulWeiReturn: 5.8,
    difficulty: 'medium',
    marketCondition: '暴跌恐慌',
    tradeCount: 45,
    strategy: '阶梯买入',
  },
  // ===== 2023年7月 =====
  {
    id: 'jul23-29k-trade',
    title: '7月震荡 - $29000 区间',
    description: 'Paul Wei 在 $29270-29337 区间进行大规模交易，单笔 13.9 万张',
    startTime: '2023-07-29T06:00:00.000Z',
    endTime: '2023-07-29T20:00:00.000Z',
    symbol: 'XBTUSD',
    paulWeiReturn: 7.8,
    difficulty: 'medium',
    marketCondition: '横盘震荡',
    tradeCount: 35,
    strategy: '区间网格',
  },
  // ===== 2024年11月 =====
  {
    id: 'nov24-97k-battle',
    title: '冲击 10 万 - $97000 大战',
    description: 'BTC 冲击 $100000，Paul Wei 在 $97354-98376 区间进行超大规模交易',
    startTime: '2024-11-21T16:50:00.000Z',
    endTime: '2024-11-21T18:30:00.000Z',
    symbol: 'XBTUSD',
    paulWeiReturn: 11.2,
    difficulty: 'hard',
    marketCondition: '牛市狂欢',
    tradeCount: 50,
    strategy: '趋势跟踪',
  },
];


interface HighlightMomentsProps {
  onSelectMoment: (moment: HighlightMoment) => void;
  selectedSymbol?: Symbol;
}

// 根据时间估算 BTC 价格（用于计算收益率）
function getEstimatedPrice(timestamp: string): number {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;

  // 基于历史数据的大致价格
  if (year === 2020) {
    if (month <= 3) return 8000;
    if (month <= 6) return 9000;
    if (month <= 9) return 11000;
    return 18000;
  }
  if (year === 2021) {
    if (month <= 3) return 50000;
    if (month <= 6) return 35000;
    if (month <= 9) return 45000;
    return 50000;
  }
  if (year === 2022) {
    if (month <= 3) return 40000;
    if (month <= 6) return 30000;
    if (month <= 9) return 20000;
    return 17000;
  }
  if (year === 2023) {
    if (month <= 6) return 25000;
    return 30000;
  }
  if (year === 2024) {
    if (month <= 3) return 70000;
    if (month <= 6) return 65000;
    return 95000;
  }
  return 50000;
}

export function HighlightMoments({ onSelectMoment, selectedSymbol }: HighlightMomentsProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [difficultyFilter, setDifficultyFilter] = useState<string>('全部');
  const [strategyFilter, setStrategyFilter] = useState<string>('全部');
  const [marketFilter, setMarketFilter] = useState<string>('全部');
  const [calculatedReturns, setCalculatedReturns] = useState<Record<string, number>>({});
  const [isCalculating, setIsCalculating] = useState(true);

  // 加载 wallet history 并计算每个挑战的实际收益率
  useEffect(() => {
    const calculateReturns = async () => {
      setIsCalculating(true);
      const calculator = getPaulWeiPnLCalculator();
      await calculator.loadWalletHistory();
      
      console.log('[HighlightMoments] Wallet history loaded, hasData:', calculator.hasWalletHistory());

      const returns: Record<string, number> = {};
      
      for (const moment of HIGHLIGHT_MOMENTS) {
        // 使用一个估算的结束价格（基于时间段）
        const estimatedPrice = getEstimatedPrice(moment.startTime);
        console.log(`[HighlightMoments] Calculating ${moment.id}: ${moment.startTime} ~ ${moment.endTime}, price=${estimatedPrice}`);
        const summary = calculator.calculateFromWalletHistory(
          moment.startTime,
          moment.endTime,
          estimatedPrice
        );
        console.log(`[HighlightMoments] ${moment.id} result:`, summary);
        returns[moment.id] = summary.returnRate;
      }

      setCalculatedReturns(returns);
      setIsCalculating(false);
    };

    calculateReturns();
  }, []);

  // 获取实际使用的策略和市场状态
  const usedStrategies = useMemo(() => {
    const strategies = new Set(HIGHLIGHT_MOMENTS.map((m) => m.strategy));
    return ['全部', ...Array.from(strategies)];
  }, []);

  const usedMarketConditions = useMemo(() => {
    const conditions = new Set(HIGHLIGHT_MOMENTS.map((m) => m.marketCondition));
    return ['全部', ...Array.from(conditions)];
  }, []);

  const filteredMoments = useMemo(() => {
    return HIGHLIGHT_MOMENTS.filter((m) => {
      if (selectedSymbol && m.symbol !== selectedSymbol) return false;
      if (difficultyFilter !== '全部' && m.difficulty !== difficultyFilter) return false;
      if (strategyFilter !== '全部' && m.strategy !== strategyFilter) return false;
      if (marketFilter !== '全部' && m.marketCondition !== marketFilter) return false;
      return true;
    });
  }, [selectedSymbol, difficultyFilter, strategyFilter, marketFilter]);

  const getDifficultyStyle = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'text-green-400 border-green-400/50 bg-green-500/10';
      case 'medium':
        return 'text-yellow-400 border-yellow-400/50 bg-yellow-500/10';
      case 'hard':
        return 'text-red-400 border-red-400/50 bg-red-500/10';
      default:
        return 'text-muted-foreground border-muted/50 bg-muted/20';
    }
  };

  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return '🟢 简单';
      case 'medium':
        return '🟡 中等';
      case 'hard':
        return '🔴 困难';
      default:
        return difficulty;
    }
  };

  const clearFilters = () => {
    setDifficultyFilter('全部');
    setStrategyFilter('全部');
    setMarketFilter('全部');
  };

  const hasActiveFilters = difficultyFilter !== '全部' || strategyFilter !== '全部' || marketFilter !== '全部';

  return (
    <Card glass>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          ⭐ Paul Wei 高光时刻
          <Badge variant="outline" className="ml-auto">
            {filteredMoments.length} / {HIGHLIGHT_MOMENTS.length} 个挑战
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          挑战 Paul Wei 在关键时刻的经典操作，学习专业交易员的策略思维
        </p>

        {/* 筛选器 */}
        <div className="space-y-3 p-4 rounded-lg glass">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">筛选条件</span>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="h-6 text-xs text-muted-foreground hover:text-foreground">
                清除筛选
              </Button>
            )}
          </div>

          {/* 难度筛选 */}
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground">难度</span>
            <div className="flex flex-wrap gap-2">
              {['全部', 'easy', 'medium', 'hard'].map((d) => (
                <Badge
                  key={d}
                  variant={difficultyFilter === d ? 'default' : 'outline'}
                  className={cn(
                    "cursor-pointer text-xs transition-all",
                    difficultyFilter === d
                      ? 'bg-primary/80 border-primary shadow-md'
                      : 'bg-muted/50 border-transparent hover:bg-muted/80'
                  )}
                  onClick={() => setDifficultyFilter(d)}
                >
                  {d === '全部' ? '全部' : getDifficultyLabel(d)}
                </Badge>
              ))}
            </div>
          </div>

          {/* 策略筛选 */}
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground">策略类型</span>
            <div className="flex flex-wrap gap-2">
              {usedStrategies.map((s) => (
                <Badge
                  key={s}
                  variant={strategyFilter === s ? 'default' : 'outline'}
                  className={cn(
                    "cursor-pointer text-xs transition-all",
                    strategyFilter === s
                    ? 'bg-primary/80 border-primary shadow-md'
                    : 'bg-muted/50 border-transparent hover:bg-muted/80'
                  )}
                  onClick={() => setStrategyFilter(s)}
                >
                  {s}
                </Badge>
              ))}
            </div>
          </div>

          {/* 市场状态筛选 */}
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground">市场状态</span>
            <div className="flex flex-wrap gap-2">
              {usedMarketConditions.map((m) => (
                <Badge
                  key={m}
                  variant={marketFilter === m ? 'default' : 'outline'}
                  className={cn(
                    "cursor-pointer text-xs transition-all",
                    marketFilter === m
                    ? 'bg-primary/80 border-primary shadow-md'
                    : 'bg-muted/50 border-transparent hover:bg-muted/80'
                  )}
                  onClick={() => setMarketFilter(m)}
                >
                  {m}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        {/* 挑战列表 */}
        <div className="space-y-4 max-h-[500px] overflow-y-auto p-1">
          {filteredMoments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>没有符合条件的挑战</p>
              <Button variant="link" size="sm" onClick={clearFilters}>
                清除筛选条件
              </Button>
            </div>
          ) : (
            filteredMoments.map((moment) => (
              <div
                key={moment.id}
                onClick={() => setSelectedId(moment.id)}
                className={cn(
                  'rounded-xl p-4 cursor-pointer transition-all duration-300 glass',
                  'border-2',
                  selectedId === moment.id
                    ? 'border-primary shadow-[0_0_20px_hsl(var(--primary)/0.7)]'
                    : 'border-transparent hover:border-primary/30'
                )}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground text-base">{moment.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{moment.description}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2 ml-4">
                    <Badge variant="outline" className="border-border/50">{moment.symbol}</Badge>
                    <Badge variant="outline" className={cn('text-xs', getDifficultyStyle(moment.difficulty))}>
                      {getDifficultyLabel(moment.difficulty)}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs mt-4 pt-3 border-t border-border/20">
                  <div>
                    <span className="text-muted-foreground block mb-0.5">Paul Wei 收益</span>
                    <div className={cn(
                      'font-semibold font-mono text-sm',
                      isCalculating 
                        ? 'text-muted-foreground' 
                        : (calculatedReturns[moment.id] || 0) >= 0 
                          ? 'text-profit' 
                          : 'text-loss'
                    )}>
                      {isCalculating 
                        ? '...' 
                        : `${(calculatedReturns[moment.id] || 0) >= 0 ? '+' : ''}${(calculatedReturns[moment.id] || 0).toFixed(2)}%`
                      }
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground block mb-0.5">交易次数</span>
                    <div className="font-semibold font-mono text-sm">{moment.tradeCount}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground block mb-0.5">市场状态</span>
                    <div className="font-semibold text-sm">{moment.marketCondition}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground block mb-0.5">策略类型</span>
                    <div className="font-semibold text-sm">{moment.strategy}</div>
                  </div>
                </div>

                {selectedId === moment.id && (
                  <div className="mt-4 pt-3 border-t border-border/20 flex flex-col items-center">
                     <p className="text-xs text-muted-foreground mb-3">
                      挑战时间: {new Date(moment.startTime).toLocaleString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })} - {new Date(moment.endTime).toLocaleString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <Button
                      size="lg"
                      className="w-full max-w-xs h-12 text-base bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-300 hover:shadow-[0_0_20px_hsl(var(--primary))]"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectMoment(moment);
                      }}
                    >
                      开始挑战
                    </Button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
