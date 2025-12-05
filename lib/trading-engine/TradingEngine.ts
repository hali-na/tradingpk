// 交易引擎核心实现

import { Side } from '@/types/common';
import { UserTrade, UserAccount } from '@/types/trading';
import {
  TradingEngine,
  TradingEngineConfig,
  OrderExecutionResult,
} from './types';
import { OrderManagerImpl } from './OrderManager';
import { PositionManagerImpl } from './PositionManager';
import { OrderMatcherImpl } from './OrderMatcher';

export class TradingEngineImpl implements TradingEngine {
  private config: TradingEngineConfig;
  private balance: number;
  private trades: UserTrade[] = [];
  private orderManager: OrderManagerImpl;
  private positionManager: PositionManagerImpl;
  private orderMatcher: OrderMatcherImpl;
  private tradeCounter: number = 0;

  constructor(config: TradingEngineConfig) {
    this.config = config;
    this.balance = config.initialBalance;
    this.orderManager = new OrderManagerImpl();
    this.positionManager = new PositionManagerImpl();
    this.orderMatcher = new OrderMatcherImpl();
  }

  placeMarketOrder(
    side: Side,
    quantity: number,
    currentPrice: number,
    timestamp?: string
  ): OrderExecutionResult {
    // 检查余额
    const requiredMargin = this.calculateRequiredMargin(quantity, currentPrice);
    if (requiredMargin > this.balance) {
      return { success: false, error: '余额不足' };
    }

    // 执行市价单
    const { executedPrice } = this.orderMatcher.matchMarketOrder(
      side,
      quantity,
      currentPrice,
      this.config.slippage
    );

    // 计算手续费 (Taker)
    const fee = this.calculateFee(quantity, executedPrice, 'Market');

    // 创建交易记录（使用模拟时间，如果提供的话）
    const tradeTime = timestamp ?? new Date().toISOString();
    
    // 更新持仓 - 使用实际执行价格作为 entryPrice
    const positionId = this.updatePositionOnTrade(side, quantity, executedPrice, tradeTime);
    
    const trade = this.createTrade(
      side,
      quantity,
      executedPrice,
      'Market',
      fee,
      tradeTime,
      {
        isOpen: true,
        positionId: positionId,
      }
    );
    
    // 调试日志：确认 entryPrice 正确设置
    if (process.env.NODE_ENV === 'development') {
      const positions = this.positionManager.getPositions();
      const latestPosition = positions[positions.length - 1];
      if (latestPosition) {
        console.log(`[TradingEngine] 开仓: side=${side}, quantity=${quantity}, entryPrice=${executedPrice}, positionId=${latestPosition.id}`);
      }
    }

    // 扣除手续费
    this.balance -= fee;

    return { success: true, trade };
  }

  placeLimitOrder(
    side: Side,
    quantity: number,
    price: number,
    timestamp?: string
  ): OrderExecutionResult {
    const orderTime = timestamp ?? new Date().toISOString();
    const order = this.orderManager.createOrder(
      { side, quantity, price, orderType: 'Limit' },
      this.config.challengeId,
      orderTime
    );

    return { success: true, order };
  }

  placeStopOrder(
    side: Side,
    quantity: number,
    triggerPrice: number,
    timestamp?: string
  ): OrderExecutionResult {
    const orderTime = timestamp ?? new Date().toISOString();
    const order = this.orderManager.createOrder(
      { side, quantity, price: triggerPrice, orderType: 'Stop' },
      this.config.challengeId,
      orderTime
    );

    return { success: true, order };
  }

  cancelOrder(orderId: string): boolean {
    return this.orderManager.cancelOrder(orderId);
  }

  closePosition(
    positionId: string,
    currentPrice: number,
    timestamp?: string
  ): OrderExecutionResult {
    const position = this.positionManager.getPositionById(positionId);
    if (!position) {
      return { success: false, error: '持仓不存在' };
    }

    // 平仓方向与持仓方向相反
    const closeSide: Side = position.side === 'Long' ? 'Sell' : 'Buy';

    // 执行平仓
    const { executedPrice } = this.orderMatcher.matchMarketOrder(
      closeSide,
      position.quantity,
      currentPrice,
      this.config.slippage
    );

    // 计算手续费
    const fee = this.calculateFee(position.quantity, executedPrice, 'Market');

    // 关闭持仓并获取盈亏
    const result = this.positionManager.closePosition(positionId, executedPrice);
    if (!result) {
      return { success: false, error: '平仓失败' };
    }

    // 计算盈亏（手续费前）
    const pnlBeforeFee = result.pnl;
    // 扣除手续费后的实际盈亏
    const pnl = pnlBeforeFee - fee;

    // 更新余额
    this.balance += pnl;

    // 创建交易记录（使用模拟时间，如果提供的话）
    const tradeTime = timestamp ?? new Date().toISOString();
    const trade = this.createTrade(
      closeSide,
      position.quantity,
      executedPrice,
      'Market',
      fee,
      tradeTime,
      {
        isOpen: false,
        positionId: position.id,
        entryPrice: position.entryPrice,
        exitPrice: executedPrice,
        pnl: pnl,
        pnlBeforeFee: pnlBeforeFee,
      }
    );

    return { success: true, trade };
  }

  closeAllPositions(currentPrice: number, timestamp?: string): OrderExecutionResult[] {
    const positions = this.positionManager.getPositions();
    return positions.map((pos) => this.closePosition(pos.id, currentPrice, timestamp));
  }

  getAccount(): UserAccount {
    return {
      balance: this.balance,
      initialBalance: this.config.initialBalance,
      positions: this.positionManager.getPositions(),
      orders: this.orderManager.getAllOrders(),
      trades: this.trades,
    };
  }

