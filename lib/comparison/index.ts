// 对比分析模块统一导出

export * from './types';
export { ComparisonAnalyzerImpl } from './ComparisonAnalyzer';
export { MetricsCalculator } from './MetricsCalculator';

import { ComparisonAnalyzerImpl } from './ComparisonAnalyzer';

// 单例模式：避免重复创建实例
let comparisonAnalyzerInstance: ComparisonAnalyzerImpl | null = null;
let initializePromise: Promise<void> | null = null;

/**
 * 获取对比分析器单例实例
 */
export function getComparisonAnalyzer(): ComparisonAnalyzerImpl {
  if (!comparisonAnalyzerInstance) {
    comparisonAnalyzerInstance = new ComparisonAnalyzerImpl();
  }
  return comparisonAnalyzerInstance;
}

/**
 * 获取已初始化的对比分析器（异步）
 */
export async function getInitializedComparisonAnalyzer(): Promise<ComparisonAnalyzerImpl> {
  const analyzer = getComparisonAnalyzer();
  if (!initializePromise) {
    initializePromise = analyzer.initialize();
  }
  await initializePromise;
  return analyzer;
}
