# TradingPK - PK 顶级交易员

一个让用户与顶级交易员 paul wei 进行模拟交易 PK 的平台。

## 📦 数据托管与环境变量（必读）

- K 线与行情 CSV 托管在 Hugging Face Dataset：`(https://huggingface.co/datasets/geeksaywhat/paulweitrading/tree/main)`（git-xet/LFS 存大文件）。
- 前端数据源通过环境变量配置：
  - `NEXT_PUBLIC_OHLCV_BASE`（部署必填）：
    - 若 CSV 在数据集根目录：`https://huggingface.co/datasets/geeksaywhat/paulweitrading/resolve/main`
    - 若在子目录 `ohlcv/`：`https://huggingface.co/datasets/geeksaywhat/paulweitrading/resolve/main/ohlcv`
  - 本地开发不配置则默认读 `public/ohlcv/`。
- Paul Wei 交易/钱包等 CSV 仍保留在仓库 `public/bitmex_paulwei/`，无需额外变量。
- 如需把 Paul Wei 数据也改为外部源，可新增类似 `NEXT_PUBLIC_PAULWEI_BASE`（当前未启用）。

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

### 环境变量示例

```
# HF 根目录方案（当前推荐）
NEXT_PUBLIC_OHLCV_BASE=https://huggingface.co/datasets/geeksaywhat/paulweitrading/resolve/main

# 若 CSV 放在 ohlcv/ 子目录，则改为
# NEXT_PUBLIC_OHLCV_BASE=https://huggingface.co/datasets/geeksaywhat/paulweitrading/resolve/main/ohlcv
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

