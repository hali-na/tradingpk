'use client';

import { UserOrder, UserTrade } from '@/types/trading';
import { Button } from '../common/Button';

interface OrderHistoryProps {
  orders: UserOrder[];
  trades: UserTrade[];
  onCancelOrder: (orderId: string) => void;
}

export function OrderHistory({ orders, trades, onCancelOrder }: OrderHistoryProps) {
  const pendingOrders = orders.filter((o) => o.status === 'Pending');

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="text-lg font-semibold mb-4">订单</h3>

      {/* 待成交订单 */}
      {pendingOrders.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-600 mb-2">待成交</h4>
          <div className="space-y-2">
            {pendingOrders.map((order) => (
              <div
                key={order.id}
                className="border rounded p-2 flex items-center justify-between text-sm"
              >
                <div>
                  <span
                    className={`px-1.5 py-0.5 text-xs rounded ${
                      order.side === 'Buy'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {order.side}
                  </span>
                  <span className="ml-2 text-gray-600">{order.type}</span>
                  <span className="ml-2 font-mono">
                    {order.quantity} @ ${order.price.toLocaleString()}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onCancelOrder(order.id)}
                >
                  取消
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 成交记录 */}
      <div>
        <h4 className="text-sm font-medium text-gray-600 mb-2">成交记录</h4>
        {trades.length === 0 ? (
          <p className="text-gray-500 text-sm">暂无成交</p>
        ) : (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {trades
              .slice()
              .reverse()
              .map((trade) => (
                <div
                  key={trade.id}
                  className="border rounded p-2 text-sm"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span
                        className={`px-1.5 py-0.5 text-xs rounded ${
                          trade.side === 'Buy'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {trade.side}
                      </span>
                      <span className="ml-2 font-mono">
                        {trade.quantity} @ ${trade.price.toLocaleString()}
                      </span>
                    </div>
                    <span className="text-gray-500 text-xs">
                      {trade.orderType}
                    </span>
                  </div>
                  <div className="text-xs text-gray-400 mt-1 flex justify-between">
                    <span>
                      手续费: ${trade.fee.toFixed(4)}
                    </span>
                    <span>
                      时间: {new Date(trade.timestamp).toLocaleString('zh-CN')}
                    </span>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
