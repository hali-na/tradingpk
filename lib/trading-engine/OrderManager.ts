// 订单管理器实现

import { Side, OrderType } from '@/types/common';
import { UserOrder } from '@/types/trading';
import { OrderManager, PlaceOrderParams } from './types';

export class OrderManagerImpl implements OrderManager {
  private orders: Map<string, UserOrder> = new Map();
  private orderCounter: number = 0;

  createOrder(params: PlaceOrderParams, challengeId: string, currentTime: string): UserOrder {
    const orderId = `order_${++this.orderCounter}_${Date.now()}`;
    
    const order: UserOrder = {
      id: orderId,
      challengeId,
      type: params.orderType === 'Limit' ? 'Limit' : 'Stop',
      side: params.side,
      price: params.price || 0,
      quantity: params.quantity,
      createdAt: currentTime,
      status: 'Pending',
    };

    this.orders.set(orderId, order);
    return order;
  }

  updateOrderStatus(orderId: string, status: UserOrder['status']): boolean {
    const order = this.orders.get(orderId);
    if (!order) {
      return false;
    }
    order.status = status;
    return true;
  }

  cancelOrder(orderId: string): boolean {
    const order = this.orders.get(orderId);
    if (!order || order.status !== 'Pending') {
      return false;
    }
    order.status = 'Cancelled';
    return true;
  }

  getPendingOrders(): UserOrder[] {
    return Array.from(this.orders.values()).filter(
      (order) => order.status === 'Pending'
    );
  }

  getOrderById(orderId: string): UserOrder | undefined {
    return this.orders.get(orderId);
  }

  getAllOrders(): UserOrder[] {
    return Array.from(this.orders.values());
  }

  reset(): void {
    this.orders.clear();
    this.orderCounter = 0;
  }
}
