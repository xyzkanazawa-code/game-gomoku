import React from 'react';
import { X, BookOpen, Sparkles, Bomb, Timer, Hourglass, Zap } from 'lucide-react';

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RulesModal: React.FC<RulesModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-3 sm:p-4 animate-fadeIn">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-lg p-5 sm:p-6 shadow-2xl relative text-zinc-300 space-y-4">
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
            <h2 className="text-lg font-bold text-white">五目並べ＆特殊ルール解説</h2>
            <p className="text-xs text-zinc-400">多彩な特殊ルールで白熱した対局を楽しもう！</p>
          </div>
        </div>

        <div className="space-y-3.5 text-xs leading-relaxed max-h-[65vh] overflow-y-auto pr-1">
          {/* 通常ルール */}
          <div className="p-3.5 bg-zinc-800/40 rounded-2xl border border-zinc-700/40">
            <h3 className="font-bold text-amber-400 flex items-center gap-2 mb-1.5 text-sm">
              ⚪⚫ 通常五目並べ (Standard)
            </h3>
            <p>
              縦・横・斜めの一直線上に、自分の色の石を<strong>先に5つ以上</strong>並べたプレイヤーの勝利となります。黒が先手、白が後手です。
            </p>
          </div>

          {/* 消える五目並べ */}
          <div className="p-3.5 bg-zinc-800/40 rounded-2xl border border-purple-500/30">
            <h3 className="font-bold text-purple-400 flex items-center gap-2 mb-1.5 text-sm">
              <Hourglass size={16} /> 1. 消える五目並べ（寿命ルール）
            </h3>
            <p>
              盤面に残せる石は<strong>各プレイヤー最大6個</strong>まで！<br />
              7個目の石を打つと、<strong>自分が一番最初に置いた最も古い石が自動的に消滅</strong>します。
              <br />
              <span className="text-purple-300 font-semibold">★攻略のコツ:</span> 次に消える石には「1」の番号が半透明で点滅表示されます。先の手を読んで計画的に打つ必要があります！
            </p>
          </div>

          {/* 六目並べ */}
          <div className="p-3.5 bg-zinc-800/40 rounded-2xl border border-cyan-500/30">
            <h3 className="font-bold text-cyan-400 flex items-center gap-2 mb-1.5 text-sm">
              <Zap size={16} /> 2. 六目並べ (Connect 6)
            </h3>
            <p>
              世界大会でも公式採用される究極の公平ルール！<br />
              初手（黒の1手目）のみ1石置き、それ以降は<strong>毎ターン2手連続で石を打ちます</strong>。<br />
              先に<strong>6個並べたプレイヤーの勝利</strong>となります。<br />
              <span className="text-cyan-300 font-semibold">★面白さ:</span> 相手のリーチを止めつつ自分の攻めも同時に展開できるため、大逆転の応酬になります！
            </p>
          </div>

          {/* 地雷五目並べ */}
          <div className="p-3.5 bg-zinc-800/40 rounded-2xl border border-rose-500/30">
            <h3 className="font-bold text-rose-400 flex items-center gap-2 mb-1.5 text-sm">
              <Bomb size={16} /> 3. 地雷五目並べ (Minefield)
            </h3>
            <p>
              盤面のどこかに<strong>5つの地雷が秘密裏に埋められています</strong>。<br />
              地雷マスに石を置いた瞬間、<strong>大爆発！周囲1マス（3×3マス）にある全ての石が盤面から吹き飛んで消滅</strong>します！<br />
              <span className="text-rose-300 font-semibold">★注意:</span> 爆発した手番の石も消滅し、手番は相手に移ります。地雷がどこにあるか警戒しながら打つハラハラ感が魅力です。
            </p>
          </div>

          {/* スキル五目並べ */}
          <div className="p-3.5 bg-zinc-800/40 rounded-2xl border border-emerald-500/30">
            <h3 className="font-bold text-emerald-400 flex items-center gap-2 mb-1.5 text-sm">
              <Sparkles size={16} /> 4. スキル五目並べ (必殺技モード)
            </h3>
            <p>
              各プレイヤーは1局につき1回ずつ使える<strong>3つの必殺技</strong>を所持してスタートします：
            </p>
            <ul className="list-disc list-inside mt-1.5 space-y-1 text-zinc-300 pl-1">
              <li><strong className="text-amber-300">反転 (Flip):</strong> 盤面上の相手の石を1つ選び、自分の石に寝返らせる！</li>
              <li><strong className="text-rose-300">破壊 (Destroy):</strong> 邪魔な相手の石を1つ選んで盤面から粉砕・消去する！</li>
              <li><strong className="text-blue-300">連打 (Double):</strong> この手番だけ一気に2連続で石を打てる！</li>
            </ul>
          </div>

          {/* スピード秒読みタイマー */}
          <div className="p-3.5 bg-zinc-800/40 rounded-2xl border border-amber-500/30">
            <h3 className="font-bold text-amber-400 flex items-center gap-2 mb-1.5 text-sm">
              <Timer size={16} /> 5. スピード秒読み機能（タイマー設定）
            </h3>
            <p>
              ヘッダーの「タイマー設定」から、1手ごとの制限時間を自由に設定できます。<br />
              <strong>【無制限 / 5秒 / 10秒 / 15秒 / 30秒 / 自由なカスタム秒数】</strong>から選択可能！<br />
              残り時間が少なくなると警告チクタク音が鳴り響き、時間切れになると即座に相手の勝利となります。
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-semibold rounded-xl text-xs transition-all shadow-md"
        >
          ルールを閉じる
        </button>
      </div>
    </div>
  );
};
