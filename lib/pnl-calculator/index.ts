// 收益计算模块统一导出

export * from './types';
export { UserPnLCalculator } from './UserPnLCalculator';
export { PaulWeiPnLCalculator } from './PaulWeiPnLCalculator';
export { FeeCalculatorImpl } from './FeeCalculator';
export { MaxDrawdownCalculatorImpl } from './MaxDrawdownCalculator';

import { UserPnLCalculator } from './UserPnLCalculator';
import { PaulWeiPnLCalculator } from './PaulWeiPnLCalculator';
import { FeeCalculatorImpl } from './FeeCalculator';
import { MaxDrawdownCalculatorImpl } from './MaxDrawdownCalculator';

// 工厂函数
export function createUserPnLCalculator() {
  return new UserPnLCalculator();
}

export function createPaulWeiPnLCalculator() {
  return new PaulWeiPnLCalculator();
}

export function createFeeCalculator() {
  return new FeeCalculatorImpl();
}

export function createMaxDrawdownCalculator() {
  return new MaxDrawdownCalculatorImpl();
}

// 单例实例
let paulWeiPnLCalculatorInstance: PaulWeiPnLCalculator | null = null;

export function getPaulWeiPnLCalculator(): PaulWeiPnLCalculator {
  if (!paulWeiPnLCalculatorInstance) {
    paulWeiPnLCalculatorInstance = new PaulWeiPnLCalculator();
  }
  return paulWeiPnLCalculatorInstance;
}
