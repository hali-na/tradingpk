// 最大回撤计算器实现

import { MaxDrawdownCalculator } from './types';

export class MaxDrawdownCalculatorImpl implements MaxDrawdownCalculator {
  calculateMaxDrawdown(equityHistory: number[]): number {
    if (equityHistory.length < 2) {
      return 0;
    }

    let maxDrawdown = 0;
    let peak = equityHistory[0];

    for (const equity of equityHistory) {
      if (equity > peak) {
        peak = equity;
      }

      const drawdown = (peak - equity) / peak;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }
    }

    return maxDrawdown * 100; // 返回百分比
  }

  calculateDrawdownSeries(equityHistory: number[]): number[] {
    if (equityHistory.length === 0) {
      return [];
    }

    const drawdownSeries: number[] = [];
    let peak = equityHistory[0];

    for (const equity of equityHistory) {
      if (equity > peak) {
        peak = equity;
      }

      const drawdown = ((peak - equity) / peak) * 100;
      drawdownSeries.push(drawdown);
    }

    return drawdownSeries;
  }

  // 计算当前回撤
  calculateCurrentDrawdown(equityHistory: number[]): number {
    if (equityHistory.length === 0) {
      return 0;
    }

    const peak = Math.max(...equityHistory);
    const current = equityHistory[equityHistory.length - 1];

    return ((peak - current) / peak) * 100;
  }

  // 计算恢复比率（从最大回撤恢复的程度）
  calculateRecoveryRatio(equityHistory: number[]): number {
    if (equityHistory.length < 2) {
      return 100;
    }

    let peak = equityHistory[0];
    let trough = equityHistory[0];
    let maxDrawdownPeak = peak;

    for (const equity of equityHistory) {
      if (equity > peak) {
        peak = equity;
        trough = equity;
      } else if (equity < trough) {
        trough = equity;
        maxDrawdownPeak = peak;
      }
    }

    const maxDrawdown = maxDrawdownPeak - trough;
    if (maxDrawdown === 0) {
      return 100;
    }

    const current = equityHistory[equityHistory.length - 1];
    const recovery = current - trough;

    return (recovery / maxDrawdown) * 100;
  }
}