  getPositions() {
    return this.positionManager.getPositions();
  }

  getOrders() {
    return this.orderManager.getAllOrders();
  }

  getTrades() {
    return this.trades;
  }

  getBalance() {
    return this.balance;
  }

  getEquity(currentPrice: number): number {
    this.positionManager.updateUnrealizedPnl(currentPrice);
    const positions = this.positionManager.getPositions();
    const unrealizedPnl = positions.reduce(
      (sum, pos) => sum + pos.unrealizedPnl,
      0
    );
    return this.balance + unrealizedPnl;
  }

  checkOrderTriggers(currentPrice: number, currentTime: string): UserTrade[] {
    const pendingOrders = this.orderManager.getPendingOrders();
    const triggeredOrders = this.orderMatcher.getTriggeredOrders(
      pendingOrders,
      currentPrice
    );

    const executedTrades: UserTrade[] = [];

    for (const order of triggeredOrders) {
      // 确定执行价格：
      // - 限价单：使用 order.price（限价）
      // - 止损单：使用 currentPrice（触发后按市价执行，考虑滑点）
      let executedPrice: number;
      let feeType: 'Market' | 'Limit' | 'Stop';
      
      if (order.type === 'Limit') {
        // 限价单按限价执行
        executedPrice = order.price;
        feeType = 'Limit';
      } else {
        // 止损单触发后按市价执行（考虑滑点）
        const { executedPrice: stopExecutedPrice } = this.orderMatcher.matchMarketOrder(
          order.side,
          order.quantity,
          currentPrice,
          this.config.slippage
        );
        executedPrice = stopExecutedPrice;
        feeType = 'Market';
      }

      // 计算手续费
      const fee = this.calculateFee(order.quantity, executedPrice, feeType);

      // 更新持仓 - 使用实际执行价格作为 entryPrice
      const positionId = this.updatePositionOnTrade(order.side, order.quantity, executedPrice, currentTime);

      // 创建交易记录
      const trade = this.createTrade(
        order.side,
        order.quantity,
        executedPrice,
        order.type,
        fee,
        currentTime,
        {
          isOpen: true,
          positionId: positionId,
        }
      );
      
      // 调试日志：确认 entryPrice 正确设置
      if (process.env.NODE_ENV === 'development') {
        const positions = this.positionManager.getPositions();
        const latestPosition = positions[positions.length - 1];
        if (latestPosition) {
          console.log(`[TradingEngine] 订单触发开仓: orderType=${order.type}, side=${order.side}, quantity=${order.quantity}, entryPrice=${executedPrice}, positionId=${latestPosition.id}`);
        }
      }

      // 更新订单状态
      this.orderManager.updateOrderStatus(order.id, 'Filled');

      // 扣除手续费
      this.balance -= fee;

      executedTrades.push(trade);
    }

    return executedTrades;
  }

  updateUnrealizedPnl(currentPrice: number): void {
    this.positionManager.updateUnrealizedPnl(currentPrice);
  }

  reset(): void {
    this.balance = this.config.initialBalance;
    this.trades = [];
    this.tradeCounter = 0;
    this.orderManager.reset();
    this.positionManager.reset();
  }

  private createTrade(
    side: Side,
    quantity: number,
    price: number,
    orderType: 'Market' | 'Limit' | 'Stop',
    fee: number,
    timestamp: string,
    extras?: {
      isOpen: boolean;
      positionId?: string;
      entryPrice?: number;
      exitPrice?: number;
      pnl?: number;
      pnlBeforeFee?: number;
    }
  ): UserTrade {
    const trade: UserTrade = {
      id: `trade_${++this.tradeCounter}_${Date.now()}`,
      challengeId: this.config.challengeId,
      timestamp,
      side,
      price,
      quantity,
      orderType,
      fee,
      isOpen: extras?.isOpen ?? true,
      positionId: extras?.positionId,
      entryPrice: extras?.entryPrice,
      exitPrice: extras?.exitPrice,
      pnl: extras?.pnl,
      pnlBeforeFee: extras?.pnlBeforeFee,
    };

    this.trades.push(trade);
    return trade;
  }

  private calculateFee(
    quantity: number,
    price: number,
    orderType: 'Market' | 'Limit' | 'Stop'
  ): number {
    // 手续费计算（简化版）
    // 对于 BitMEX XBTUSD 这类反向合约，1 USD = 1 合约
    // 实际手续费 ≈ 成交名义价值 * 手续费率
    // 但名义价值 = quantity (USD)，不需要再乘以 price，否则会放大到 USD^2 量级
    //
    // 这里为了保持直o i定：
    // - 直接按 quantity * feeRate 计算（以 USD 为单位）
    // - 忽略价格对手续费的二次放大
    const feeRate =
      orderType === 'Limit'
        ? this.config.makerFeeRate
        : this.config.takerFeeRate;

    const fee = quantity * feeRate;
    return fee;
  }

  private calculateRequiredMargin(quantity: number, price: number): number {
    // BitMEX XBTUSD 是反向永续合约，1 USD = 1 合约
    // 用户输入的 quantity 已经是 USD 数量（合约数量）
    // 保证金 = quantity / leverage
    // 假设 10x 杠杆，保证金 = quantity / 10
    const leverage = 10;
    return quantity / leverage;
  }

  private updatePositionOnTrade(
    side: Side,
    quantity: number,
    price: number,
    timestamp: string
  ): string {
    // 修改：总是创建新的独立持仓，允许同时持有多笔订单
    // 不自动合并或平仓，让用户手动管理持仓
    const position = this.positionManager.openPosition(side, quantity, price, timestamp);
    return position.id;
  }
}
