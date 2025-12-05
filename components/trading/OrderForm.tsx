'use client';

import { useState } from 'react';
import { Side, OrderType, Symbol } from '@/types/common';
import { Button } from '@/components/ui/button';
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
    <div className="glass-card border-2 border-primary/30 rounded-xl shadow-lg p-4 backdrop-blur-xl">
      <h3 className="text-lg font-bold mb-4 text-primary" style={{ textShadow: '0 0 10px hsl(var(--primary)/0.5)' }}>下单</h3>

      {/* 当前价格和余额 */}
      <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
        <div className="glass rounded-lg p-2 border border-primary/20">
          <span className="text-muted-foreground text-xs font-medium">当前价格:</span>
          <div className="font-mono font-bold text-primary text-base mt-0.5" style={{ textShadow: '0 0 5px hsl(var(--primary)/0.5)' }}>
            ${currentPrice.toLocaleString()}
          </div>
        </div>
        <div className="glass rounded-lg p-2 border border-accent/20">
          <span className="text-muted-foreground text-xs font-medium">可用余额:</span>
          <div className="font-mono font-bold text-accent text-base mt-0.5" style={{ textShadow: '0 0 5px hsl(var(--accent)/0.5)' }}>
            ${balance.toLocaleString()}
          </div>
        </div>
      </div>

      {/* 快速下单按钮 */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <Button
          variant="buy"
          onClick={() => handleQuickOrder('Buy')}
          className="w-full h-14 shadow-[0_0_16px_hsl(var(--profit)/0.45)]"
        >
          <span className="flex flex-col items-center leading-tight">
            <span className="text-base font-semibold">快速买入</span>
            <span className="text-xs opacity-80">市价立即成交</span>
          </span>
        </Button>
        <Button
          variant="sell"
          onClick={() => handleQuickOrder('Sell')}
          className="w-full h-14 shadow-[0_0_16px_hsl(var(--loss)/0.45)]"
        >
          <span className="flex flex-col items-center leading-tight">
            <span className="text-base font-semibold">快速卖出</span>
            <span className="text-xs opacity-80">市价立即成交</span>
          </span>
        </Button>
      </div>

      <div className="border-t border-primary/20 my-4"></div>

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
        <div className="flex justify-between text-xs text-muted-foreground bg-background/30 rounded-lg p-2 border border-primary/10">
          <span className="font-medium">
            合约说明：当前为 {symbol || 'XBTUSD'} 反向永续，1 张 ≈ 1 USD 名义价值
          </span>
          <span className="font-mono text-primary font-semibold">
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

        <Button
          onClick={handleSubmit}
          className="w-full h-12 text-base shadow-[0_0_18px_hsl(var(--primary)/0.45)]"
          variant={side === 'Buy' ? 'buy' : 'sell'}
        >
          {side === 'Buy' ? '提交买入订单' : '提交卖出订单'}
        </Button>
      </div>
    </div>
  );
}
