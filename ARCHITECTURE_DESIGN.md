# TradingPK - 架构设计文档

## 📐 架构概述

本文档定义了 TradingPK 项目的模块化架构，旨在支持多人并行开发，降低模块间耦合，提高开发效率。

---

## 🏗️ 整体架构

### 架构分层

```
┌─────────────────────────────────────────────────┐
│           Presentation Layer (UI)                │
│  Pages | Components | Hooks                     │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│           Business Logic Layer                   │
│  Services | Stores | Engines                    │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│           Data Layer                             │
│  Data Loaders | Storage | Types                 │
└─────────────────────────────────────────────────┘
```

### 技术栈

- **框架：** Next.js 16 (App Router)
- **UI 库：** React 19
- **状态管理：** Zustand
- **图表库：** Lightweight Charts (K线) + Recharts (统计)
- **样式：** Tailwind CSS
- **类型：** TypeScript
- **数据存储：** LocalStorage (浏览器本地)

---

## 📦 核心模块划分

### 模块依赖关系图

```
┌─────────────┐
│  Challenge  │ ──┐
│   Manager   │   │
└─────────────┘   │
                  │
┌─────────────┐   │    ┌─────────────┐
│   Trading   │ ──┼───→│  Time Sim    │
│   Engine    │   │    │   Engine     │
└─────────────┘   │    └─────────────┘
      │            │           │
      ↓            │           ↓
┌─────────────┐   │    ┌─────────────┐
│  PnL Calc   │   │    │  Data Loader │
└─────────────┘   │    └─────────────┘
      │            │           │
      ↓            │           ↓
┌─────────────┐   │    ┌─────────────┐
│ Comparison  │ ←─┘    │   Storage    │
│  Analyzer   │        │   Manager    │
└─────────────┘        └─────────────┘
      │
      ↓
┌─────────────┐
│    Chart    │
│   Module    │
└─────────────┘
```

---

## 🔧 模块详细设计

### 1. 数据加载模块 (Data Loader)

**职责：** 加载和预处理 paul wei 的交易数据和 K 线数据

**文件位置：** `lib/data-loader/`

**核心文件：**
- `paulWeiDataLoader.ts` - 加载 paul wei 交易数据
- `ohlcvDataLoader.ts` - 加载 K 线数据
- `challengeDataProcessor.ts` - 处理挑战时间段数据

**接口定义：**
```typescript
// lib/data-loader/types.ts
export interface DataLoader {
  loadPaulWeiTrades(startTime: string, endTime: string): Promise<PaulWeiTrade[]>;
  loadOHLCV(symbol: string, timeframe: '1m' | '5m' | '1h' | '1d', startTime: string, endTime: string): Promise<OHLCVData[]>;
  getChallengeData(challengeId: string): Promise<ChallengeData>;
}

export interface ChallengeData {
  id: string;
  startTime: string;
  endTime: string;
  symbol: 'XBTUSD' | 'ETHUSD';
  paulWeiTrades: PaulWeiTrade[];
  ohlcvData: OHLCVDataset;
}
```

**依赖：** 无（最底层模块）

**可并行开发：** ✅ 完全独立

---

### 2. 时间模拟引擎 (Time Simulation Engine)

**职责：** 管理模拟时间的推进、暂停、加速

**文件位置：** `lib/time-simulation/`

**核心文件：**
- `TimeSimulationEngine.ts` - 时间模拟核心引擎
- `TimeController.ts` - 时间控制接口
- `types.ts` - 类型定义

**接口定义：**
```typescript
// lib/time-simulation/types.ts
export interface TimeSimulationState {
  currentTime: string;
  speed: number; // 1x, 2x, 5x, 10x, 50x, 100x
  isPaused: boolean;
  startTime: string;
  endTime: string;
}

export interface TimeSimulationEngine {
  start(): void;
  pause(): void;
  resume(): void;
  setSpeed(speed: number): void;
  jumpToTime(time: string): void;
  getCurrentTime(): string;
  getState(): TimeSimulationState;
  onTimeUpdate(callback: (time: string) => void): void;
}
```

**依赖：** 无（独立模块）

**可并行开发：** ✅ 完全独立

---

### 3. 交易引擎 (Trading Engine)

**职责：** 处理用户交易、订单管理、持仓管理

**文件位置：** `lib/trading-engine/`

**核心文件：**
- `TradingEngine.ts` - 交易核心逻辑
- `OrderManager.ts` - 订单管理
- `PositionManager.ts` - 持仓管理
- `OrderMatcher.ts` - 订单匹配（限价单、止损单）

