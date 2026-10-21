import React, { useState, useRef, useEffect } from 'react';
import { Send, X, MessageSquare } from 'lucide-react';
import type { ChatMessage } from '../types/game';

interface ChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
}

const QUICK_EMOJIS = ['よろしくお願いします！', 'ナイス手！', '参りました...', '惜しい！', 'ありがとう！', '🤔', '🔥', '👏'];

export const ChatDrawer: React.FC<ChatDrawerProps> = ({
  isOpen,
  onClose,
  messages,
  onSendMessage,
}) => {
  const [text, setText] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    onSendMessage(text.trim());
    setText('');
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-80 bg-zinc-900 border-l border-zinc-800 shadow-2xl flex flex-col animate-slideLeft">
      <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-2 text-white font-bold text-sm">
          <MessageSquare size={18} className="text-amber-400" />
          対局チャット
        </div>
        <button
          onClick={onClose}
          className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800"
        >
          <X size={18} />
        </button>
      </div>

      {/* メッセージ一覧 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="text-center text-xs text-zinc-500 py-8">
            メッセージやスタンプを送って<br />対局相手とコミュニケーションできます
          </div>
        ) : (
          messages.map((m) => (
            <div
              key={m.id}
              className={`flex flex-col ${
                m.sender === 'self'
                  ? 'items-end'
                  : m.sender === 'opponent'
                  ? 'items-start'
                  : 'items-center'
              }`}
            >
              {m.sender === 'system' ? (
                <span className="text-[10px] text-zinc-400 bg-zinc-800/80 px-2 py-0.5 rounded-full">
                  {m.text}
                </span>
              ) : (
                <div
                  className={`max-w-[85%] rounded-2xl px-3 py-2 text-xs ${
                    m.sender === 'self'
                      ? 'bg-amber-600 text-white rounded-tr-none'
                      : 'bg-zinc-800 text-zinc-200 rounded-tl-none border border-zinc-700/60'
                  }`}
                >
                  {m.text}
                </div>
              )}
            </div>
          ))
        )}
        <div ref={endRef} />
      </div>

      {/* 定型文・クイックリアクション */}
      <div className="p-2 border-t border-zinc-800/80 flex flex-wrap gap-1 bg-zinc-950/40">
        {QUICK_EMOJIS.map((quick, idx) => (
          <button
            key={idx}
            onClick={() => onSendMessage(quick)}
            className="text-[11px] px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg transition-colors"
          >
            {quick}
          </button>
        ))}
      </div>

      {/* 入力フォーム */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-zinc-800 flex gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="メッセージを入力..."
          className="flex-1 bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500"
        />
        <button
          type="submit"
          disabled={!text.trim()}
          className="p-2 bg-amber-600 hover:bg-amber-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white rounded-xl transition-all"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
};
