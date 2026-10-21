import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import type { Player, GameMode } from '../types/game';
import { Trophy, RotateCcw } from 'lucide-react';

interface WinModalProps {
  winner: Player | 'draw' | null;
  gameMode: GameMode;
  myColor: Player | null;
  onReset: () => void;
  onClose: () => void;
}

export const WinModal: React.FC<WinModalProps> = ({
  winner,
  gameMode,
  myColor,
  onReset,
  onClose,
}) => {
  useEffect(() => {
    if (winner && winner !== 'draw') {
      const isWinner =
        gameMode === 'local' ||
        (gameMode === 'ai' && winner === 'black') ||
        (gameMode === 'online' && winner === myColor);

      if (isWinner) {
        // 紙吹雪エフェクト
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 },
        });
      }
    }
  }, [winner, gameMode, myColor]);

  if (!winner) return null;

  const isDraw = winner === 'draw';
  const isSelfWinner =
    gameMode === 'local'
      ? true
      : gameMode === 'ai'
      ? winner === 'black'
      : winner === myColor;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-zinc-900 border border-amber-500/40 rounded-3xl w-full max-w-sm p-6 text-center shadow-2xl space-y-4">
        <div className="w-16 h-16 rounded-full bg-amber-500/20 text-amber-400 mx-auto flex items-center justify-center border border-amber-500/30">
          <Trophy size={36} />
        </div>

        <div>
          <h2 className="text-2xl font-bold text-white">
            {isDraw
              ? '引き分け！'
              : gameMode === 'local'
              ? `${winner === 'black' ? '先手 (黒)' : '後手 (白)'}の勝利！`
              : isSelfWinner
              ? 'お見事！あなたの勝利！'
              : '残念... 相手の勝利'}
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            {isDraw
              ? '盤面がすべて埋まりました'
              : `${winner === 'black' ? '黒石' : '白石'}が五連を達成しました！`}
          </p>
        </div>

        <div className="flex gap-2 pt-2">
          <button
            onClick={onReset}
            className="flex-1 py-3 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95"
          >
            <RotateCcw size={18} />
            もう一度遊ぶ
          </button>
          <button
            onClick={onClose}
            className="px-4 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold rounded-xl text-sm transition-all"
          >
            盤面を見る
          </button>
        </div>
      </div>
    </div>
  );
};
