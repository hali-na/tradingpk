// 对比分析模块统一导出

export * from './types';
export { ComparisonAnalyzerImpl } from './ComparisonAnalyzer';
export { MetricsCalculator } from './MetricsCalculator';

import { ComparisonAnalyzerImpl } from './ComparisonAnalyzer';

export function createComparisonAnalyzer() {
  return new ComparisonAnalyzerImpl();
}
