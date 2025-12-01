'use client';

import { useState } from 'react';
import { Side, OrderType, Symbol } from '@/types/common';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Select } from '../common/Select';

interface OrderFormProps {
  currentPrice: number;
  balance: number;
  symbol?: Symbol;
  onPlaceOrder: (side: Side, quantity: number, orderType: OrderType, price?: number) => void;
}

export function OrderForm({ currentPrice, balance, symbol, onPlaceOrder }: OrderFormProps) {
  const [side, setSide] = useState<Side>('Buy');
  const [orderType, setOrderType] = useState<OrderType>('Market');
  const [quantity, setQuantity] = useState<string>('100');
  const [price, setPrice] = useState<string>('');

  const handleSubmit = () => {
    const qty = parseFloat(quantity);
    if (isNaN(qty) || qty <= 0) {
      alert('请输入有效的数量');
      return;
    }

    if (orderType !== 'Market') {
      const p = parseFloat(price);
      if (isNaN(p) || p <= 0) {
        alert('请输入有效的价格');
        return;
      }
      onPlaceOrder(side, qty, orderType, p);
    } else {
      onPlaceOrder(side, qty, orderType);
    }
  };

  const handleQuickOrder = (s: Side) => {
    const qty = parseFloat(quantity);
    if (isNaN(qty) || qty <= 0) {
      alert('请输入有效的数量');
      return;
    }
    onPlaceOrder(s, qty, 'Market');
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="text-lg font-semibold mb-4">下单</h3>

      {/* 当前价格和余额 */}
      <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
        <div>
          <span className="text-gray-500">当前价格:</span>
          <span className="ml-2 font-mono font-semibold">
            ${currentPrice.toLocaleString()}
          </span>
        </div>
        <div>
          <span className="text-gray-500">可用余额:</span>
          <span className="ml-2 font-mono font-semibold">
            ${balance.toLocaleString()}
          </span>
        </div>
      </div>

      {/* 快速下单按钮 */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <Button
          variant="success"
          onClick={() => handleQuickOrder('Buy')}
          className="w-full"
        >
          开多 / 买入
        </Button>
        <Button
          variant="danger"
          onClick={() => handleQuickOrder('Sell')}
          className="w-full"
        >
          开空 / 卖出
        </Button>
      </div>

      <hr className="my-4" />

      {/* 详细下单表单 */}
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <Select
            label="方向"
            value={side}
            onChange={(e) => setSide(e.target.value as Side)}
            options={[
              { value: 'Buy', label: '买入/做多' },
              { value: 'Sell', label: '卖出/做空' },
            ]}
          />
          <Select
            label="类型"
            value={orderType}
            onChange={(e) => setOrderType(e.target.value as OrderType)}
            options={[
              { value: 'Market', label: '市价单' },
              { value: 'Limit', label: '限价单' },
              { value: 'Stop', label: '止损单' },
            ]}
          />
        </div>

        <Input
          label="合约张数"
          type="number"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          placeholder="例如 100 = 100 张合约"
        />
        <div className="flex justify-between text-xs text-gray-500">
          <span>
            合约说明：当前为 {symbol || 'XBTUSD'} 反向永续，1 张 ≈ 1 USD 名义价值
          </span>
          <span className="font-mono">
            ≈{' '}
            {(() => {
              const qty = parseFloat(quantity);
              if (isNaN(qty) || qty <= 0) return '-';
              return `${qty.toLocaleString()} USD 名义价值`;
            })()}
          </span>
        </div>

        {orderType !== 'Market' && (
          <Input
            label={orderType === 'Limit' ? '限价' : '触发价'}
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="输入价格"
          />
        )}

        <Button onClick={handleSubmit} className="w-full">
          下单
        </Button>
      </div>
    </div>
  );
}
