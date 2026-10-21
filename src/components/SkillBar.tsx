import React from 'react';
import type { PlayerSkills, SkillType } from '../types/game';
import { RefreshCw, Trash2, FastForward } from 'lucide-react';

interface SkillBarProps {
  skills: PlayerSkills;
  activeSkillMode: SkillType | null;
  onActivateSkill: (skill: SkillType) => void;
  onCancelSkill: () => void;
  disabled: boolean;
}

export const SkillBar: React.FC<SkillBarProps> = ({
  skills,
  activeSkillMode,
  onActivateSkill,
  onCancelSkill,
  disabled,
}) => {
  return (
    <div className="w-full max-w-2xl mx-auto px-3 py-1.5 flex flex-col items-center gap-1.5 animate-fadeIn">
      {activeSkillMode && (
        <div className="flex items-center gap-2 bg-amber-500/20 border border-amber-500/40 text-amber-300 px-3 py-1 rounded-full text-xs animate-pulse">
          <span>
            {activeSkillMode === 'flip'
              ? '反転: 相手の石をクリックして自色に変えてください'
              : activeSkillMode === 'destroy'
              ? '破壊: 相手の石をクリックして盤面から消去してください'
              : '連打モード発動中！2石連続で打てます'}
          </span>
          <button
            onClick={onCancelSkill}
            className="ml-1 underline text-zinc-300 hover:text-white"
          >
            キャンセル
          </button>
        </div>
      )}

      <div className="flex items-center gap-2">
        <span className="text-[11px] font-bold text-emerald-400">必殺技:</span>

        {/* 反転 */}
        <button
          disabled={disabled || !skills.flip}
          onClick={() => (activeSkillMode === 'flip' ? onCancelSkill() : onActivateSkill('flip'))}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold transition-all ${
            activeSkillMode === 'flip'
              ? 'bg-amber-500 text-zinc-900 ring-2 ring-white shadow-lg'
              : skills.flip
              ? 'bg-zinc-800 hover:bg-zinc-700 text-amber-300 border border-amber-500/30'
              : 'bg-zinc-900/60 text-zinc-600 border border-zinc-800/40 cursor-not-allowed line-through'
          }`}
          title="相手の石を1つ自分の石に変える"
        >
          <RefreshCw size={13} />
          反転
        </button>

        {/* 破壊 */}
        <button
          disabled={disabled || !skills.destroy}
          onClick={() => (activeSkillMode === 'destroy' ? onCancelSkill() : onActivateSkill('destroy'))}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold transition-all ${
            activeSkillMode === 'destroy'
              ? 'bg-rose-500 text-white ring-2 ring-white shadow-lg'
              : skills.destroy
              ? 'bg-zinc-800 hover:bg-zinc-700 text-rose-300 border border-rose-500/30'
              : 'bg-zinc-900/60 text-zinc-600 border border-zinc-800/40 cursor-not-allowed line-through'
          }`}
          title="相手の石を1つ盤面から消滅させる"
        >
          <Trash2 size={13} />
          破壊
        </button>

        {/* 連打 */}
        <button
          disabled={disabled || !skills.double}
          onClick={() => (activeSkillMode === 'double' ? onCancelSkill() : onActivateSkill('double'))}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold transition-all ${
            activeSkillMode === 'double'
              ? 'bg-blue-500 text-white ring-2 ring-white shadow-lg'
              : skills.double
              ? 'bg-zinc-800 hover:bg-zinc-700 text-blue-300 border border-blue-500/30'
              : 'bg-zinc-900/60 text-zinc-600 border border-zinc-800/40 cursor-not-allowed line-through'
          }`}
          title="この手番だけ2石打てる"
        >
          <FastForward size={13} />
          連打 (2石)
        </button>
      </div>
    </div>
  );
};