**接口定义：**
```typescript
// lib/trading-engine/types.ts
export interface TradingEngine {
  placeMarketOrder(side: 'Buy' | 'Sell', quantity: number, currentPrice: number): UserTrade;
  placeLimitOrder(side: 'Buy' | 'Sell', quantity: number, price: number): UserOrder;
  placeStopOrder(side: 'Buy' | 'Sell', quantity: number, triggerPrice: number): UserOrder;
  cancelOrder(orderId: string): void;
  closePosition(positionId: string, currentPrice: number): UserTrade;
  getPositions(): UserPosition[];
  getOrders(): UserOrder[];
  checkOrderTriggers(currentPrice: number): UserTrade[]; // 检查限价单/止损单
}

export interface UserAccount {
  balance: number;
  positions: UserPosition[];
  orders: UserOrder[];
  trades: UserTrade[];
}
```

**依赖：**
- 时间模拟引擎（获取当前时间）
- 数据加载模块（获取当前价格）

**可并行开发：** ⚠️ 需要时间模拟引擎接口定义后开发

---

### 4. 收益计算模块 (PnL Calculator)

**职责：** 计算用户和 paul wei 的收益率、盈亏

**文件位置：** `lib/pnl-calculator/`

**核心文件：**
- `UserPnLCalculator.ts` - 用户收益计算
- `PaulWeiPnLCalculator.ts` - paul wei 收益计算
- `FeeCalculator.ts` - 手续费计算

**接口定义：**
```typescript
// lib/pnl-calculator/types.ts
export interface PnLCalculator {
  calculateUserReturn(account: UserAccount, currentPrice: number): number;
  calculateUserEquity(account: UserAccount, currentPrice: number): number;
  calculateUnrealizedPnl(position: UserPosition, currentPrice: number): number;
  calculateRealizedPnl(trades: UserTrade[]): number;
}

export interface FeeCalculator {
  calculateFee(trade: UserTrade, orderType: 'Market' | 'Limit', historicalFeeRate: FeeRate): number;
  getHistoricalFeeRate(time: string): FeeRate;
}

export interface FeeRate {
  maker: number; // 0.025%
  taker: number; // 0.075%
}
```

**依赖：**
- 数据加载模块（获取历史手续费率）
- 交易引擎（获取用户账户数据）

**可并行开发：** ⚠️ 需要交易引擎接口定义后开发

---

### 5. 对比分析模块 (Comparison Analyzer)

**职责：** 对比用户和 paul wei 的交易表现

**文件位置：** `lib/comparison/`

**核心文件：**
- `ComparisonAnalyzer.ts` - 对比分析核心
- `MetricsCalculator.ts` - 指标计算
- `types.ts` - 类型定义

**接口定义：**
```typescript
// lib/comparison/types.ts
export interface ComparisonMetrics {
  userReturn: number;
  paulWeiReturn: number;
  returnDiff: number;
  userTradeCount: number;
  paulWeiTradeCount: number;
  userAvgHoldTime: number; // 小时
  paulWeiAvgHoldTime: number;
  userMaxDrawdown: number;
  paulWeiMaxDrawdown: number;
  userCapitalUtilization: number; // 资金使用率
  paulWeiCapitalUtilization: number;
}

export interface ComparisonAnalyzer {
  calculateMetrics(
    userAccount: UserAccount,
    paulWeiTrades: PaulWeiTrade[],
    currentPrice: number,
    startTime: string,
    endTime: string
  ): ComparisonMetrics;
  generateInsights(metrics: ComparisonMetrics): string[];
}
```

**依赖：**
- 收益计算模块
- 交易引擎
- 数据加载模块

**可并行开发：** ⚠️ 需要依赖模块接口定义后开发

---

### 6. K线图表模块 (Chart Module)

**职责：** 显示 K 线图、标记交易点、支持多时间周期

**文件位置：** `components/chart/`

**核心文件：**
- `KLineChart.tsx` - K 线图主组件
- `ChartMarkers.tsx` - 交易标记组件
- `TimeframeSelector.tsx` - 时间周期选择器
- `hooks/useChartData.ts` - 图表数据 Hook

**接口定义：**
```typescript
// components/chart/types.ts
export interface ChartProps {
  data: OHLCVData[];
  timeframe: '1m' | '5m' | '1h' | '1d';
  paulWeiTrades: PaulWeiTrade[];
  userTrades: UserTrade[];
  currentTime: string;
  onTimeframeChange: (timeframe: '1m' | '5m' | '1h' | '1d') => void;
}

export interface ChartMarker {
  time: string;
  price: number;
  type: 'paulWeiBuy' | 'paulWeiSell' | 'userBuy' | 'userSell';
  label?: string;
}
```

