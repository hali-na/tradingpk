'use client';

import { useState } from 'react';
import { Symbol } from '@/types/common';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Select } from '../common/Select';
import { Card, CardTitle } from '../common/Card';
import { PaulWeiDataLoader } from '@/lib/data-loader/paulWeiDataLoader';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { HighlightMoments } from './HighlightMoments';
import { HighlightMoment } from './HighlightMoments';

interface ChallengeWizardProps {
  onCreateChallenge: (startTime: string, endTime: string, symbol: Symbol) => void;
  isLoading?: boolean;
}

const paulWeiLoader = new PaulWeiDataLoader();

function CustomChallenge({ onCreateChallenge, isLoading }: ChallengeWizardProps) {
  const [startDate, setStartDate] = useState('2020-05-01');
  const [endDate, setEndDate] = useState('2020-05-07');
  const [symbol, setSymbol] = useState<Symbol>('XBTUSD');
  const [tradeDates, setTradeDates] = useState<Set<string>>(new Set());
  const [tradeCount, setTradeCount] = useState(0);
  const [isLoadingTrades, setIsLoadingTrades] = useState(false);

  // 加载 Paul Wei 的交易数据
  useState(() => {
    const loadTrades = async () => {
      if (!startDate || !endDate) return;
      
      setIsLoadingTrades(true);
      try {
        const startTime = new Date(startDate + 'T00:00:00.000Z').toISOString();
        const endTime = new Date(endDate + 'T23:59:59.999Z').toISOString();
        
        const trades = await paulWeiLoader.loadPaulWeiTrades(startTime, endTime);
        
        const filteredTrades = symbol 
          ? trades.filter(t => t.symbol === symbol)
          : trades;
        
        const dates = new Set<string>();
        filteredTrades.forEach(trade => {
          const date = new Date(trade.datetime).toISOString().split('T')[0];
          dates.add(date);
        });
        
        setTradeDates(dates);
        setTradeCount(filteredTrades.length);
      } catch (error) {
        console.error('加载 Paul Wei 交易数据失败:', error);
        setTradeDates(new Set());
        setTradeCount(0);
      } finally {
        setIsLoadingTrades(false);
      }
    };

    loadTrades();
  });

  const handleSubmit = () => {
    const startTime = new Date(startDate).toISOString();
    const endTime = new Date(endDate + 'T23:59:59').toISOString();
    onCreateChallenge(startTime, endTime, symbol);
  };

  const presets = [
    { label: '最近7天', days: 7 },
    { label: '最近30天', days: 30 },
    { label: '最近3个月', days: 90 },
  ];

  const applyPreset = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);
    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
  };

  return (
    <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            快速选择
          </label>
          <div className="flex gap-2">
            {presets.map((preset) => (
              <Button
                key={preset.days}
                variant="secondary"
                size="sm"
                onClick={() => applyPreset(preset.days)}
              >
                {preset.label}
              </Button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            id="startDate"
            name="startDate"
            label="开始日期"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <Input
            id="endDate"
            name="endDate"
            label="结束日期"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>

        <Select
          id="symbol"
          name="symbol"
          label="交易对"
          value={symbol}
          onChange={(e) => setSymbol(e.target.value as Symbol)}
          options={[
            { value: 'XBTUSD', label: 'XBTUSD (比特币)' },
            { value: 'ETHUSD', label: 'ETHUSD (以太坊)' },
          ]}
        />
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-700 mb-2">挑战信息</h4>
          <div className="text-sm text-gray-600 space-y-1">
            <p>时间段: {startDate} ~ {endDate}</p>
            <p>交易对: {symbol}</p>
            <p>初始资金: $10,000 USD</p>
          </div>
        </div>

        <Button
          onClick={handleSubmit}
          loading={isLoading}
          className="w-full"
          size="lg"
        >
          开始挑战
        </Button>
      </div>
  );
}


export function ChallengeWizard({ onCreateChallenge, isLoading }: ChallengeWizardProps) {
  
  const handleSelectMoment = (moment: HighlightMoment) => {
    onCreateChallenge(moment.startTime, moment.endTime, moment.symbol);
  };

  return (
    <Card padding="lg" className="w-full">
      <Tabs defaultValue="highlights" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="highlights">高光时刻</TabsTrigger>
          <TabsTrigger value="custom">自定义挑战</TabsTrigger>
        </TabsList>
        <TabsContent value="highlights">
          <HighlightMoments onSelectMoment={handleSelectMoment} />
        </TabsContent>
        <TabsContent value="custom">
          <CustomChallenge onCreateChallenge={onCreateChallenge} isLoading={isLoading} />
        </TabsContent>
      </Tabs>
    </Card>
  );
}