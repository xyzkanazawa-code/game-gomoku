import React, { useState } from 'react';
import type { SpecialRule } from '../types/game';
import { Hourglass, Zap, Bomb, Sparkles, Circle, Timer, Settings2 } from 'lucide-react';

interface SpecialRuleSelectorProps {
  specialRule: SpecialRule;
  onSelectRule: (rule: SpecialRule) => void;
  timeLimit: number | null; // 秒数 (null = 無制限)
  onSetTimeLimit: (seconds: number | null) => void;
  disabled?: boolean;
}

export const SpecialRuleSelector: React.FC<SpecialRuleSelectorProps> = ({
  specialRule,
  onSelectRule,
  timeLimit,
  onSetTimeLimit,
  disabled = false,
}) => {
  const [isTimerModalOpen, setIsTimerModalOpen] = useState(false);
  const [customSeconds, setCustomSeconds] = useState<string>('20');

  const rules: { id: SpecialRule; label: string; icon: React.ReactNode; color: string }[] = [
    { id: 'standard', label: '通常', icon: <Circle size={14} />, color: 'text-amber-400' },
    { id: 'disappearing', label: '消える(6個)', icon: <Hourglass size={14} />, color: 'text-purple-400' },
    { id: 'connect6', label: '六目(2手連)', icon: <Zap size={14} />, color: 'text-cyan-400' },
    { id: 'minefield', label: '地雷爆発', icon: <Bomb size={14} />, color: 'text-rose-400' },
    { id: 'skill', label: '必殺スキル', icon: <Sparkles size={14} />, color: 'text-emerald-400' },
  ];

  const timerPresets = [
    { label: '無制限', value: null },
    { label: '5秒 (超激熱)', value: 5 },
    { label: '10秒 (快速)', value: 10 },
    { label: '15秒 (標準)', value: 15 },
    { label: '30秒 (じっくり)', value: 30 },
  ];

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col gap-2 px-3">
      {/* 特殊ルールボタングループ */}
      <div className="flex items-center justify-between gap-1 sm:gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        <div className="flex items-center gap-1 sm:gap-1.5 flex-1">
          {rules.map((r) => {
            const isSelected = specialRule === r.id;
            return (
              <button
                key={r.id}
                disabled={disabled}
                onClick={() => onSelectRule(r.id)}
                className={`flex items-center gap-1 sm:gap-1.5 py-1.5 px-2.5 rounded-xl font-medium text-xs whitespace-nowrap transition-all ${
                  isSelected
                    ? 'bg-zinc-100 text-zinc-900 shadow-md font-bold scale-[1.02]'
                    : 'bg-zinc-900/80 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 border border-zinc-800'
                } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <span className={isSelected ? 'text-zinc-900' : r.color}>{r.icon}</span>
                {r.label}
              </button>
            );
          })}
        </div>

        {/* タイマー設定ボタン */}
        <button
          disabled={disabled}
          onClick={() => setIsTimerModalOpen(true)}
          className={`flex items-center gap-1.5 py-1.5 px-2.5 rounded-xl text-xs font-semibold border transition-all whitespace-nowrap ${
            timeLimit !== null
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm'
              : 'bg-zinc-900/80 text-zinc-400 hover:text-zinc-200 border-zinc-800'
          }`}
          title="制限時間タイマーの設定"
        >
          <Timer size={14} className={timeLimit !== null ? 'text-amber-400' : ''} />
          <span>{timeLimit !== null ? `${timeLimit}秒` : 'タイマー'}</span>
          <Settings2 size={12} className="opacity-60" />
        </button>
      </div>

      {/* タイマー設定モーダル */}
      {isTimerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-xs p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <Timer size={18} className="text-amber-400" />
                スピード秒読み設定
              </div>
              <button
                onClick={() => setIsTimerModalOpen(false)}
                className="text-zinc-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-zinc-400">
              1手あたりの持ち時間を設定できます。時間切れで敗北となります。
            </p>

            <div className="space-y-1.5">
              {timerPresets.map((preset, idx) => {
                const isSelected = timeLimit === preset.value;
                return (
                  <button
                    key={idx}
                    onClick={() => {
                      onSetTimeLimit(preset.value);
                      setIsTimerModalOpen(false);
                    }}
                    className={`w-full py-2 px-3 rounded-xl text-xs font-medium flex items-center justify-between transition-all ${
                      isSelected
                        ? 'bg-amber-600 text-white font-bold'
                        : 'bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300'
                    }`}
                  >
                    <span>{preset.label}</span>
                    {isSelected && <span className="text-[10px]">選択中</span>}
                  </button>
                );
              })}
            </div>

            {/* カスタム秒数入力 */}
            <div className="pt-2 border-t border-zinc-800 space-y-2">
              <label className="text-[11px] text-zinc-400 block font-medium">
                自由に秒数を指定 (秒)
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="1"
                  max="180"
                  value={customSeconds}
                  onChange={(e) => setCustomSeconds(e.target.value)}
                  className="flex-1 bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
                  placeholder="秒数を入力"
                />
                <button
                  onClick={() => {
                    const sec = parseInt(customSeconds, 10);
                    if (!isNaN(sec) && sec > 0) {
                      onSetTimeLimit(sec);
                      setIsTimerModalOpen(false);
                    }
                  }}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-semibold transition-all"
                >
                  設定
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
