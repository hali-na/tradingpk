// 挑战验证器实现

import { Symbol } from '@/types/common';
import { Challenge, ChallengeValidator } from './types';

export class ChallengeValidatorImpl implements ChallengeValidator {
  private validSymbols: Symbol[] = ['XBTUSD', 'ETHUSD'];

  validateTimeRange(startTime: string, endTime: string): boolean {
    const start = new Date(startTime).getTime();
    const end = new Date(endTime).getTime();

    // 检查时间格式是否有效
    if (isNaN(start) || isNaN(end)) {
      return false;
    }

    // 结束时间必须大于开始时间
    if (end <= start) {
      return false;
    }

    // 时间范围不能超过 1 年
    const oneYear = 365 * 24 * 60 * 60 * 1000;
    if (end - start > oneYear) {
      return false;
    }

    // 开始时间不能在未来
    const now = Date.now();
    if (start > now) {
      return false;
    }

    return true;
  }

  validateSymbol(symbol: Symbol): boolean {
    return this.validSymbols.includes(symbol);
  }

  canStartChallenge(challenge: Challenge): boolean {
    // 检查挑战状态
    if (challenge.status !== 'pending') {
      return false;
    }

    // 检查是否有 paul wei 交易数据
    if (!challenge.paulWeiTrades || challenge.paulWeiTrades.length === 0) {
      return false;
    }

    // 检查时间范围
    if (!this.validateTimeRange(challenge.startTime, challenge.endTime)) {
      return false;
    }

    // 检查交易对
    if (!this.validateSymbol(challenge.symbol)) {
      return false;
    }

    return true;
  }

  // 获取验证错误信息
  getValidationErrors(challenge: Challenge): string[] {
    const errors: string[] = [];

    if (challenge.status !== 'pending') {
      errors.push('挑战状态不是待开始');
    }

    if (!challenge.paulWeiTrades || challenge.paulWeiTrades.length === 0) {
      errors.push('该时间段内没有 paul wei 的交易记录');
    }

    if (!this.validateTimeRange(challenge.startTime, challenge.endTime)) {
      errors.push('时间范围无效');
    }

    if (!this.validateSymbol(challenge.symbol)) {
      errors.push('不支持的交易对');
    }

    return errors;
  }
}