**依赖：**
- 数据加载模块（获取 K 线数据）
- 时间模拟引擎（获取当前时间）

**可并行开发：** ⚠️ 需要接口定义后开发，但可以先做 UI 框架

---

### 7. 挑战管理模块 (Challenge Manager)

**职责：** 管理挑战的创建、进行、结算

**文件位置：** `lib/challenge-manager/`

**核心文件：**
- `ChallengeManager.ts` - 挑战管理核心
- `ChallengeStore.ts` - 挑战状态管理（Zustand）
- `ChallengeValidator.ts` - 挑战验证

**接口定义：**
```typescript
// lib/challenge-manager/types.ts
export interface Challenge {
  id: string;
  startTime: string;
  endTime: string;
  symbol: 'XBTUSD' | 'ETHUSD';
  status: 'pending' | 'active' | 'completed';
  userAccount: UserAccount;
  paulWeiTrades: PaulWeiTrade[];
  createdAt: string;
}

export interface ChallengeManager {
  createChallenge(challengeData: ChallengeData): Challenge;
  startChallenge(challengeId: string): void;
  endChallenge(challengeId: string): ChallengeResult;
  getChallenge(challengeId: string): Challenge | null;
  updateChallenge(challenge: Challenge): void;
}
```

**依赖：**
- 数据加载模块
- 交易引擎
- 收益计算模块
- 对比分析模块

**可并行开发：** ⚠️ 需要多个模块接口定义后开发

---

### 8. 存储管理模块 (Storage Manager)

**职责：** 管理 LocalStorage 的读写

**文件位置：** `lib/storage/`

**核心文件：**
- `StorageManager.ts` - 存储管理核心
- `ChallengeStorage.ts` - 挑战数据存储
- `UserDataStorage.ts` - 用户数据存储

**接口定义：**
```typescript
// lib/storage/types.ts
export interface StorageManager {
  saveChallenge(challenge: Challenge): void;
  loadChallenge(challengeId: string): Challenge | null;
  saveChallengeResult(result: ChallengeResult): void;
  loadChallengeHistory(): ChallengeResult[];
  clearStorage(): void;
}

export interface StorageKeys {
  CHALLENGES: string;
  CHALLENGE_RESULTS: string;
  USER_SETTINGS: string;
}
```

**依赖：** 无（独立模块）

**可并行开发：** ✅ 完全独立

---

### 9. 分享模块 (Share Module)

**职责：** 生成分享图片、分享链接

**文件位置：** `lib/share/` 和 `components/share/`

**核心文件：**
- `ShareImageGenerator.ts` - 分享图片生成
- `ShareCard.tsx` - 分享卡片组件
- `ShareUtils.ts` - 分享工具函数

**接口定义：**
```typescript
// lib/share/types.ts
export interface ShareImageGenerator {
  generateShareImage(result: ChallengeResult): Promise<Blob>;
  generateShareCard(result: ChallengeResult): string; // HTML string
}

export interface ShareCardProps {
  result: ChallengeResult;
  onDownload?: () => void;
  onShare?: () => void;
}
```

**依赖：**
- 对比分析模块（获取对比数据）

**可并行开发：** ⚠️ 需要对比分析模块接口定义后开发

---

## 📁 项目目录结构

