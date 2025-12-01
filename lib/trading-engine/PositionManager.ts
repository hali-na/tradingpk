// 持仓管理器实现

import { Side } from '@/types/common';
import { UserPosition } from '@/types/trading';
import { PositionManager } from './types';

export class PositionManagerImpl implements PositionManager {
  private positions: Map<string, UserPosition> = new Map();
  private positionCounter: number = 0;

  openPosition(
    side: Side,
    quantity: number,
    entryPrice: number,
    entryTime: string
  ): UserPosition {
    const positionId = `pos_${++this.positionCounter}_${Date.now()}`;
    
    const position: UserPosition = {
      id: positionId,
      side: side === 'Buy' ? 'Long' : 'Short',
      quantity,
      entryPrice,
      entryTime,
      unrealizedPnl: 0,
    };

    this.positions.set(positionId, position);
    return position;
  }

  closePosition(
    positionId: string,
    exitPrice: number
  ): { position: UserPosition; pnl: number } | null {
    const position = this.positions.get(positionId);
    if (!position) {
      return null;
    }

    // 计算已实现盈亏
    const pnl = this.calculatePnl(position, exitPrice);
    
    // 删除持仓
    this.positions.delete(positionId);

    return { position, pnl };
  }

  updateUnrealizedPnl(currentPrice: number): void {
    this.positions.forEach((position) => {
      position.unrealizedPnl = this.calculatePnl(position, currentPrice);
    });
  }

  getPositions(): UserPosition[] {
    return Array.from(this.positions.values());
  }

  getPositionById(positionId: string): UserPosition | undefined {
    return this.positions.get(positionId);
  }

  getNetPosition(): { side: 'Long' | 'Short' | 'Neutral'; quantity: number } {
    let longQty = 0;
    let shortQty = 0;

    this.positions.forEach((position) => {
      if (position.side === 'Long') {
        longQty += position.quantity;
      } else {
        shortQty += position.quantity;
      }
    });

    const netQty = longQty - shortQty;
    
    if (netQty > 0) {
      return { side: 'Long', quantity: netQty };
    } else if (netQty < 0) {
      return { side: 'Short', quantity: Math.abs(netQty) };
    }
    return { side: 'Neutral', quantity: 0 };
  }

  reset(): void {
    this.positions.clear();
    this.positionCounter = 0;
  }

  private calculatePnl(position: UserPosition, currentPrice: number): number {
    // BitMEX XBTUSD 是反向永续合约
    // 盈亏计算公式：
    // 对于 Long 持仓：盈亏 (USD) = quantity * (1/entryPrice - 1/exitPrice) * exitPrice
    // 对于 Short 持仓：盈亏 (USD) = quantity * (1/exitPrice - 1/entryPrice) * exitPrice
    // 
    // 简化公式：
    // Long:  quantity * (currentPrice - entryPrice) / entryPrice
    // Short: quantity * (entryPrice - currentPrice) / entryPrice
    
    const direction = position.side === 'Long' ? 1 : -1;
    const priceChange = currentPrice - position.entryPrice;
    
    // 使用正确的反向合约盈亏计算公式
    // 对于反向合约，盈亏 = quantity * (价格变化率) * direction
    // 价格变化率 = (currentPrice - entryPrice) / entryPrice
    const priceChangeRate = priceChange / position.entryPrice;
    const pnl = position.quantity * priceChangeRate * direction;
    
    return pnl;
  }
}
