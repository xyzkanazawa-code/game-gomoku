import React from 'react';
import type { GameMode, AIDifficulty, Player } from '../types/game';
import { Volume2, VolumeX, Bot, Users, Globe, HelpCircle } from 'lucide-react';

interface GameHeaderProps {
  gameMode: GameMode;
  onSelectMode: (mode: GameMode) => void;
  aiDifficulty: AIDifficulty;
  onSelectAIDifficulty: (diff: AIDifficulty) => void;
  currentTurn: Player;
  myColor: Player | null;
  moveCount: number;
  isMuted: boolean;
  onToggleSound: () => void;
  onOpenRules: () => void;
  onOpenOnlineModal: () => void;
  isOnlineConnected: boolean;
}

export const GameHeader: React.FC<GameHeaderProps> = ({
  gameMode,
  onSelectMode,
  aiDifficulty,
  onSelectAIDifficulty,
  currentTurn,
  myColor,
  moveCount,
  isMuted,
  onToggleSound,
  onOpenRules,
  onOpenOnlineModal,
  isOnlineConnected,
}) => {
  return (
    <header className="w-full max-w-2xl mx-auto flex flex-col gap-3 px-3 py-2">
      {/* 上段: タイトルと共通設定ボタン */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center font-bold text-black shadow-lg">
            五
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              五目並べ
              <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Online
              </span>
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={onToggleSound}
            aria-label="音声切替"
            className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
            title={isMuted ? '効果音をONにする' : '効果音をOFFにする'}
          >
            {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} className="text-amber-400" />}
          </button>
          <button
            onClick={onOpenRules}
            aria-label="ルール確認"
            className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
            title="五目並べのルール"
          >
            <HelpCircle size={18} />
          </button>
        </div>
      </div>

      {/* モード選択タブ */}
      <div className="grid grid-cols-3 gap-1.5 p-1 bg-zinc-900/90 rounded-2xl border border-zinc-800">
        <button
          onClick={() => onSelectMode('ai')}
          className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl font-medium text-xs sm:text-sm transition-all ${
            gameMode === 'ai'
              ? 'bg-amber-600 text-white shadow-md'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
          }`}
        >
          <Bot size={16} />
          CPU対戦
        </button>
        <button
          onClick={() => onSelectMode('local')}
          className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl font-medium text-xs sm:text-sm transition-all ${
            gameMode === 'local'
              ? 'bg-amber-600 text-white shadow-md'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
          }`}
        >
          <Users size={16} />
          ローカル対戦
        </button>
        <button
          onClick={() => {
            onSelectMode('online');
            if (!isOnlineConnected) {
              onOpenOnlineModal();
            }
          }}
          className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl font-medium text-xs sm:text-sm transition-all relative ${
            gameMode === 'online'
              ? 'bg-amber-600 text-white shadow-md'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
          }`}
        >
          <Globe size={16} />
          オンライン
          {isOnlineConnected && (
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse absolute top-2 right-2" />
          )}
        </button>
      </div>

      {/* サブオプション: CPU対戦時の難易度設定 */}
      {gameMode === 'ai' && (
        <div className="flex items-center justify-center gap-2 text-xs py-0.5">
          <span className="text-zinc-400">難易度:</span>
          {(['easy', 'medium', 'hard'] as AIDifficulty[]).map((diff) => (
            <button
              key={diff}
              onClick={() => onSelectAIDifficulty(diff)}
              className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                aiDifficulty === diff
                  ? 'bg-zinc-200 text-zinc-900 shadow'
                  : 'bg-zinc-800/80 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {diff === 'easy' ? '初級' : diff === 'medium' ? '中級' : '上級'}
            </button>
          ))}
        </div>
      )}

      {/* 手番・ステータスインジケーター */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-zinc-900/60 backdrop-blur rounded-2xl border border-zinc-800/80">
        {/* 黒プレイヤー表示 */}
        <div
          className={`flex items-center gap-2 transition-all ${
            currentTurn === 'black' ? 'opacity-100 scale-105' : 'opacity-50'
          }`}
        >
          <div
            className={`w-5 h-5 rounded-full stone-black ${
              currentTurn === 'black' ? 'ring-2 ring-amber-400' : ''
            }`}
          />
          <div className="text-left">
            <div className="text-xs font-semibold text-zinc-300">
              先手 (黒)
              {gameMode === 'online' && myColor === 'black' && '【あなた】'}
              {gameMode === 'ai' && '【あなた】'}
            </div>
            {currentTurn === 'black' && (
              <span className="text-[10px] text-amber-400 font-bold animate-pulse">思案中...</span>
            )}
          </div>
        </div>

        {/* 手数 */}
        <div className="text-center">
          <div className="text-[11px] text-zinc-400">手数</div>
          <div className="text-base font-bold text-zinc-100">{moveCount} 手</div>
        </div>

        {/* 白プレイヤー表示 */}
        <div
          className={`flex items-center gap-2 transition-all ${
            currentTurn === 'white' ? 'opacity-100 scale-105' : 'opacity-50'
          }`}
        >
          <div className="text-right">
            <div className="text-xs font-semibold text-zinc-300">
              後手 (白)
              {gameMode === 'online' && myColor === 'white' && '【あなた】'}
              {gameMode === 'ai' && '【CPU】'}
            </div>
            {currentTurn === 'white' && (
              <span className="text-[10px] text-amber-400 font-bold animate-pulse">思案中...</span>
            )}
          </div>
          <div
            className={`w-5 h-5 rounded-full stone-white ${
              currentTurn === 'white' ? 'ring-2 ring-amber-400' : ''
            }`}
          />
        </div>
      </div>
    </header>
  );
};
