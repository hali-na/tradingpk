'use client';

import { useEffect, useRef, useCallback } from 'react';
import { createChart, IChartApi, ISeriesApi, CandlestickData, Time } from 'lightweight-charts';
import { OHLCVData } from '@/types/ohlcv';
import { PaulWeiTrade } from '@/types/paulWei';
import { UserTrade } from '@/types/trading';

interface KLineChartProps {
  data: OHLCVData[];
  paulWeiTrades?: PaulWeiTrade[];
  userTrades?: UserTrade[];
  currentTime?: string;
  startTime?: string; // 挑战开始时间，用于计算历史K线范围
  height?: number;
  onCrosshairMove?: (price: number | null) => void;
  showPaulWeiTrades?: boolean; // 是否显示 paul wei 的交易标记
  historyDays?: number; // 显示多少天的历史K线（默认7天）
}

export function KLineChart({
  data,
  paulWeiTrades = [],
  userTrades = [],
  currentTime,
  startTime,
  height = 400,
  onCrosshairMove,
  showPaulWeiTrades = false, // 默认不显示，避免作弊
  historyDays = 7, // 默认显示7天历史K线
}: KLineChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candlestickSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const lastDataLengthRef = useRef<number>(0);
  const userScrolledRef = useRef<boolean>(false); // 跟踪用户是否手动滚动过
  const lastScrollTimeRef = useRef<number>(0); // 记录上次滚动的时间 // 记录上次数据长度，用于增量更新

  // 转换数据格式
  const convertData = useCallback((ohlcv: OHLCVData[]): CandlestickData[] => {
    return ohlcv.map((item) => ({
      time: (new Date(item.timestamp).getTime() / 1000) as Time,
      open: item.open,
      high: item.high,
      low: item.low,
      close: item.close,
    }));
  }, []);

  // 初始化图表
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height,
      layout: {
        background: { color: '#ffffff' },
        textColor: '#333',
      },
      grid: {
        vertLines: { color: '#f0f0f0' },
        horzLines: { color: '#f0f0f0' },
      },
      crosshair: {
        mode: 1,
      },
      rightPriceScale: {
        borderColor: '#d1d4dc',
      },
      timeScale: {
        borderColor: '#d1d4dc',
        timeVisible: true,
        secondsVisible: false,
      },
    });

    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#26a69a',
      downColor: '#ef5350',
      borderVisible: false,
      wickUpColor: '#26a69a',
      wickDownColor: '#ef5350',
    });

    chartRef.current = chart;
    candlestickSeriesRef.current = candlestickSeries;
    lastDataLengthRef.current = 0; // 重置数据长度计数

    // 监听十字线移动
    if (onCrosshairMove) {
      chart.subscribeCrosshairMove((param) => {
        if (param.seriesData.size > 0) {
          const data = param.seriesData.get(candlestickSeries) as CandlestickData | undefined;
          onCrosshairMove(data?.close || null);
        } else {
          onCrosshairMove(null);
        }
      });
    }

    // 响应式调整
    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [height, onCrosshairMove]);

  // 根据当前时间过滤K线数据
  // 显示逻辑：从（开始时间 - 历史天数）到当前模拟时间的所有K线
  const getFilteredData = useCallback(() => {
    if (!currentTime) return data;
    
    const currentTimeMs = new Date(currentTime).getTime();
    let startTimeMs: number;
    
    if (startTime) {
      // 如果有开始时间，显示开始时间前 historyDays 天到当前时间
      const start = new Date(startTime).getTime();
      startTimeMs = start - (historyDays * 24 * 60 * 60 * 1000); // 减去历史天数
    } else {
      // 如果没有开始时间，从数据最早的时间开始
      startTimeMs = data.length > 0 ? new Date(data[0].timestamp).getTime() : 0;
    }
    
    return data.filter((item) => {
      const itemTime = new Date(item.timestamp).getTime();
      // 显示从历史时间到当前时间的所有K线
      return itemTime >= startTimeMs && itemTime <= currentTimeMs;
    });
  }, [data, currentTime, startTime, historyDays]);

  // 更新数据（根据当前时间动态过滤）
  useEffect(() => {
    if (!candlestickSeriesRef.current || data.length === 0) return;

    // 根据当前时间过滤K线数据
    const filteredData = getFilteredData();
    const chartData = convertData(filteredData);
    
    // 优化：如果只是新增了数据，使用增量更新；否则全量更新
    if (chartData.length > lastDataLengthRef.current && lastDataLengthRef.current > 0) {
      // 增量更新：只添加新的K线
      const newCandles = chartData.slice(lastDataLengthRef.current);
      newCandles.forEach((candle) => {
        candlestickSeriesRef.current?.update(candle);
      });
    } else {
      // 全量更新：首次加载或时间跳转
      candlestickSeriesRef.current.setData(chartData);
    }
    
    lastDataLengthRef.current = chartData.length;

    // 添加标记
    const markers: any[] = [];

    // paul wei 交易标记（根据开关决定是否显示）
    if (showPaulWeiTrades) {
      paulWeiTrades.forEach((trade) => {
        const tradeTime = new Date(trade.datetime).getTime();
        const currentTimeMs = currentTime ? new Date(currentTime).getTime() : Infinity;
        
        // 只显示当前时间之前的交易
        if (tradeTime <= currentTimeMs) {
          const time = (tradeTime / 1000) as Time;
          markers.push({
            time,
            position: trade.side === 'Buy' ? 'belowBar' : 'aboveBar',
            color: trade.side === 'Buy' ? '#26a69a' : '#ef5350',
            shape: trade.side === 'Buy' ? 'arrowUp' : 'arrowDown',
            text: `PW ${trade.side}`,
            size: 1,
          });
        }
      });
    }

    // 用户交易标记
    if (data.length > 0) {
      const lastOhlcvTimeMs = new Date(data[data.length - 1].timestamp).getTime();
      const currentTimeMs = currentTime ? new Date(currentTime).getTime() : lastOhlcvTimeMs;

      userTrades.forEach((trade) => {
        let tradeTimeMs = new Date(trade.timestamp).getTime();

        // 由于用户交易时间默认是「现在」（真实时间），会远超出历史K线范围，
        // 这里做一个修正：如果交易时间比最后一根K线时间晚很多（例如超过1天），
        // 就把它对齐到当前模拟时间，保证标记落在可见的历史区间上。
        const oneDayMs = 24 * 60 * 60 * 1000;
        if (tradeTimeMs > lastOhlcvTimeMs + oneDayMs) {
          tradeTimeMs = currentTimeMs;
        }

        const time = (tradeTimeMs / 1000) as Time;
        markers.push({
          time,
          position: trade.side === 'Buy' ? 'belowBar' : 'aboveBar',
          color: trade.side === 'Buy' ? '#2196f3' : '#ff9800',
          shape: trade.side === 'Buy' ? 'arrowUp' : 'arrowDown',
          text: `You ${trade.side}`,
          size: 1,
        });
      });
    }

    if (markers.length > 0) {
      markers.sort((a, b) => (a.time as number) - (b.time as number));
      candlestickSeriesRef.current.setMarkers(markers);
    } else {
      candlestickSeriesRef.current.setMarkers([]);
    }
  }, [data, paulWeiTrades, userTrades, currentTime, showPaulWeiTrades, getFilteredData, convertData]);

  // 监听用户手动滚动
  useEffect(() => {
    if (!chartRef.current) return;

    const timeScale = chartRef.current.timeScale();
    
    // 监听滚动事件，标记用户已手动滚动
    const handleVisibleRangeChange = () => {
      // 如果距离上次自动滚动超过1秒，认为是用户手动滚动
      const now = Date.now();
      if (now - lastScrollTimeRef.current > 1000) {
        userScrolledRef.current = true;
      }
    };

    timeScale.subscribeVisibleTimeRangeChange(handleVisibleRangeChange);

    return () => {
      timeScale.unsubscribeVisibleTimeRangeChange(handleVisibleRangeChange);
    };
  }, []);

  // 智能滚动：只在必要时滚动，类似 TradingView
  useEffect(() => {
    if (!chartRef.current || !currentTime) return;

    const timeScale = chartRef.current.timeScale();
    const visibleRange = timeScale.getVisibleRange();
    
    if (!visibleRange) return;

    const currentTimeNum = new Date(currentTime).getTime() / 1000;
    const visibleEnd = visibleRange.to as number;
    const visibleStart = visibleRange.from as number;
    
    // 计算可见范围的大小（秒）
    const visibleRangeSize = visibleEnd - visibleStart;
    
    // 如果用户没有手动滚动，或者当前时间超出了可见范围，才自动滚动
    // 留出一些缓冲空间（可见范围的10%），避免频繁滚动
    const buffer = visibleRangeSize * 0.1;
    const shouldScroll = !userScrolledRef.current || 
                        (currentTimeNum > visibleEnd - buffer) ||
                        (currentTimeNum < visibleStart + buffer);
    
    if (shouldScroll) {
      // 滚动到当前时间，但保持一定的可见范围
      // 使用 scrollToPosition 让当前时间在视图右侧80%的位置
      timeScale.scrollToPosition(-20, false);
      lastScrollTimeRef.current = Date.now();
      userScrolledRef.current = false; // 重置标记，允许继续自动跟随
    }
  }, [currentTime]);

  return (
    <div className="w-full bg-white rounded-lg overflow-hidden">
      <div ref={chartContainerRef} className="w-full" />
    </div>
  );
}
