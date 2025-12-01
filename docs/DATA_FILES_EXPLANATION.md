# BitMEX 数据文件说明

## 文件类型和用途

### 1. **bitmex_trades.csv** - 已完成的交易记录 ✅ **当前使用**

**用途：** 记录所有**已完成的交易**（已实现的订单）

**字段：**
- `id`: 交易ID
- `datetime`: 交易时间
- `symbol`: 交易对（BTC/USD:BTC）
- `side`: 方向（buy/sell）
- `price`: 成交价格
- `amount`: 交易数量
- `cost`: 交易成本
- `fee_cost`: 手续费
- `execID`: 执行ID（关联executions）

**特点：**
- ✅ 每个交易都是**已完成的**
- ✅ 包含实际成交价格和数量
- ✅ 包含手续费信息
- ✅ **最适合计算PnL和收益率**

**为什么使用这个文件：**
- 这是实际执行的交易记录
- 每个交易都有完整的价格、数量、手续费信息
- 可以直接用于计算已实现盈亏

---

### 2. **bitmex_executions.csv** - 订单执行记录

**用途：** 记录订单的**每次执行**（一个订单可能被多次执行）

**字段：**
- `execID`: 执行ID
- `orderID`: 订单ID（关联orders）
- `symbol`: 交易对
- `side`: 方向
- `lastQty`: 本次执行数量
- `lastPx`: 本次执行价格
- `execType`: 执行类型（Trade, Funding等）
- `ordType`: 订单类型（Limit, Market等）
- `ordStatus`: 订单状态（PartiallyFilled, Filled等）
- `execCost`: 执行成本
- `execComm`: 执行手续费

**特点：**
- 一个订单可能被多次执行（部分成交）
- 更详细的执行信息
- 包含订单状态信息

**使用场景：**
- 分析订单执行细节
- 查看部分成交情况
- 与trades.csv中的execID对应

---

### 3. **bitmex_orders.csv** - 订单记录（包括未完成的）

**用途：** 记录所有**订单**（包括未完成的订单）

**字段：**
- `orderID`: 订单ID
- `symbol`: 交易对
- `side`: 方向
- `ordType`: 订单类型（Limit, Market, Stop等）
- `orderQty`: 订单数量
- `price`: 订单价格（限价单）
- `stopPx`: 止损价格（止损单）
- `avgPx`: 平均成交价格
- `cumQty`: 累计成交数量
- `ordStatus`: 订单状态（Pending, Filled, Canceled等）

**特点：**
- ⚠️ 包括**未完成的订单**（Pending, Canceled）
- 包括订单层面的信息
- 一个订单可能对应多个executions

**使用场景：**
- 分析订单策略
- 查看未成交的订单
- 分析订单执行效率

---

### 4. **bitmex_wallet_history.csv** - 钱包历史（资金变动）

**用途：** 记录账户的**资金变动**

**字段：**
- `transactID`: 交易ID
- `account`: 账户ID
- `currency`: 货币（XBt = XBT）
- `transactType`: 交易类型
  - `RealisedPNL`: 已实现盈亏
  - `UnrealisedPNL`: 未实现盈亏
  - `Funding`: 资金费率
  - `Deposit`: 存款
  - `Withdrawal`: 提款
- `amount`: 金额
- `fee`: 手续费
- `walletBalance`: 钱包余额
- `marginBalance`: 保证金余额

**特点：**
- 账户层面的资金变动
- 包含已实现和未实现盈亏
- 包含资金费率、存取款等

**使用场景：**
- 验证PnL计算的准确性
- 查看资金费率影响
- 查看账户余额变化

---

## 数据关系

```
orders.csv (订单)
    ↓ (一个订单可能多次执行)
executions.csv (执行记录)
    ↓ (每次执行对应一个交易)
trades.csv (交易记录) ✅ 用于计算PnL
    ↓ (交易产生的盈亏)
wallet_history.csv (资金变动)
```

## 当前实现

**我们使用 `bitmex_trades.csv` 来计算Paul Wei的收益：**

✅ **正确的原因：**
1. `trades.csv` 是已完成的交易记录
2. 每个交易都有价格、数量、手续费
3. 可以直接计算已实现盈亏
4. 不包含未完成的订单，数据更准确

⚠️ **注意事项：**
- `trades.csv` 中的 `fee_cost` 是手续费（以BTC计价）
- 需要转换为USD进行计算
- 需要正确处理买卖方向的盈亏计算

---

## 可能的改进

如果需要更精确的计算，可以考虑：

1. **使用 `wallet_history.csv` 验证：**
   - 使用 `RealisedPNL` 字段验证计算结果
   - 确保计算的准确性

2. **使用 `executions.csv` 获取更详细信息：**
   - 查看订单执行细节
   - 分析部分成交情况

3. **使用 `orders.csv` 分析策略：**
   - 查看未成交的订单
   - 分析订单执行效率

但目前使用 `trades.csv` 已经足够准确和完整。