```
tradingpk/
├── app/                          # Next.js App Router
│   ├── page.tsx                  # 首页（挑战选择）
│   ├── challenge/[id]/
│   │   └── page.tsx              # 交易页面
│   ├── results/[id]/
│   │   └── page.tsx              # 结算页面
│   ├── history/
│   │   └── page.tsx              # 历史记录
│   └── api/                      # API 路由（数据加载）
│       ├── ohlcv/route.ts
│       └── trades/route.ts
│
├── components/                   # React 组件
│   ├── challenge/                 # 挑战相关组件
│   │   ├── ChallengeSelector.tsx
│   │   ├── ChallengeCard.tsx
│   │   └── ChallengeTimeline.tsx
│   ├── trading/                  # 交易相关组件
│   │   ├── TradingPanel.tsx
│   │   ├── OrderForm.tsx
│   │   ├── PositionList.tsx
│   │   └── OrderHistory.tsx
│   ├── chart/                    # 图表组件
│   │   ├── KLineChart.tsx
│   │   ├── ChartMarkers.tsx
│   │   └── TimeframeSelector.tsx
│   ├── comparison/               # 对比组件
│   │   ├── ComparisonPanel.tsx
│   │   ├── MetricsTable.tsx
│   │   └── ReturnCurve.tsx
│   ├── share/                    # 分享组件
│   │   └── ShareCard.tsx
│   └── common/                  # 通用组件
│       ├── Button.tsx
│       └── Card.tsx
│
├── lib/                          # 核心业务逻辑
│   ├── data-loader/              # 模块 1: 数据加载
│   │   ├── paulWeiDataLoader.ts
│   │   ├── ohlcvDataLoader.ts
│   │   ├── challengeDataProcessor.ts
│   │   └── types.ts
│   ├── time-simulation/          # 模块 2: 时间模拟
│   │   ├── TimeSimulationEngine.ts
│   │   ├── TimeController.ts
│   │   └── types.ts
│   ├── trading-engine/           # 模块 3: 交易引擎
│   │   ├── TradingEngine.ts
│   │   ├── OrderManager.ts
│   │   ├── PositionManager.ts
│   │   ├── OrderMatcher.ts
│   │   └── types.ts
│   ├── pnl-calculator/           # 模块 4: 收益计算
│   │   ├── UserPnLCalculator.ts
│   │   ├── PaulWeiPnLCalculator.ts
│   │   ├── FeeCalculator.ts
│   │   └── types.ts
│   ├── comparison/               # 模块 5: 对比分析
│   │   ├── ComparisonAnalyzer.ts
│   │   ├── MetricsCalculator.ts
│   │   └── types.ts
│   ├── challenge-manager/        # 模块 7: 挑战管理
│   │   ├── ChallengeManager.ts
│   │   ├── ChallengeStore.ts
│   │   ├── ChallengeValidator.ts
│   │   └── types.ts
│   ├── storage/                  # 模块 8: 存储管理
│   │   ├── StorageManager.ts
│   │   ├── ChallengeStorage.ts
│   │   ├── UserDataStorage.ts
│   │   └── types.ts
│   └── share/                    # 模块 9: 分享
│       ├── ShareImageGenerator.ts
│       ├── ShareUtils.ts
│       └── types.ts
│
├── hooks/                        # React Hooks
│   ├── useTimeSimulation.ts
│   ├── useTrading.ts
│   ├── useChallenge.ts
│   └── useComparison.ts
│
├── stores/                       # Zustand Stores
│   ├── challengeStore.ts
│   ├── tradingStore.ts
│   └── timeSimulationStore.ts
│
├── types/                        # 全局类型定义
│   ├── challenge.ts
│   ├── trading.ts
│   ├── paulWei.ts
│   └── common.ts
│
├── data/                         # 数据文件
│   └── ohlcv/                    # K 线数据
│
├── bitmex_paulwei/              # paul wei 交易数据
│   ├── bitmex_executions.csv
│   ├── bitmex_trades.csv
│   └── ...
│
└── public/                       # 静态资源
```

---

## 🔄 数据流设计

### 挑战开始流程

```
1. 用户选择时间段
   ↓
2. ChallengeManager.createChallenge()
   ↓
3. DataLoader.loadChallengeData()
   ↓
4. ChallengeManager.startChallenge()
   ↓
5. TimeSimulationEngine.start()
   ↓
6. TradingEngine.initialize()
   ↓
7. 进入交易页面
```

### 交易执行流程

```
1. 用户下单
   ↓
2. TradingEngine.placeOrder()
   ↓
3. 如果是市价单 → 立即成交
   如果是限价单 → 加入订单列表
   ↓
4. TimeSimulationEngine 推进时间
   ↓
5. TradingEngine.checkOrderTriggers() (检查限价单/止损单)
   ↓
6. PnLCalculator 计算收益
   ↓
7. ComparisonAnalyzer 更新对比数据
   ↓
8. UI 更新
```

### 挑战结算流程

```
1. TimeSimulationEngine 到达结束时间
   ↓
2. ChallengeManager.endChallenge()
   ↓
3. PnLCalculator 计算最终收益
   ↓
4. ComparisonAnalyzer 生成对比报告
   ↓
5. StorageManager 保存结果
   ↓
6. 跳转到结算页面
```

---

## 👥 开发分工建议

### 阶段 1: 基础模块开发（可并行）

**开发者 A: 数据加载模块**
- 任务：实现数据加载和预处理
- 文件：`lib/data-loader/`
- 依赖：无
- 预计时间：2-3 天

