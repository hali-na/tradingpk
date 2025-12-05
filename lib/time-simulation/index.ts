// 时间模拟引擎模块统一导出

import { TimeSimulationEngine } from './types';
import { TimeSimulationEngineImpl } from './TimeSimulationEngine';

// 导出工厂函数
export function createTimeSimulationEngine(
  startTime: string,
  endTime: string
): TimeSimulationEngine {
  return new TimeSimulationEngineImpl(startTime, endTime);
}

// 导出类型
export * from './types';

