# TradingPK - PK 顶级交易员

一个让用户与顶级交易员 paul wei 进行模拟交易 PK 的平台。

## 📋 项目状态

### ✅ 已完成

1. **项目初始化**
   - Next.js 16 项目结构
   - TypeScript 配置
   - Tailwind CSS 配置
   - 基础目录结构

2. **阶段1 - 基础模块（已完成）**
   - ✅ 数据加载模块 (`lib/data-loader/`)
     - paul wei 交易数据加载器
     - K线数据加载器
     - 挑战数据处理器
   - ✅ 时间模拟引擎 (`lib/time-simulation/`)
     - 时间推进、暂停、加速功能
     - 时间跳转功能
   - ✅ 存储管理模块 (`lib/storage/`)
     - LocalStorage 读写
     - 挑战数据存储
     - 挑战结果存储

3. **类型定义**
   - ✅ 全局类型定义 (`types/`)
     - 通用类型
     - 交易类型
     - paul wei 数据类型
     - 挑战类型
     - K线数据类型
     - 对比分析类型

4. **基础页面**
   - ✅ 首页布局
   - ✅ 基础样式

### 🚧 进行中

- 基础组件和页面结构

### 📝 待开发

**阶段2 - 核心业务模块**
- 交易引擎 (`lib/trading-engine/`)
- 收益计算模块 (`lib/pnl-calculator/`)

**阶段3 - 分析和 UI 模块**
- 对比分析模块 (`lib/comparison/`)
- K线图表模块 (`components/chart/`)
- 挑战管理模块 (`lib/challenge-manager/`)

**阶段4 - 集成和优化**
- 页面开发 (`app/`)
- 分享模块 (`lib/share/`)

## 🚀 快速开始

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

### 构建生产版本

```bash
npm run build
```

### 启动生产服务器

```bash
npm start
```

## 📁 项目结构

```
tradingpk/
├── app/                    # Next.js App Router
├── components/             # React 组件
├── lib/                    # 核心业务逻辑
│   ├── data-loader/       # ✅ 数据加载模块
│   ├── time-simulation/   # ✅ 时间模拟引擎
│   ├── storage/           # ✅ 存储管理模块
│   ├── trading-engine/    # ⏳ 交易引擎
│   ├── pnl-calculator/    # ⏳ 收益计算模块
│   ├── comparison/        # ⏳ 对比分析模块
│   ├── challenge-manager/ # ⏳ 挑战管理模块
│   └── share/             # ⏳ 分享模块
├── types/                  # ✅ 类型定义
├── hooks/                  # React Hooks
├── stores/                 # Zustand Stores
└── public/                 # 静态资源
    ├── bitmex_paulwei/    # paul wei 交易数据
    └── ohlcv/             # K线数据
```

## 📚 文档

- [产品设计方案](./PRODUCT_DESIGN.md)
- [架构设计文档](./ARCHITECTURE_DESIGN.md)

## 🛠️ 技术栈

- **框架：** Next.js 16 (App Router)
- **UI 库：** React 19
- **状态管理：** Zustand
- **图表库：** Lightweight Charts (K线) + Recharts (统计)
- **样式：** Tailwind CSS
- **类型：** TypeScript
- **数据存储：** LocalStorage

## 📝 开发规范

1. **模块化开发：** 每个模块都有独立的接口定义
2. **类型安全：** 所有代码都有完整的 TypeScript 类型
3. **接口优先：** 先定义接口，再实现具体逻辑
4. **依赖注入：** 通过接口注入依赖，降低耦合

## 🤝 贡献

按照架构设计文档进行模块化开发，确保模块间低耦合、高内聚。

