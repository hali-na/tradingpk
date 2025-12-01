// 对比分析类型定义

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

