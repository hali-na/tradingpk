// 订单匹配器实现

import { Side } from '@/types/common';
import { UserOrder } from '@/types/trading';
import { OrderMatcher } from './types';

export class OrderMatcherImpl implements OrderMatcher {
  matchMarketOrder(
    side: Side,
    quantity: number,
    currentPrice: number,
    slippage: number
  ): { executedPrice: number; executedQuantity: number } {
    // 市价单考虑滑点
    // 买入时价格略高，卖出时价格略低
    const slippageMultiplier = side === 'Buy' ? 1 + slippage : 1 - slippage;
    const executedPrice = currentPrice * slippageMultiplier;

    return {
      executedPrice: Math.round(executedPrice * 100) / 100, // 保留两位小数
      executedQuantity: quantity,
    };
  }

  checkLimitOrder(order: UserOrder, currentPrice: number): boolean {
    if (order.type !== 'Limit' || order.status !== 'Pending') {
      return false;
    }

    // 限价买单：当前价格 <= 限价
    // 限价卖单：当前价格 >= 限价
    if (order.side === 'Buy') {
      return currentPrice <= order.price;
    } else {
      return currentPrice >= order.price;
    }
  }

  checkStopOrder(order: UserOrder, currentPrice: number): boolean {
    if (order.type !== 'Stop' || order.status !== 'Pending') {
      return false;
    }

    // 止损买单（空头止损）：当前价格 >= 触发价
    // 止损卖单（多头止损）：当前价格 <= 触发价
    if (order.side === 'Buy') {
      return currentPrice >= order.price;
    } else {
      return currentPrice <= order.price;
    }
  }

  getTriggeredOrders(orders: UserOrder[], currentPrice: number): UserOrder[] {
    return orders.filter((order) => {
      if (order.status !== 'Pending') {
        return false;
      }

      if (order.type === 'Limit') {
        return this.checkLimitOrder(order, currentPrice);
      } else if (order.type === 'Stop') {
        return this.checkStopOrder(order, currentPrice);
      }

      return false;
    });
  }
}
