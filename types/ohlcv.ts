// K线数据类型定义

export interface OHLCVData {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  trades: number;
}

export interface OHLCVDataset {
  '1m': OHLCVData[];
  '5m': OHLCVData[];
  '1h': OHLCVData[];
  '1d': OHLCVData[];
}

