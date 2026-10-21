import React, { useState } from 'react';
import { Copy, Check, X, Users, Globe, LogIn } from 'lucide-react';

interface OnlineModalProps {
  isOpen: boolean;
  onClose: () => void;
  peerId: string;
  isConnected: boolean;
  isHost: boolean;
  statusText: string;
  errorText: string;
  onCreateRoom: () => void;
  onJoinRoom: (roomId: string) => void;
  onDisconnect: () => void;
}

export const OnlineModal: React.FC<OnlineModalProps> = ({
  isOpen,
  onClose,
  peerId,
  isConnected,
  isHost,
  statusText,
  errorText,
  onCreateRoom,
  onJoinRoom,
  onDisconnect,
}) => {
  const [inputRoomId, setInputRoomId] = useState('');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // 招待用URL（現在のURL + ?room=ID）
  const inviteUrl = peerId
    ? `${window.location.origin}${window.location.pathname}?room=${peerId}`
    : '';

  const handleCopyLink = () => {
    if (!inviteUrl) return;
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyId = () => {
    if (!peerId) return;
    navigator.clipboard.writeText(peerId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-md p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800"
        >
          <X size={20} />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-2xl bg-amber-600/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
            <Globe size={22} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">オンライン対戦（P2P通信）</h2>
            <p className="text-xs text-zinc-400">サーバー代不要・URL共有で即座に対戦できます</p>
          </div>
        </div>

        {/* 接続中/接続完了の表示 */}
        {isConnected ? (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-800/40 text-center">
              <div className="flex items-center justify-center gap-2 text-emerald-400 font-bold mb-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                対戦相手と接続中！
              </div>
              <p className="text-xs text-zinc-300">
                あなたの手番: <span className="font-bold text-amber-300">{isHost ? '先手 (黒)' : '後手 (白)'}</span>
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="flex-1 py-3 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl text-sm transition-all"
              >
                盤面に戻る
              </button>
              <button
                onClick={onDisconnect}
                className="px-4 py-3 bg-zinc-800 hover:bg-rose-900/40 text-zinc-300 hover:text-rose-300 rounded-xl text-sm transition-all"
              >
                切断
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {/* ルーム作成（ホスト） */}
            <div className="p-4 rounded-2xl bg-zinc-800/40 border border-zinc-700/50 space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-zinc-200">
                <Users size={16} className="text-amber-400" />
                部屋を作って友達を招待する (先手/黒)
              </div>

              {!peerId ? (
                <button
                  onClick={onCreateRoom}
                  className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-semibold rounded-xl text-sm transition-all shadow-lg active:scale-98"
                >
                  対戦部屋を作成する
                </button>
              ) : (
                <div className="space-y-2">
                  <div className="text-xs text-amber-400 font-medium animate-pulse">
                    相手の参加を待機しています...
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={inviteUrl}
                      className="flex-1 bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-300 select-all"
                    />
                    <button
                      onClick={handleCopyLink}
                      className="px-3 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all"
                    >
                      {copied ? <Check size={14} /> : <Copy size={14} />}
                      {copied ? 'コピー済' : '招待URL'}
                    </button>
                  </div>

                  <div className="flex justify-between items-center text-[11px] text-zinc-400 px-1">
                    <span>ルームID: <strong className="text-zinc-200">{peerId}</strong></span>
                    <button onClick={handleCopyId} className="text-amber-400 hover:underline">
                      IDのみコピー
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* ルーム参加（ゲスト） */}
            <div className="p-4 rounded-2xl bg-zinc-800/40 border border-zinc-700/50 space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-zinc-200">
                <LogIn size={16} className="text-blue-400" />
                友達の部屋に参加する (後手/白)
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="ルームIDまたはURLを入力"
                  value={inputRoomId}
                  onChange={(e) => setInputRoomId(e.target.value)}
                  className="flex-1 bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-amber-500"
                />
                <button
                  onClick={() => {
                    // URL形式の場合は ?room= の部分を抽出
                    let id = inputRoomId.trim();
                    if (id.includes('room=')) {
                      const match = id.match(/room=([^&]+)/);
                      if (match) id = match[1];
                    }
                    onJoinRoom(id);
                  }}
                  disabled={!inputRoomId.trim()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white font-semibold rounded-xl text-xs transition-all"
                >
                  参加する
                </button>
              </div>
            </div>

            {/* ステータス & エラーメッセージ */}
            {statusText && (
              <div className="text-center text-xs text-zinc-400">
                {statusText}
              </div>
            )}
            {errorText && (
              <div className="text-center text-xs text-rose-400 font-medium">
                {errorText}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
