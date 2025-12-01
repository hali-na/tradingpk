import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'TradingPK - PK 顶级交易员',
  description: '与顶级交易员 paul wei 进行模拟交易 PK',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}

