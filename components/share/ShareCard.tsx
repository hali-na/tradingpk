'use client';

import { useRef } from 'react';
import { ChallengeResult } from '@/lib/challenge-manager/types';
import { Button } from '../common/Button';

interface ShareCardProps {
  result: ChallengeResult;
  onDownload?: () => void;
}

export function ShareCard({ result, onDownload }: ShareCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  const isWinner = result.winner === 'user';
  const isTie = result.winner === 'tie';

  const getResultEmoji = () => {
    if (isTie) return '🤝';
    if (isWinner) return '🏆';
    return '😔';
  };

  const getResultText = () => {
    if (isTie) return '平局';
    if (isWinner) return '胜利';
    return '惜败';
  };

  const handleDownload = async () => {
    // 实际实现需要使用 html2canvas 或类似库
    if (onDownload) {
      onDownload();
    }
    alert('下载功能需要安装 html2canvas 库');
  };

  const handleShare = () => {
    const text = isWinner
      ? `我在 TradingPK 上击败了顶级交易员 paul wei！收益率 ${result.userReturn.toFixed(2)}% vs ${result.paulWeiReturn.toFixed(2)}%`
      : `挑战 paul wei ${getResultText()}！收益率 ${result.userReturn.toFixed(2)}% vs ${result.paulWeiReturn.toFixed(2)}%`;

    if (navigator.share) {
      navigator.share({
        title: 'TradingPK - PK 顶级交易员',
        text,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(text + ' ' + window.location.href);
      alert('已复制到剪贴板');
    }
  };

  return (
    <div className="max-w-md mx-auto">
      {/* 分享卡片 */}
      <div
        ref={cardRef}
        className="bg-gradient-to-br from-blue-600 to-purple-700 rounded-xl p-6 text-white shadow-xl"
      >
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold mb-1">TradingPK</h2>
          <p className="text-blue-200 text-sm">PK 顶级交易员</p>
        </div>

        {/* 对比 */}
        <div className="bg-white/10 rounded-lg p-4 mb-4">
          <div className="flex justify-between items-center">
            <div className="text-center flex-1">
              <div className="text-sm text-blue-200">你</div>
              <div className="text-3xl font-bold">
                {result.userReturn >= 0 ? '+' : ''}
                {result.userReturn.toFixed(2)}%
              </div>
            </div>
            <div className="text-3xl px-4">VS</div>
            <div className="text-center flex-1">
              <div className="text-sm text-blue-200">paul wei</div>
              <div className="text-3xl font-bold">
                {result.paulWeiReturn >= 0 ? '+' : ''}
                {result.paulWeiReturn.toFixed(2)}%
              </div>
            </div>
          </div>
        </div>

        {/* 结果 */}
        <div className="text-center mb-4">
          <span className="text-5xl">{getResultEmoji()}</span>
          <div className="text-xl font-bold mt-2">{getResultText()}</div>
          {!isTie && (
            <div className="text-blue-200 text-sm">
              差距: {Math.abs(result.userReturn - result.paulWeiReturn).toFixed(2)}%
            </div>
          )}
        </div>

        {/* 底部 */}
        <div className="text-center text-sm text-blue-200 border-t border-white/20 pt-4 mt-4">
          <p>扫码或访问 tradingpk.com 开始挑战</p>
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="flex gap-3 mt-4">
        <Button
          variant="secondary"
          onClick={handleDownload}
          className="flex-1"
        >
          保存图片
        </Button>
        <Button onClick={handleShare} className="flex-1">
          分享
        </Button>
      </div>
    </div>
  );
}
