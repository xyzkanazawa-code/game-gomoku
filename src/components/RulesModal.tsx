import React from 'react';
import { X, BookOpen } from 'lucide-react';

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RulesModal: React.FC<RulesModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-md p-6 shadow-2xl relative text-zinc-300 space-y-4">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800"
        >
          <X size={20} />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-600/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
            <BookOpen size={22} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">五目並べのルール</h2>
            <p className="text-xs text-zinc-400">基本ルールと遊び方</p>
          </div>
        </div>

        <div className="space-y-3 text-xs leading-relaxed max-h-[60vh] overflow-y-auto pr-1">
          <div className="p-3 bg-zinc-800/40 rounded-xl border border-zinc-700/40">
            <h3 className="font-bold text-amber-300 mb-1">1. 基本勝利条件</h3>
            <p>
              縦・横・斜めのいずれかの一直線上に、自分の色の碁石を<strong>先に5つ以上</strong>並べたプレイヤーの勝利となります。
            </p>
          </div>

          <div className="p-3 bg-zinc-800/40 rounded-xl border border-zinc-700/40">
            <h3 className="font-bold text-amber-300 mb-1">2. 手番（先手・後手）</h3>
            <p>
              黒石が先手、白石が後手となります。オンライン対戦では部屋を作成したホストが黒石（先手）、参加者が白石（後手）になります。
            </p>
          </div>

          <div className="p-3 bg-zinc-800/40 rounded-xl border border-zinc-700/40">
            <h3 className="font-bold text-amber-300 mb-1">3. CPU対戦モード</h3>
            <p>
              初級・中級・上級の3つの強さから選べます。攻防のスコアリングAIにより、手応えのある本格的な対局が楽しめます。
            </p>
          </div>

          <div className="p-3 bg-zinc-800/40 rounded-xl border border-zinc-700/40">
            <h3 className="font-bold text-amber-300 mb-1">4. オンライン対戦（完全無料）</h3>
            <p>
              部屋を作成して発行されたURLを友達に送るだけで、ブラウザ同士が直接つながりリアルタイムに対局できます。チャットやスタンプ機能も楽しめます。
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-semibold rounded-xl text-xs transition-all"
        >
          閉じる
        </button>
      </div>
    </div>
  );
};
