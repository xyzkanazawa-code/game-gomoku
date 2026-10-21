import React from 'react';
import { RotateCcw, Undo2, Flag, MessageSquare } from 'lucide-react';
import type { GameMode } from '../types/game';

interface ControlsProps {
  gameMode: GameMode;
  canUndo: boolean;
  onUndo: () => void;
  onReset: () => void;
  onSurrender: () => void;
  onToggleChat?: () => void;
  hasUnreadChat?: boolean;
}

export const Controls: React.FC<ControlsProps> = ({
  gameMode,
  canUndo,
  onUndo,
  onReset,
  onSurrender,
  onToggleChat,
  hasUnreadChat,
}) => {
  return (
    <div className="w-full max-w-2xl mx-auto flex items-center justify-center gap-2 sm:gap-3 py-3 px-3">
      {/* 待ったボタン (ローカル/CPU戦のみ、またはオンラインで待った要求) */}
      <button
        onClick={onUndo}
        disabled={!canUndo}
        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all ${
          canUndo
            ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 active:scale-95'
            : 'bg-zinc-900/60 text-zinc-600 cursor-not-allowed'
        }`}
      >
        <Undo2 size={16} />
        待った
      </button>

      {/* 対局リセット */}
      <button
        onClick={onReset}
        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-all active:scale-95"
      >
        <RotateCcw size={16} />
        最初から
      </button>

      {/* 投了（ギブアップ） */}
      <button
        onClick={onSurrender}
        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/40 transition-all active:scale-95"
      >
        <Flag size={16} />
        投了
      </button>

      {/* オンライン時のチャットトグル */}
      {gameMode === 'online' && onToggleChat && (
        <button
          onClick={onToggleChat}
          className="relative flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium bg-amber-600/30 hover:bg-amber-600/50 text-amber-200 border border-amber-500/40 transition-all active:scale-95"
        >
          <MessageSquare size={16} />
          チャット
          {hasUnreadChat && (
            <span className="w-2 h-2 rounded-full bg-rose-500 absolute -top-1 -right-1 animate-ping" />
          )}
        </button>
      )}
    </div>
  );
};
