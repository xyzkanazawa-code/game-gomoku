import { useState, useEffect, useCallback, useRef } from 'react';
import type {
  Player,
  BoardState,
  GameMode,
  AIDifficulty,
  Position,
  MoveRecord,
  ChatMessage,
  PeerMessage,
} from './types/game';
import { createEmptyBoard, checkWin, isBoardFull } from './logic/gomoku';
import { getAIMove } from './logic/ai';
import { soundManager } from './utils/sound';
import { usePeerConnection } from './hooks/usePeerConnection';
import { Board } from './components/Board';
import { GameHeader } from './components/GameHeader';
import { Controls } from './components/Controls';
import { OnlineModal } from './components/OnlineModal';
import { WinModal } from './components/WinModal';
import { ChatDrawer } from './components/ChatDrawer';
import { RulesModal } from './components/RulesModal';

export function App() {
  const [board, setBoard] = useState<BoardState>(createEmptyBoard());
  const [currentTurn, setCurrentTurn] = useState<Player>('black');
  const [moveHistory, setMoveHistory] = useState<MoveRecord[]>([]);
  const [winner, setWinner] = useState<Player | 'draw' | null>(null);
  const [winningLine, setWinningLine] = useState<Position[] | null>(null);

  const [gameMode, setGameMode] = useState<GameMode>('ai');
  const [aiDifficulty, setAiDifficulty] = useState<AIDifficulty>('medium');
  const [isAiThinking, setIsAiThinking] = useState(false);

  const [isMuted, setIsMuted] = useState(false);
  const [isOnlineModalOpen, setIsOnlineModalOpen] = useState(false);
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [hasUnreadChat, setHasUnreadChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  // オンラインP2P用のコールバック参照
  const boardRef = useRef(board);
  boardRef.current = board;
  const currentTurnRef = useRef(currentTurn);
  currentTurnRef.current = currentTurn;
  const winnerRef = useRef(winner);
  winnerRef.current = winner;

  // リセット共通処理
  const handleResetGame = useCallback(() => {
    setBoard(createEmptyBoard());
    setCurrentTurn('black');
    setMoveHistory([]);
    setWinner(null);
    setWinningLine(null);
    setIsAiThinking(false);
  }, []);

  // オンラインメッセージハンドラ
  const handlePeerMessage = useCallback((msg: PeerMessage) => {
    switch (msg.type) {
      case 'move': {
        const { row, col, player } = msg.payload as MoveRecord;
        soundManager.playStonePlacement();

        setBoard((prev) => {
          const next = prev.map((r) => [...r]);
          next[row][col] = player;
          return next;
        });

        setMoveHistory((prev) => [...prev, { row, col, player }]);

        // 勝利判定
        setTimeout(() => {
          setBoard((cur) => {
            const winRes = checkWin(cur, row, col);
            if (winRes) {
              setWinner(winRes.winner);
              setWinningLine(winRes.winningLine);
              soundManager.playWin();
            } else if (isBoardFull(cur)) {
              setWinner('draw');
            } else {
              setCurrentTurn(player === 'black' ? 'white' : 'black');
            }
            return cur;
          });
        }, 10);
        break;
      }

      case 'surrender': {
        const surrenderedPlayer = msg.payload as Player;
        const vict = surrenderedPlayer === 'black' ? 'white' : 'black';
        setWinner(vict);
        soundManager.playWin();
        break;
      }

      case 'reset_request': {
        if (window.confirm('対戦相手から「最初からやり直す」リクエストがありました。応じますか？')) {
          handleResetGame();
          peerConn.sendMessage({ type: 'reset_accept' });
        }
        break;
      }

      case 'reset_accept': {
        handleResetGame();
        break;
      }

      case 'undo_request': {
        if (window.confirm('対戦相手から「待った」の要請がありました。許可しますか？')) {
          handleUndoInternal(2); // 相手の手＋自分の手を戻す
          peerConn.sendMessage({ type: 'undo_accept' });
        }
        break;
      }

      case 'undo_accept': {
        handleUndoInternal(2);
        break;
      }

      case 'chat': {
        const chatText = msg.payload as string;
        soundManager.playNotification();
        setChatMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            sender: 'opponent',
            text: chatText,
            timestamp: Date.now(),
          },
        ]);
        setHasUnreadChat(true);
        break;
      }

      default:
        break;
    }
  }, [handleResetGame]);

  const peerConn = usePeerConnection({
    onMessage: handlePeerMessage,
    onConnected: () => {
      handleResetGame();
      setIsOnlineModalOpen(false);
      setChatMessages([
        {
          id: Date.now().toString(),
          sender: 'system',
          text: '対戦相手が参加しました！ゲームを開始します。',
          timestamp: Date.now(),
        },
      ]);
    },
    onDisconnected: () => {
      setChatMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          sender: 'system',
          text: '相手との通信が切断されました。',
          timestamp: Date.now(),
        },
      ]);
    },
  });

  // URLパラメータ（?room=xxx）による自動参加
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomId = params.get('room');
    if (roomId) {
      setGameMode('online');
      setIsOnlineModalOpen(true);
      peerConn.joinRoom(roomId);
    }
  }, []);

  // 音声ON/OFF
  const handleToggleSound = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    soundManager.setMuted(nextMuted);
  };

  // 内部的な手戻し処理
  const handleUndoInternal = (steps: number) => {
    setMoveHistory((prev) => {
      if (prev.length < steps) return prev;
      const nextHist = prev.slice(0, prev.length - steps);
      const newBoard = createEmptyBoard();
      nextHist.forEach((m) => {
        newBoard[m.row][m.col] = m.player;
      });
      setBoard(newBoard);
      const lastMove = nextHist[nextHist.length - 1];
      setCurrentTurn(lastMove ? (lastMove.player === 'black' ? 'white' : 'black') : 'black');
      setWinner(null);
      setWinningLine(null);
      return nextHist;
    });
  };

  // 待ったボタン押下
  const handleUndo = () => {
    if (moveHistory.length === 0 || winner) return;

    if (gameMode === 'local') {
      handleUndoInternal(1);
    } else if (gameMode === 'ai') {
      // 自分の番でCPUの手も戻すなら2手、相手の思考中なら1手
      const steps = moveHistory.length >= 2 ? 2 : 1;
      handleUndoInternal(steps);
      setIsAiThinking(false);
    } else if (gameMode === 'online') {
      if (peerConn.isConnected) {
        alert('対戦相手に「待った」の要請を送信しました。相手の承諾をお待ちください。');
        peerConn.sendMessage({ type: 'undo_request' });
      }
    }
  };

  // 投了ボタン押下
  const handleSurrender = () => {
    if (winner) return;

    if (gameMode === 'online') {
      if (!confirm('本当に投了しますか？')) return;
      const myColor: Player = peerConn.isHost ? 'black' : 'white';
      peerConn.sendMessage({ type: 'surrender', payload: myColor });
      setWinner(myColor === 'black' ? 'white' : 'black');
    } else if (gameMode === 'ai') {
      if (!confirm('投了してCPUの勝利としますか？')) return;
      setWinner('white');
    } else {
      if (!confirm(`${currentTurn === 'black' ? '先手(黒)' : '後手(白)'}が投了しますか？`)) return;
      setWinner(currentTurn === 'black' ? 'white' : 'black');
    }
    soundManager.playWin();
  };

  // 石を置く処理
  const handlePlaceStone = (row: number, col: number) => {
    if (board[row][col] || winner || isAiThinking) return;

    // オンラインモードで自分の手番でない場合は打てない
    if (gameMode === 'online') {
      if (!peerConn.isConnected) {
        setIsOnlineModalOpen(true);
        return;
      }
      const myColor: Player = peerConn.isHost ? 'black' : 'white';
      if (currentTurn !== myColor) return;
    }

    const player = currentTurn;
    const newBoard = board.map((r) => [...r]);
    newBoard[row][col] = player;
    setBoard(newBoard);

    const newHistory = [...moveHistory, { row, col, player }];
    setMoveHistory(newHistory);

    soundManager.playStonePlacement();

    // オンライン時は相手に着手を送信
    if (gameMode === 'online') {
      peerConn.sendMessage({
        type: 'move',
        payload: { row, col, player },
      });
    }

    // 勝利判定
    const winResult = checkWin(newBoard, row, col);
    if (winResult) {
      setWinner(winResult.winner);
      setWinningLine(winResult.winningLine);
      soundManager.playWin();
      return;
    }

    // 引き分け判定
    if (isBoardFull(newBoard)) {
      setWinner('draw');
      return;
    }

    const nextTurn = player === 'black' ? 'white' : 'black';
    setCurrentTurn(nextTurn);

    // CPUの着手処理
    if (gameMode === 'ai' && nextTurn === 'white') {
      setIsAiThinking(true);
      setTimeout(() => {
        const aiMove = getAIMove(newBoard, 'white', aiDifficulty);
        if (aiMove) {
          const updatedBoard = newBoard.map((r) => [...r]);
          updatedBoard[aiMove.row][aiMove.col] = 'white';
          setBoard(updatedBoard);

          setMoveHistory((prev) => [
            ...prev,
            { row: aiMove.row, col: aiMove.col, player: 'white' },
          ]);

          soundManager.playStonePlacement();

          const aiWin = checkWin(updatedBoard, aiMove.row, aiMove.col);
          if (aiWin) {
            setWinner(aiWin.winner);
            setWinningLine(aiWin.winningLine);
            soundManager.playWin();
          } else if (isBoardFull(updatedBoard)) {
            setWinner('draw');
          } else {
            setCurrentTurn('black');
          }
        }
        setIsAiThinking(false);
      }, 350);
    }
  };

  // チャット送信
  const handleSendChat = (text: string) => {
    const newMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'self',
      text,
      timestamp: Date.now(),
    };
    setChatMessages((prev) => [...prev, newMsg]);
    peerConn.sendMessage({ type: 'chat', payload: text });
  };

  // 自分の手番かどうかの判定
  const isMyTurn =
    gameMode === 'local'
      ? true
      : gameMode === 'ai'
      ? currentTurn === 'black' && !isAiThinking
      : peerConn.isConnected &&
        ((peerConn.isHost && currentTurn === 'black') || (!peerConn.isHost && currentTurn === 'white'));

  const lastMove = moveHistory.length > 0 ? moveHistory[moveHistory.length - 1] : null;

  return (
    <div className="min-h-screen bg-[#141414] text-zinc-100 flex flex-col justify-between py-2 sm:py-6 px-2 sm:px-4">
      {/* 上部ヘッダー */}
      <GameHeader
        gameMode={gameMode}
        onSelectMode={(mode) => {
          setGameMode(mode);
          handleResetGame();
        }}
        aiDifficulty={aiDifficulty}
        onSelectAIDifficulty={setAiDifficulty}
        currentTurn={currentTurn}
        myColor={gameMode === 'online' ? (peerConn.isHost ? 'black' : 'white') : null}
        moveCount={moveHistory.length}
        isMuted={isMuted}
        onToggleSound={handleToggleSound}
        onOpenRules={() => setIsRulesModalOpen(true)}
        onOpenOnlineModal={() => setIsOnlineModalOpen(true)}
        isOnlineConnected={peerConn.isConnected}
      />

      {/* メイン盤面 */}
      <main className="my-auto py-2 sm:py-4 w-full flex flex-col items-center justify-center">
        <Board
          board={board}
          lastMove={lastMove}
          winningLine={winningLine}
          currentTurn={currentTurn}
          isMyTurn={isMyTurn}
          disabled={Boolean(winner) || isAiThinking}
          onCellClick={handlePlaceStone}
        />
      </main>

      {/* 操作コントロール */}
      <Controls
        gameMode={gameMode}
        canUndo={moveHistory.length > 0 && !winner && !isAiThinking}
        onUndo={handleUndo}
        onReset={() => {
          if (gameMode === 'online' && peerConn.isConnected) {
            peerConn.sendMessage({ type: 'reset_request' });
          } else {
            handleResetGame();
          }
        }}
        onSurrender={handleSurrender}
        onToggleChat={() => {
          setIsChatOpen((prev) => !prev);
          setHasUnreadChat(false);
        }}
        hasUnreadChat={hasUnreadChat}
      />

      {/* フッター情報 */}
      <footer className="text-center text-[11px] text-zinc-500 py-1">
        五目並べ Online &copy; {new Date().getFullYear()} - 完全無料・登録不要
      </footer>

      {/* 各種モーダル & ドロワー */}
      <OnlineModal
        isOpen={isOnlineModalOpen}
        onClose={() => setIsOnlineModalOpen(false)}
        peerId={peerConn.peerId}
        isConnected={peerConn.isConnected}
        isHost={peerConn.isHost}
        statusText={peerConn.statusText}
        errorText={peerConn.errorText}
        onCreateRoom={peerConn.createRoom}
        onJoinRoom={peerConn.joinRoom}
        onDisconnect={peerConn.disconnect}
      />

      <WinModal
        winner={winner}
        gameMode={gameMode}
        myColor={gameMode === 'online' ? (peerConn.isHost ? 'black' : 'white') : null}
        onReset={handleResetGame}
        onClose={() => setWinner(null)}
      />

      <ChatDrawer
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        messages={chatMessages}
        onSendMessage={handleSendChat}
      />

      <RulesModal
        isOpen={isRulesModalOpen}
        onClose={() => setIsRulesModalOpen(false)}
      />
    </div>
  );
}

export default App;