**开发者 B: 时间模拟引擎**
- 任务：实现时间推进、暂停、加速
- 文件：`lib/time-simulation/`
- 依赖：无
- 预计时间：2-3 天

**开发者 C: 存储管理模块**
- 任务：实现 LocalStorage 读写
- 文件：`lib/storage/`
- 依赖：无
- 预计时间：1-2 天

### 阶段 2: 核心业务模块（需要阶段 1 完成）

**开发者 D: 交易引擎**
- 任务：实现交易、订单、持仓管理
- 文件：`lib/trading-engine/`
- 依赖：时间模拟引擎、数据加载模块
- 预计时间：3-4 天

**开发者 E: 收益计算模块**
- 任务：实现收益和手续费计算
- 文件：`lib/pnl-calculator/`
- 依赖：数据加载模块、交易引擎
- 预计时间：2-3 天

### 阶段 3: 分析和 UI 模块

**开发者 F: 对比分析模块**
- 任务：实现对比分析和指标计算
- 文件：`lib/comparison/`
- 依赖：收益计算模块、交易引擎
- 预计时间：2-3 天

**开发者 G: K线图表模块**
- 任务：实现 K 线图和多时间周期
- 文件：`components/chart/`
- 依赖：数据加载模块、时间模拟引擎
- 预计时间：3-4 天

**开发者 H: 挑战管理模块**
- 任务：实现挑战的创建和管理
- 文件：`lib/challenge-manager/`
- 依赖：所有业务模块
- 预计时间：2-3 天

### 阶段 4: 页面集成

**开发者 I: 页面开发**
- 任务：实现各个页面和组件集成
- 文件：`app/`, `components/`
- 依赖：所有模块
- 预计时间：4-5 天

**开发者 J: 分享模块**
- 任务：实现分享功能
- 文件：`lib/share/`, `components/share/`
- 依赖：对比分析模块
- 预计时间：2-3 天

---

## 🔌 模块接口规范

### 接口设计原则

1. **单一职责：** 每个模块只负责一个明确的功能
2. **接口优先：** 先定义接口，再实现具体逻辑
3. **依赖注入：** 通过接口注入依赖，而非直接导入
4. **类型安全：** 所有接口都有完整的 TypeScript 类型定义

### 接口定义模板

```typescript
// lib/[module-name]/types.ts

// 1. 定义接口
export interface IModuleName {
  method1(param: Type): ReturnType;
  method2(param: Type): ReturnType;
}

// 2. 定义实现类
export class ModuleName implements IModuleName {
  constructor(dependencies: Dependencies) {
    // 依赖注入
  }
  
  method1(param: Type): ReturnType {
    // 实现
  }
}

// 3. 导出工厂函数
export function createModuleName(dependencies: Dependencies): IModuleName {
  return new ModuleName(dependencies);
}
```

---

## 🧪 测试策略

### 单元测试

每个模块都应该有对应的单元测试：

```
lib/
├── data-loader/
│   ├── __tests__/
│   │   └── paulWeiDataLoader.test.ts
│   └── paulWeiDataLoader.ts
```

### 集成测试

测试模块间的协作：

```
__tests__/
├── integration/
│   ├── trading-flow.test.ts
│   └── challenge-flow.test.ts
```

---

## 📋 开发检查清单

### 模块开发前

- [ ] 确认模块接口定义
- [ ] 确认依赖模块的接口
- [ ] 创建模块目录结构
- [ ] 编写类型定义文件

### 模块开发中

- [ ] 实现核心功能
- [ ] 编写单元测试
- [ ] 编写使用文档
- [ ] 确保类型安全

### 模块开发后

- [ ] 代码审查
- [ ] 集成测试
- [ ] 更新架构文档

---

## 🚀 开发顺序建议

### 第一周：基础模块
1. 数据加载模块
2. 时间模拟引擎
3. 存储管理模块

### 第二周：核心业务
4. 交易引擎
5. 收益计算模块

### 第三周：分析和 UI
6. 对比分析模块
7. K线图表模块
8. 挑战管理模块

### 第四周：集成和优化
9. 页面开发
10. 分享模块
11. 测试和优化

---

## 📝 总结

本架构设计采用模块化、接口化的方式，确保：

1. **低耦合：** 模块间通过接口通信，减少直接依赖
2. **高内聚：** 每个模块职责明确，功能集中
3. **可并行：** 不同模块可以同时开发
4. **易测试：** 每个模块都可以独立测试
5. **易维护：** 清晰的模块边界，便于后续维护

遵循本架构设计，团队可以高效并行开发，快速交付产品。
