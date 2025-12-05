'use client';

import { useEffect, useRef, useCallback } from 'react';
import {
  createChart,
  IChartApi,
  ISeriesApi,
  CandlestickData,
  Time,
  LineData,
} from 'lightweight-charts';
import { OHLCVData } from '@/types/ohlcv';
import { PaulWeiTrade } from '@/types/paulWei';
import { UserTrade, UserOrder } from '@/types/trading';
import { PaulWeiOrder } from '@/lib/data-loader/paulWeiOrdersLoader';
import { cn } from '@/lib/utils';

// 将 CSS 变量转换为实际颜色值
function getCSSVariableColor(variable: string, element?: HTMLElement): string {
  if (typeof window === 'undefined') {
    return '#888888';
  }

  const el = element || document.documentElement;
  // 提取变量名（去掉 var(-- 和 )）
  const varName = variable.replace(/var\(--/, '').replace(/\)/, '').trim();
  const value = getComputedStyle(el).getPropertyValue(varName).trim();
  
  if (!value) {
    // 如果无法获取变量值，返回默认颜色
    return '#888888';
  }
  
  // 如果已经是颜色值格式，直接返回
  if (value.startsWith('#') || value.startsWith('rgb') || value.startsWith('hsl')) {
    return value;
  }
  
  // 如果是 HSL 格式（可能是 "210 20% 50%" 或 "210, 20%, 50%"）
  // 检查是否包含 % 符号（HSL 的特征）
  if (value.includes('%')) {
    // 将空格或逗号分隔的值转换为标准 HSL 格式
    const hslValues = value.replace(/,/g, ' ').split(/\s+/).filter(v => v);
    if (hslValues.length >= 3) {
      return `hsl(${hslValues[0]}, ${hslValues[1]}, ${hslValues[2]})`;
    }
  }
  
  // 如果包含逗号但没有 hsl() 包装，添加包装
  if (value.includes(',') && !value.includes('hsl(')) {
    return `hsl(${value})`;
  }
  
  return value;
}

// 获取主题颜色
function getThemeColors() {
  if (typeof window === 'undefined') {
    return {
      textColor: '#888888',
      borderColor: '#333333',
      primaryColor: '#3b82f6',
      profitColor: '#10b981', // 绿色 - 上涨
      lossColor: '#ef4444',  // 红色 - 下跌
      accentColor: '#8b5cf6',
    };
  }

  const root = document.documentElement;
  
  // 获取CSS变量值（可能是空格分隔的HSL值）
  const getHSLValue = (varName: string): string => {
    const value = getComputedStyle(root).getPropertyValue(varName).trim();
    if (!value) return '';
    
    // 如果已经是完整格式，直接返回
    if (value.startsWith('hsl(') || value.startsWith('#')) {
      return value;
    }
    
    // 如果是空格分隔的HSL值（如 "142 76% 36%"），转换为hsl()格式
    if (value.includes('%')) {
      const parts = value.replace(/,/g, ' ').split(/\s+/).filter(v => v);
      if (parts.length >= 3) {
        return `hsl(${parts[0]}, ${parts[1]}, ${parts[2]})`;
      }
    }
    
    return value;
  };
  
  // 获取profit和loss颜色，确保是有效的颜色值
  const profitHSL = getHSLValue('--profit');
  const lossHSL = getHSLValue('--loss');
  
  // 如果解析失败，使用默认的绿色和红色
  // 确保颜色值是有效的HSL格式或hex格式
  const profitColor = profitHSL && profitHSL.startsWith('hsl') ? profitHSL : '#10b981'; // 绿色
  const lossColor = lossHSL && lossHSL.startsWith('hsl') ? lossHSL : '#ef4444';         // 红色
  
  return {
    textColor: getCSSVariableColor('var(--muted-foreground)', root) || '#888888',
    borderColor: getCSSVariableColor('var(--border)', root) || '#333333',
    primaryColor: getCSSVariableColor('var(--primary)', root) || '#3b82f6',
    profitColor, // 绿色 - 上涨K线
    lossColor,   // 红色 - 下跌K线
    accentColor: getCSSVariableColor('var(--accent)', root) || '#8b5cf6',
  };
}

type PaulWeiViewMode = 'off' | 'trades' | 'orders' | 'all';

