'use client';

import { useState, useEffect } from 'react';
import { Symbol } from '@/types/common';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Select } from '../common/Select';
import { Card, CardTitle } from '../common/Card';
import { PaulWeiDataLoader } from '@/lib/data-loader/paulWeiDataLoader';

interface ChallengeSelectorProps {
  onCreateChallenge: (startTime: string, endTime: string, symbol: Symbol) => void;
  isLoading?: boolean;
}

const paulWeiLoader = new PaulWeiDataLoader();

export function ChallengeSelector({ onCreateChallenge, isLoading }: ChallengeSelectorProps) {
  const [startDate, setStartDate] = useState('2020-05-01');
  const [endDate, setEndDate] = useState('2020-05-07');
  const [symbol, setSymbol] = useState<Symbol>('XBTUSD');
  const [tradeDates, setTradeDates] = useState<Set<string>>(new Set());
  const [tradeCount, setTradeCount] = useState(0);
  const [isLoadingTrades, setIsLoadingTrades] = useState(false);

  // 加载 Paul Wei 的交易数据
  useEffect(() => {
    const loadTrades = async () => {
      if (!startDate || !endDate) return;
      
      setIsLoadingTrades(true);
      try {
        // 确保日期格式正确：添加时间部分
        const startTime = new Date(startDate + 'T00:00:00.000Z').toISOString();
        const endTime = new Date(endDate + 'T23:59:59.999Z').toISOString();
        
        console.log(`[ChallengeSelector] 加载交易数据: ${startTime} ~ ${endTime}, symbol=${symbol}`);
        
        const trades = await paulWeiLoader.loadPaulWeiTrades(startTime, endTime);
        
        console.log(`[ChallengeSelector] 加载到 ${trades.length} 笔交易`);
        
        // 过滤指定交易对
        const filteredTrades = symbol 
          ? trades.filter(t => t.symbol === symbol)
          : trades;
        
        console.log(`[ChallengeSelector] 过滤后 ${filteredTrades.length} 笔交易 (symbol=${symbol})`);
        
        // 提取交易日期（只取日期部分，忽略时间）
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
  }, [startDate, endDate, symbol]);

  const handleSubmit = () => {
    const startTime = new Date(startDate).toISOString();
    const endTime = new Date(endDate + 'T23:59:59').toISOString();
    onCreateChallenge(startTime, endTime, symbol);
  };

  // 预设时间段
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
    <Card padding="lg">
      <CardTitle>选择挑战时间段</CardTitle>
      
      <div className="mt-4 space-y-4">
        {/* 快速选择 */}
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

        {/* 日期选择 */}
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

        {/* 交易对选择 */}
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

        {/* Paul Wei 交易数据预览 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
            <span>📊</span>
            <span>Paul Wei 交易数据</span>
            {isLoadingTrades && (
              <span className="text-xs text-blue-600">加载中...</span>
            )}
          </h4>
          {isLoadingTrades ? (
            <div className="text-sm text-blue-700">正在加载交易数据...</div>
          ) : tradeCount > 0 ? (
            <div className="text-sm text-blue-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium">交易次数:</span>
                <span className="font-mono font-semibold">{tradeCount} 笔</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium">交易日期数:</span>
                <span className="font-mono font-semibold">{tradeDates.size} 天</span>
              </div>
              <div className="mt-2 pt-2 border-t border-blue-200">
                <div className="font-medium mb-1.5">交易日期 ({tradeDates.size} 天):</div>
                <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto bg-white rounded p-2 border border-blue-100">
                  {Array.from(tradeDates).sort().map((date) => (
                    <span
                      key={date}
                      className="inline-block px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-mono hover:bg-blue-200 transition-colors"
                      title={`${date} 有 Paul Wei 的交易记录`}
                    >
                      {date}
                    </span>
                  ))}
                </div>
                {tradeDates.size === 0 && (
                  <p className="text-xs text-amber-600 mt-1">
                    该时间段内没有交易记录
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="text-sm text-amber-700">
              ⚠️ 该时间段内没有 Paul Wei 的 {symbol} 交易记录
              <p className="text-xs text-amber-600 mt-1">
                请选择其他时间段或交易对
              </p>
            </div>
          )}
        </div>

        {/* 挑战信息预览 */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-700 mb-2">挑战信息</h4>
          <div className="text-sm text-gray-600 space-y-1">
            <p>时间段: {startDate} ~ {endDate}</p>
            <p>交易对: {symbol}</p>
            <p>初始资金: $10,000 USD</p>
          </div>
        </div>

        {/* 开始按钮 */}
        <Button
          onClick={handleSubmit}
          loading={isLoading}
          className="w-full"
          size="lg"
        >
          开始挑战
        </Button>
      </div>
    </Card>
  );
}
