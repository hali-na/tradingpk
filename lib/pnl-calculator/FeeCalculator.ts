// 手续费计算器实现

import { FeeRate, FeeCalculator } from './types';

export class FeeCalculatorImpl implements FeeCalculator {
  // 默认费率（BitMEX 历史费率）
  private defaultFeeRate: FeeRate = {
    maker: 0.00025, // 0.025%
    taker: 0.00075, // 0.075%
  };

  // 历史费率变更记录
  private feeRateHistory: { date: string; rate: FeeRate }[] = [
    {
      date: '2019-01-01',
      rate: { maker: 0.00025, taker: 0.00075 },
    },
    {
      date: '2020-01-01',
      rate: { maker: 0.00025, taker: 0.00075 },
    },
    // 可以根据需要添加更多历史费率
  ];

  calculateFee(
    quantity: number,
    price: number,
    orderType: 'Market' | 'Limit',
    feeRate: FeeRate
  ): number {
    const notionalValue = quantity * price;
    const rate = orderType === 'Limit' ? feeRate.maker : feeRate.taker;
    return notionalValue * rate;
  }

  getHistoricalFeeRate(time: string): FeeRate {
    const targetTime = new Date(time).getTime();

    // 从最新到最旧查找适用的费率
    for (let i = this.feeRateHistory.length - 1; i >= 0; i--) {
      const entry = this.feeRateHistory[i];
      const entryTime = new Date(entry.date).getTime();
      if (targetTime >= entryTime) {
        return entry.rate;
      }
    }

    return this.defaultFeeRate;
  }

  // 计算市价单手续费
  calculateMarketOrderFee(
    quantity: number,
    price: number,
    time: string
  ): number {
    const feeRate = this.getHistoricalFeeRate(time);
    return this.calculateFee(quantity, price, 'Market', feeRate);
  }

  // 计算限价单手续费
  calculateLimitOrderFee(
    quantity: number,
    price: number,
    time: string
  ): number {
    const feeRate = this.getHistoricalFeeRate(time);
    return this.calculateFee(quantity, price, 'Limit', feeRate);
  }
}
