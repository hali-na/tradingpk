// 交易引擎模块统一导出

export * from './types';
export { TradingEngineImpl } from './TradingEngine';
export { OrderManagerImpl } from './OrderManager';
export { PositionManagerImpl } from './PositionManager';
export { OrderMatcherImpl } from './OrderMatcher';

import { TradingEngineImpl } from './TradingEngine';
import { TradingEngineConfig } from './types';

// 工厂函数
export function createTradingEngine(config: TradingEngineConfig) {
  return new TradingEngineImpl(config);
}

// 默认配置
export const DEFAULT_TRADING_CONFIG: Partial<TradingEngineConfig> = {
  initialBalance: 10000,
  makerFeeRate: 0.00025, // 0.025%
  takerFeeRate: 0.00075, // 0.075%
  slippage: 0.001, // 0.1%
};