interface KLineChartProps {
  data: OHLCVData[];
  paulWeiTrades?: PaulWeiTrade[];
  userTrades?: UserTrade[];
  paulWeiOrders?: PaulWeiOrder[];
  userOrders?: UserOrder[];
  currentTime?: string;
  startTime?: string;
  height?: number;
  onCrosshairMove?: (price: number | null) => void;
  onPriceChange?: (price: number) => void;
  showPaulWeiTrades?: boolean;
  paulWeiViewMode?: PaulWeiViewMode;
  onPaulWeiViewModeChange?: (mode: PaulWeiViewMode) => void;
  historyDays?: number;
}

export function KLineChart({
  data,
  paulWeiTrades = [],
  userTrades = [],
  paulWeiOrders = [],
  userOrders = [],
  currentTime,
  startTime,
  height = 400,
  onCrosshairMove,
  onPriceChange,
  showPaulWeiTrades = false,
  paulWeiViewMode = 'off',
  onPaulWeiViewModeChange,
  historyDays = 7,
}: KLineChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candlestickSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const paulWeiPriceLinesRef = useRef<Map<number, ISeriesApi<'Line'>>>(
    new Map()
  );
  const paulWeiStopLinesRef = useRef<Map<number, ISeriesApi<'Line'>>>(
    new Map()
  );
  const userPriceLinesRef = useRef<Map<number, ISeriesApi<'Line'>>>(new Map());
  const lastDataLengthRef = useRef<number>(0);
  const userScrolledRef = useRef<boolean>(false);
  const lastScrollTimeRef = useRef<number>(0);

  // 计算是否显示 Paul Wei 的内容
  const showPaulWeiContent = showPaulWeiTrades || paulWeiViewMode !== 'off';
  const showPaulWeiTradesMarkers = showPaulWeiTrades || paulWeiViewMode === 'trades' || paulWeiViewMode === 'all';
  const showPaulWeiOrderLines = paulWeiViewMode === 'orders' || paulWeiViewMode === 'all';

  const convertData = useCallback((ohlcv: OHLCVData[]): CandlestickData[] => {
    return ohlcv.map((item) => ({
      time: (new Date(item.timestamp).getTime() / 1000) as Time,
      open: item.open,
      high: item.high,
      low: item.low,
      close: item.close,
    }));
  }, []);

  // 如果没有数据，显示占位提示，避免空白
  if (!data || data.length === 0) {
    return (
      <div className="w-full h-[450px] glass-card rounded-xl flex items-center justify-center text-muted-foreground">
        暂无K线数据，检查时间范围或数据加载
      </div>
    );
  }

  // 初始化图表
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const colors = getThemeColors();
    
    // 创建带透明度的颜色辅助函数
    const withOpacity = (color: string, opacity: number): string => {
      // 如果是 hex 颜色，转换为 rgba
      if (color.startsWith('#')) {
        const r = parseInt(color.slice(1, 3), 16);
        const g = parseInt(color.slice(3, 5), 16);
        const b = parseInt(color.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${opacity})`;
      }
      // 如果是 hsl，添加 alpha
      if (color.startsWith('hsl(') && !color.includes('rgba')) {
        return color.replace('hsl(', 'hsla(').replace(')', `, ${opacity})`);
      }
      return color;
    };

    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height,
      layout: {
        background: { color: 'transparent' },
        textColor: colors.textColor,
        fontFamily: 'monospace',
      },
      grid: {
        vertLines: { color: withOpacity(colors.borderColor, 0.5) },
        horzLines: { color: withOpacity(colors.borderColor, 0.5) },
      },
      crosshair: { 
        mode: 1,
        vertLine: {
          color: withOpacity(colors.primaryColor, 0.5),
          style: 2,
        },
        horzLine: {
          color: withOpacity(colors.primaryColor, 0.5),
          style: 2,
        }
      },
      rightPriceScale: { 
        borderColor: withOpacity(colors.borderColor, 0.8),
        borderVisible: true,
      },
      timeScale: {
        borderColor: withOpacity(colors.borderColor, 0.8),
        timeVisible: true,
        secondsVisible: false,
        rightOffset: 5,
      },
    });

    // 确保颜色值是有效的格式 - 使用标准红绿色
    // lightweight-charts需要有效的颜色值，优先使用HSL格式
    const upColor = colors.profitColor || 'hsl(142, 76%, 36%)';   // 绿色 - 上涨
    const downColor = colors.lossColor || 'hsl(0, 84%, 60%)';     // 红色 - 下跌
    
    const candlestickSeries = chart.addCandlestickSeries({
      upColor: upColor,
      downColor: downColor,
      borderUpColor: upColor,
      borderDownColor: downColor,
      borderVisible: true,
      wickUpColor: upColor,
      wickDownColor: downColor,
    });

    chartRef.current = chart;
    candlestickSeriesRef.current = candlestickSeries;
    lastDataLengthRef.current = 0;

    paulWeiPriceLinesRef.current.clear();
    paulWeiStopLinesRef.current.clear();
    userPriceLinesRef.current.clear();

    if (onCrosshairMove) {
      chart.subscribeCrosshairMove((param) => {
        if (param.seriesData.size > 0) {
          const d = param.seriesData.get(candlestickSeries) as
            | CandlestickData
            | undefined;
          onCrosshairMove(d?.close || null);
        } else {
          onCrosshairMove(null);
        }
      });
    }

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      paulWeiPriceLinesRef.current.forEach((lineSeries) => {
        try {
          chart.removeSeries(lineSeries);
        } catch {
          /* ignore */
        }
      });
      paulWeiStopLinesRef.current.forEach((lineSeries) => {
        try {
          chart.removeSeries(lineSeries);
        } catch {
          /* ignore */
        }
      });
      userPriceLinesRef.current.forEach((lineSeries) => {
        try {
          chart.removeSeries(lineSeries);
        } catch {
          /* ignore */
        }
      });
      paulWeiPriceLinesRef.current.clear();
      paulWeiStopLinesRef.current.clear();
      userPriceLinesRef.current.clear();
      chart.remove();
    };
  }, [height, onCrosshairMove]);

  const getFilteredData = useCallback(() => {
    if (!currentTime) return data;

    const currentTimeMs = new Date(currentTime).getTime();
    let startTimeMs: number;

    if (startTime) {
      const start = new Date(startTime).getTime();
      startTimeMs = start - historyDays * 24 * 60 * 60 * 1000;
    } else {
      startTimeMs =
        data.length > 0 ? new Date(data[0].timestamp).getTime() : 0;
    }

    return data.filter((item) => {
      const itemTime = new Date(item.timestamp).getTime();
      return itemTime >= startTimeMs && itemTime <= currentTimeMs;
    });
  }, [data, currentTime, startTime, historyDays]);

  // 更新数据
  useEffect(() => {
    if (!candlestickSeriesRef.current || !chartRef.current || data.length === 0)
      return;

    const filteredData = getFilteredData();

    // 如果过滤后没有数据，不更新
    if (filteredData.length === 0) return;

    const chartData = convertData(filteredData);

    try {
      candlestickSeriesRef.current.setData(chartData);
    } catch (e) {
      console.warn('Chart setData error:', e);
      return;
    }

    lastDataLengthRef.current = chartData.length;

    if (onPriceChange) {
      const lastPrice = filteredData[filteredData.length - 1].close;
      onPriceChange(lastPrice);
    }

    // 添加标记
    const markers: any[] = [];

    const filteredTimeRange =
      filteredData.length > 0
        ? {
            start: new Date(filteredData[0].timestamp).getTime(),
            end: new Date(
              filteredData[filteredData.length - 1].timestamp
            ).getTime(),
          }
        : null;

    // Paul Wei 交易标记 - 合并同一K线上的多笔交易
    if (showPaulWeiTradesMarkers && filteredTimeRange) {
      const currentTimeMs = currentTime
        ? new Date(currentTime).getTime()
        : Infinity;

      // 按时间和方向分组
      const groupedTrades = new Map<string, { side: 'Buy' | 'Sell'; count: number; time: number }>();
      
      paulWeiTrades.forEach((trade) => {
        const tradeTime = new Date(trade.datetime).getTime();
        if (tradeTime > currentTimeMs) return;

        let displayTime = tradeTime;
        if (tradeTime < filteredTimeRange.start) {
          displayTime = filteredTimeRange.start;
        } else if (tradeTime > filteredTimeRange.end) {
          displayTime = filteredTimeRange.end;
        }

        // 按秒级时间戳和方向分组
        const timeKey = Math.floor(displayTime / 1000);
        const key = `${timeKey}-${trade.side}`;
        
        const existing = groupedTrades.get(key);
        if (existing) {
          existing.count++;
        } else {
          groupedTrades.set(key, { side: trade.side, count: 1, time: timeKey });
        }
      });

      // 生成合并后的标记 - 使用小圆点
      const colors = getThemeColors();
      groupedTrades.forEach(({ side, count, time }) => {
        markers.push({
          time: time as Time,
          position: side === 'Buy' ? 'belowBar' : 'aboveBar',
          color: side === 'Buy' ? colors.primaryColor : colors.accentColor,
          shape: 'circle',
          text: count > 1 ? `PW${side === 'Buy' ? '买' : '卖'}×${count}` : `PW${side === 'Buy' ? '买' : '卖'}`,
          size: 0.5,
        });
      });
    }

    if (filteredTimeRange) {
      userTrades.forEach((trade) => {
        const tradeTimeMs = new Date(trade.timestamp).getTime();
        const currentTimeMs = currentTime
          ? new Date(currentTime).getTime()
          : Infinity;

        if (tradeTimeMs > currentTimeMs) return;

        let displayTimeMs = tradeTimeMs;

        if (tradeTimeMs < filteredTimeRange.start) {
          displayTimeMs = filteredTimeRange.start;
        } else if (
          tradeTimeMs > filteredTimeRange.end &&
          tradeTimeMs <= currentTimeMs
        ) {
          displayTimeMs = filteredTimeRange.end;
        }

        const time = (displayTimeMs / 1000) as Time;
        const isClosing = !trade.isOpen;

        const colors = getThemeColors();
        if (isClosing) {
          const pnl = trade.pnl ?? 0;
          const isProfit = pnl > 0;
          markers.push({
            time,
            position: trade.side === 'Buy' ? 'aboveBar' : 'belowBar',
            color: isProfit ? colors.profitColor : colors.lossColor,
            shape: 'circle',
            text: `我${trade.side === 'Buy' ? '平空' : '平多'}${isProfit ? '+' : ''}${Math.abs(pnl).toFixed(0)}`,
            size: 1,
          });
        } else {
          markers.push({
            time,
            position: trade.side === 'Buy' ? 'belowBar' : 'aboveBar',
            color: 'hsl(190, 80%, 60%)', // Cyan for user's open positions
            shape: trade.side === 'Buy' ? 'arrowUp' : 'arrowDown',
            text: `我${trade.side === 'Buy' ? '开多' : '开空'}`,
            size: 1,
          });
        }
      });
    }

    if (markers.length > 0) {
      markers.sort((a, b) => (a.time as number) - (b.time as number));
      candlestickSeriesRef.current.setMarkers(markers);
    } else {
      candlestickSeriesRef.current.setMarkers([]);
    }
  }, [
    data,
    paulWeiTrades,
    userTrades,
    currentTime,
    showPaulWeiTradesMarkers,
    getFilteredData,
    convertData,
    onPriceChange,
  ]);

  // 更新价格网格线
  useEffect(() => {
    if (!chartRef.current || !candlestickSeriesRef.current) return;

    const chart = chartRef.current;
    const currentTimeMs = currentTime
      ? new Date(currentTime).getTime()
      : Date.now();

    const filteredData = getFilteredData();
    if (filteredData.length === 0) return;

    const timeRange = {
      start: new Date(filteredData[0].timestamp).getTime() / 1000,
      end:
        new Date(filteredData[filteredData.length - 1].timestamp).getTime() /
        1000,
    };

    // Paul Wei 的未成交限价单
    const paulWeiLimitPrices = new Set<number>();
    // Paul Wei 的止损单
    const paulWeiStopPrices = new Map<number, 'Buy' | 'Sell'>();
    
    if (showPaulWeiOrderLines) {
      paulWeiOrders.forEach((order) => {
        const orderTime = new Date(order.timestamp).getTime();
        if (orderTime > currentTimeMs) return;
        
        // 限价单 - 只显示未成交的
        if (
          order.ordType === 'Limit' &&
          order.price &&
          order.price > 0 &&
          (order.ordStatus === 'Pending' || order.cumQty < order.orderQty)
        ) {
          paulWeiLimitPrices.add(order.price);
        }
        
        // 止损单 - 显示止损触发价格
        if (
          order.ordType === 'Stop' &&
          order.stopPx &&
          order.stopPx > 0 &&
          (order.ordStatus === 'Pending' || order.cumQty < order.orderQty)
        ) {
          paulWeiStopPrices.set(order.stopPx, order.side);
        }
      });
    }

    const userLimitPrices = new Set<number>();
    userOrders.forEach((order) => {
      if (
        order.type === 'Limit' &&
        order.price > 0 &&
        new Date(order.createdAt).getTime() <= currentTimeMs &&
        order.status !== 'Cancelled'
      ) {
        userLimitPrices.add(order.price);
      }
    });

    const existingPaulWeiPrices = new Set(paulWeiPriceLinesRef.current.keys());

    existingPaulWeiPrices.forEach((price) => {
      if (!paulWeiLimitPrices.has(price)) {
        const lineSeries = paulWeiPriceLinesRef.current.get(price);
        if (lineSeries) {
          try {
            chart.removeSeries(lineSeries);
          } catch {
            /* ignore */
          }
          paulWeiPriceLinesRef.current.delete(price);
        }
      }
    });

    const colors = getThemeColors();
    paulWeiLimitPrices.forEach((price) => {
      if (!paulWeiPriceLinesRef.current.has(price)) {
        const lineSeries = chart.addLineSeries({
          color: colors.primaryColor,
          lineWidth: 1,
          lineStyle: 2, // Dashed
          lastValueVisible: false,
          priceLineVisible: false,
        });

        const lineData: LineData[] = [
          { time: timeRange.start as Time, value: price },
          { time: timeRange.end as Time, value: price },
        ];
        lineSeries.setData(lineData);
        paulWeiPriceLinesRef.current.set(price, lineSeries);
      }
    });

    paulWeiPriceLinesRef.current.forEach((lineSeries, price) => {
      if (paulWeiLimitPrices.has(price)) {
        const lineData: LineData[] = [
          { time: timeRange.start as Time, value: price },
          { time: timeRange.end as Time, value: price },
        ];
        try {
          lineSeries.setData(lineData);
        } catch {
          /* ignore */
        }
      }
    });

    // Paul Wei 止损线 - 红色虚线
    const existingStopPrices = new Set(paulWeiStopLinesRef.current.keys());

    existingStopPrices.forEach((price) => {
      if (!paulWeiStopPrices.has(price)) {
        const lineSeries = paulWeiStopLinesRef.current.get(price);
        if (lineSeries) {
          try {
            chart.removeSeries(lineSeries);
          } catch {
            /* ignore */
          }
          paulWeiStopLinesRef.current.delete(price);
        }
      }
    });

    paulWeiStopPrices.forEach((side, price) => {
      if (!paulWeiStopLinesRef.current.has(price)) {
        const lineSeries = chart.addLineSeries({
          color: side === 'Sell' ? colors.lossColor : colors.accentColor, // Sell stop = loss, Buy stop = accent
          lineWidth: 1,
          lineStyle: 3, // Dotted
          lastValueVisible: false,
          priceLineVisible: false,
        });

        const lineData: LineData[] = [
          { time: timeRange.start as Time, value: price },
          { time: timeRange.end as Time, value: price },
        ];
        lineSeries.setData(lineData);
        paulWeiStopLinesRef.current.set(price, lineSeries);
      }
    });

    paulWeiStopLinesRef.current.forEach((lineSeries, price) => {
      if (paulWeiStopPrices.has(price)) {
        const lineData: LineData[] = [
          { time: timeRange.start as Time, value: price },
          { time: timeRange.end as Time, value: price },
        ];
        try {
          lineSeries.setData(lineData);
        } catch {
          /* ignore */
        }
      }
    });

    const existingUserPrices = new Set(userPriceLinesRef.current.keys());

    existingUserPrices.forEach((price) => {
      if (!userLimitPrices.has(price)) {
        const lineSeries = userPriceLinesRef.current.get(price);
        if (lineSeries) {
          try {
            chart.removeSeries(lineSeries);
          } catch {
            /* ignore */
          }
          userPriceLinesRef.current.delete(price);
        }
      }
    });

    userLimitPrices.forEach((price) => {
      if (!userPriceLinesRef.current.has(price)) {
        const lineSeries = chart.addLineSeries({
          color: 'hsl(190, 80%, 60%)', // Cyan
          lineWidth: 1,
          lineStyle: 2,
          lastValueVisible: false,
          priceLineVisible: false,
        });

        const lineData: LineData[] = [
          { time: timeRange.start as Time, value: price },
          { time: timeRange.end as Time, value: price },
        ];
        lineSeries.setData(lineData);
        userPriceLinesRef.current.set(price, lineSeries);
      }
    });

    userPriceLinesRef.current.forEach((lineSeries, price) => {
      if (userLimitPrices.has(price)) {
        const lineData: LineData[] = [
          { time: timeRange.start as Time, value: price },
          { time: timeRange.end as Time, value: price },
        ];
        try {
          lineSeries.setData(lineData);
        } catch {
          /* ignore */
        }
      }
    });
  }, [paulWeiOrders, userOrders, currentTime, showPaulWeiOrderLines, getFilteredData]);

  // 监听用户手动滚动
  useEffect(() => {
    if (!chartRef.current) return;

    const timeScale = chartRef.current.timeScale();

    const handleVisibleRangeChange = () => {
      try {
        const now = Date.now();
        if (now - lastScrollTimeRef.current > 1000) {
          userScrolledRef.current = true;
        }
      } catch {
        /* ignore */
      }
    };

    try {
      timeScale.subscribeVisibleTimeRangeChange(handleVisibleRangeChange);
    } catch {
      /* ignore */
    }

    return () => {
      try {
        timeScale.unsubscribeVisibleTimeRangeChange(handleVisibleRangeChange);
      } catch {
        /* ignore */
      }
    };
  }, []);

  // 自动滚动到最新K线
  useEffect(() => {
    if (!chartRef.current || !currentTime || userScrolledRef.current) return;

    const filteredData = getFilteredData();
    if (filteredData.length === 0) return;

    if (filteredData.length === lastDataLengthRef.current) return;

    const timeScale = chartRef.current.timeScale();

    try {
      const visibleRange = timeScale.getVisibleRange();
      if (!visibleRange) return;

      const lastCandleTime =
        new Date(filteredData[filteredData.length - 1].timestamp).getTime() /
        1000;
      if (lastCandleTime <= (visibleRange.to as number)) return;

      timeScale.scrollToRealTime();
      lastScrollTimeRef.current = Date.now();
    } catch {
      /* ignore */
    }
  }, [currentTime, getFilteredData]);

  // 切换 Paul Wei 视图模式
  const cycleViewMode = () => {
    if (!onPaulWeiViewModeChange) return;
    const modes: PaulWeiViewMode[] = ['off', 'trades', 'orders', 'all'];
    const currentIndex = modes.indexOf(paulWeiViewMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    onPaulWeiViewModeChange(modes[nextIndex]);
  };

  const getViewModeLabel = () => {
    switch (paulWeiViewMode) {
      case 'off': return '关闭';
      case 'trades': return '交易';
      case 'orders': return '挂单';
      case 'all': return '全部';
    }
  };

  const getViewModeColor = () => {
    switch (paulWeiViewMode) {
      case 'off': return 'text-gray-400';
      case 'trades': return 'text-purple-500';
      case 'orders': return 'text-green-500';
      case 'all': return 'text-blue-500';
    }
  };

  return (
    <div className="w-full h-full" style={{ position: 'relative' }}>
      {/* 图表容器 - z-index 较低 */}
      <div ref={chartContainerRef} className="w-full h-full" style={{ position: 'absolute', top: 0, left: 0, zIndex: 1 }} />
      
      {/* Paul Wei 视图切换按钮 */}
      {onPaulWeiViewModeChange && (
        <button
          onClick={cycleViewMode}
          style={{ position: 'absolute', top: 8, right: 8, zIndex: 10 }}
          className={cn(
            'p-1.5 rounded-lg border-2 shadow-lg hover:shadow-xl transition-all glass-card flex items-center gap-1 text-xs',
            getViewModeColor()
          )}
          title={`Paul Wei 视图: ${getViewModeLabel()}`}
        >
          <span className="text-lg">👁️</span>
          <span className="font-medium min-w-[28px]">{getViewModeLabel()}</span>
        </button>
      )}

      {/* 图例说明 */}
      {paulWeiViewMode !== 'off' && (
        <div 
          style={{ position: 'absolute', bottom: 8, right: 8, zIndex: 10 }}
          className="glass-card border-2 rounded-lg shadow-lg p-2 text-xs space-y-1"
        >
          <div className="font-medium text-foreground mb-1">Paul Wei 图例</div>
          {(paulWeiViewMode === 'trades' || paulWeiViewMode === 'all') && (
            <>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{backgroundColor: 'hsl(var(--primary))'}}></span>
                <span className="text-muted-foreground">买入</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{backgroundColor: 'hsl(var(--accent))'}}></span>
                <span className="text-muted-foreground">卖出</span>
              </div>
            </>
          )}
          {(paulWeiViewMode === 'orders' || paulWeiViewMode === 'all') && (
            <>
              <div className="flex items-center gap-2">
                <span className="w-4 border-t-2 border-dashed" style={{borderColor: 'hsl(var(--primary))'}}></span>
                <span className="text-muted-foreground">限价单</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 border-t-2 border-dotted" style={{borderColor: 'hsl(var(--loss))'}}></span>
                <span className="text-muted-foreground">止损单</span>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
