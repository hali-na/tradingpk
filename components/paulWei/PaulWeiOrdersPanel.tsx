'use client';

import { useState } from 'react';
import { PaulWeiOrder } from '@/lib/data-loader/paulWeiOrdersLoader';

interface PaulWeiOrdersPanelProps {
  orders: PaulWeiOrder[];
  currentTime?: string;
}

export function PaulWeiOrdersPanel({ orders, currentTime }: PaulWeiOrdersPanelProps) {
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  // 过滤显示当前时间之前的订单
  const visibleOrders = currentTime
    ? orders.filter((order) => new Date(order.timestamp).getTime() <= new Date(currentTime).getTime())
    : orders;

  if (visibleOrders.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-semibold mb-4">Paul Wei 订单详情</h3>
        <p className="text-gray-500 text-sm">暂无订单数据</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Paul Wei 订单详情</h3>
        <span className="text-sm text-gray-500">
          共 {visibleOrders.length} 个订单
        </span>
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {visibleOrders.map((order) => {
          const isExpanded = expandedOrderId === order.orderID;
          const isFilled = order.ordStatus === 'Filled';
          const isCanceled = order.ordStatus === 'Canceled';
          const isPending = order.ordStatus === 'Pending';
          const fillRate = order.orderQty > 0 ? (order.cumQty / order.orderQty) * 100 : 0;

          return (
            <div
              key={order.orderID}
              className="border rounded-lg p-3 hover:bg-gray-50 transition-colors"
            >
              {/* 订单头部 */}
              <div
                className="flex items-center justify-between cursor-pointer"
                onClick={() => setExpandedOrderId(isExpanded ? null : order.orderID)}
              >
                <div className="flex items-center gap-3 flex-1">
                  <span
                    className={`px-2 py-1 text-xs rounded font-medium ${
                      order.side === 'Buy'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {order.side}
                  </span>
                  <span className="text-xs text-gray-500">{order.ordType}</span>
                  <span className="font-mono text-sm">
                    {order.orderQty.toLocaleString()} @{' '}
                    {order.price ? `$${order.price.toLocaleString()}` : '市价'}
                  </span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded ${
                      isFilled
                        ? 'bg-blue-100 text-blue-700'
                        : isCanceled
                        ? 'bg-gray-100 text-gray-700'
                        : isPending
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-orange-100 text-orange-700'
                    }`}
                  >
                    {order.ordStatus === 'Filled'
                      ? '已成交'
                      : order.ordStatus === 'Canceled'
                      ? '已取消'
                      : order.ordStatus === 'Pending'
                      ? '待成交'
                      : '部分成交'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {order.executions.length > 0 && (
                    <span className="text-xs text-gray-500">
                      {order.executions.length} 次执行
                    </span>
                  )}
                  <span className="text-xs text-gray-400">
                    {fillRate.toFixed(1)}%
                  </span>
                  <span className="text-gray-400">
                    {isExpanded ? '▼' : '▶'}
                  </span>
                </div>
              </div>

              {/* 订单详情（展开时显示） */}
              {isExpanded && (
                <div className="mt-3 pt-3 border-t space-y-2">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-500">订单ID:</span>
                      <span className="ml-2 font-mono text-xs">{order.orderID}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">时间:</span>
                      <span className="ml-2">
                        {new Date(order.timestamp).toLocaleString('zh-CN')}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">订单数量:</span>
                      <span className="ml-2 font-mono">{order.orderQty.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">已成交:</span>
                      <span className="ml-2 font-mono">{order.cumQty.toLocaleString()}</span>
                    </div>
                    {order.avgPx && (
                      <div>
                        <span className="text-gray-500">平均价格:</span>
                        <span className="ml-2 font-mono">${order.avgPx.toLocaleString()}</span>
                      </div>
                    )}
                    {order.text && (
                      <div className="col-span-2">
                        <span className="text-gray-500">备注:</span>
                        <span className="ml-2 text-xs">{order.text}</span>
                      </div>
                    )}
                  </div>

                  {/* 执行记录 */}
                  {order.executions.length > 0 && (
                    <div className="mt-3">
                      <h5 className="text-sm font-medium text-gray-700 mb-2">执行记录:</h5>
                      <div className="space-y-1 max-h-40 overflow-y-auto">
                        {order.executions.map((exec, idx) => (
                          <div
                            key={exec.execID}
                            className="bg-gray-50 rounded p-2 text-xs"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-mono">
                                #{idx + 1} {exec.lastQty.toLocaleString()} @ ${exec.lastPx.toLocaleString()}
                              </span>
                              <span className="text-gray-500">
                                {new Date(exec.timestamp).toLocaleTimeString('zh-CN')}
                              </span>
                            </div>
                            <div className="text-gray-400 mt-1">
                              状态: {exec.ordStatus} | 手续费: {exec.execComm.toLocaleString()}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

