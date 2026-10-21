import { useState, useEffect, useCallback } from 'react';
import type {
  Player,
  BoardState,
  GameMode,
  AIDifficulty,
  Position,
  MoveRecord,
  ChatMessage,
  PeerMessage,
  SpecialRule,
  SkillType,
  PlayerSkills,
} from './types/game';
import { createEmptyBoard, checkWin, checkGlobalWin, isBoardFull, BOARD_SIZE } from './logic/gomoku';
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
import { SpecialRuleSelector } from './components/SpecialRuleSelector';
import { SkillBar } from './components/SkillBar';

// 地雷のランダム生成（5個、中央付近を避ける）
const generateMines = (): Position[] => {
  const mines: Position[] = [];
  while (mines.length < 5) {
    const r = Math.floor(Math.random() * BOARD_SIZE);
    const c = Math.floor(Math.random() * BOARD_SIZE);
    // 天元(7,7)は除外
    if (r === 7 && c === 7) continue;
    if (!mines.some((m) => m.row === r && m.col === c)) {
      mines.push({ row: r, col: c });
    }
  }
  return mines;
};

const initialSkills: PlayerSkills = {
  flip: true,
  destroy: true,
  double: true,
};

export function App() {
  const [board, setBoard] = useState<BoardState>(createEmptyBoard());
  const [currentTurn, setCurrentTurn] = useState<Player>('black');
  const [moveHistory, setMoveHistory] = useState<MoveRecord[]>([]);
  const [winner, setWinner] = useState<Player | 'draw' | null>(null);
  const [winningLine, setWinningLine] = useState<Position[] | null>(null);

  // 特殊ルール & タイマー
  const [specialRule, setSpecialRule] = useState<SpecialRule>('standard');
  const [timeLimit, setTimeLimit] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  // 六目並べ用: 現在のターンで打った手数 (0: 1手目待ち, 1: 2手目待ち)
  const [connect6MovesInTurn, setConnect6MovesInTurn] = useState<number>(0);

  // 消える五目並べ用: 石の配置履歴（古い順）
  const [blackStones, setBlackStones] = useState<Position[]>([]);
  const [whiteStones, setWhiteStones] = useState<Position[]>([]);

  // 地雷五目並べ用
  const [mines, setMines] = useState<Position[]>(generateMines());
  const [revealedMines, setRevealedMines] = useState<Position[]>([]);

  // スキル五目並べ用
  const [blackSkills, setBlackSkills] = useState<PlayerSkills>({ ...initialSkills });
  const [whiteSkills, setWhiteSkills] = useState<PlayerSkills>({ ...initialSkills });
  const [activeSkillMode, setActiveSkillMode] = useState<SkillType | null>(null);
  const [isDoubleMoveActive, setIsDoubleMoveActive] = useState<boolean>(false);

  // ゲームモード・AI
  const [gameMode, setGameMode] = useState<GameMode>('ai');
  const [aiDifficulty, setAiDifficulty] = useState<AIDifficulty>('medium');
  const [isAiThinking, setIsAiThinking] = useState(false);

  // UI状態
  const [isMuted, setIsMuted] = useState(false);
  const [isOnlineModalOpen, setIsOnlineModalOpen] = useState(false);
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [hasUnreadChat, setHasUnreadChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  // 勝利に必要な石の数
  const winTarget = specialRule === 'connect6' ? 6 : 5;

  // リセット
  const handleResetGame = useCallback(() => {
    setBoard(createEmptyBoard());
    setCurrentTurn('black');
    setMoveHistory([]);
    setWinner(null);
    setWinningLine(null);
    setIsAiThinking(false);
    setConnect6MovesInTurn(0);
    setBlackStones([]);
    setWhiteStones([]);
    setMines(generateMines());
    setRevealedMines([]);
    setBlackSkills({ ...initialSkills });
    setWhiteSkills({ ...initialSkills });
    setActiveSkillMode(null);
    setIsDoubleMoveActive(false);
    setTimeLeft(timeLimit);
  }, [timeLimit]);

  // オンラインメッセージ受信
  const handlePeerMessage = useCallback(
    (msg: PeerMessage) => {
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

          setTimeout(() => {
            setBoard((cur) => {
              const winRes = checkWin(cur, row, col, winTarget);
              if (winRes) {
                setWinner(winRes.winner);
                setWinningLine(winRes.winningLine);
                soundManager.playWin();
              } else if (isBoardFull(cur)) {
                setWinner('draw');
              } else {
                setCurrentTurn(player === 'black' ? 'white' : 'black');
                setTimeLeft(timeLimit);
              }
              return cur;
            });
          }, 10);
          break;
        }

        case 'sync_settings': {
          const { rule, limit } = msg.payload;
          setSpecialRule(rule);
          setTimeLimit(limit);
          setTimeLeft(limit);
          handleResetGame();
          break;
        }

        case 'surrender': {
          const surrenderedPlayer = msg.payload as Player;
          const vict = surrenderedPlayer === 'black' ? 'white' : 'black';
          setWinner(vict);
          soundManager.playWin();
          break;
        }

        case 'timeout': {
          const timedOutPlayer = msg.payload as Player;
          setWinner(timedOutPlayer === 'black' ? 'white' : 'black');
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
            handleResetGame();
            peerConn.sendMessage({ type: 'undo_accept' });
          }
          break;
        }

        case 'undo_accept': {
          handleResetGame();
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
    },
    [winTarget, timeLimit, handleResetGame]
  );

  const peerConn = usePeerConnection({
    onMessage: handlePeerMessage,
    onConnected: (isHost) => {
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
      // ホスト側のルール設定をゲストに同期
      if (isHost) {
        peerConn.sendMessage({
          type: 'sync_settings',
          payload: { rule: specialRule, limit: timeLimit },
        });
      }
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

  // タイマー秒読みカウントダウン処理
  useEffect(() => {
    if (timeLimit === null || winner) {
      setTimeLeft(null);
      return;
    }

    // 初回初期化
    if (timeLeft === null) {
      setTimeLeft(timeLimit);
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === null) return timeLimit;
        if (prev <= 1) {
          // 時間切れ！手番プレイヤーの敗北
          clearInterval(timer);
          const loser = currentTurn;
          const vict: Player = loser === 'black' ? 'white' : 'black';
          setWinner(vict);
          soundManager.playWin();

          if (gameMode === 'online') {
            peerConn.sendMessage({ type: 'timeout', payload: loser });
          }
          return 0;
        }

        // 残り3秒で警告チクタク音
        if (prev <= 4) {
          soundManager.playTick(true);
        }

        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLimit, currentTurn, winner, gameMode, peerConn]);

  // 音声ON/OFF
  const handleToggleSound = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    soundManager.setMuted(nextMuted);
  };

  // ルール変更
  const handleSelectRule = (rule: SpecialRule) => {
    setSpecialRule(rule);
    handleResetGame();
    if (gameMode === 'online' && peerConn.isConnected) {
      peerConn.sendMessage({
        type: 'sync_settings',
        payload: { rule, limit: timeLimit },
      });
    }
  };

  // タイマー変更
  const handleSetTimeLimit = (seconds: number | null) => {
    setTimeLimit(seconds);
    setTimeLeft(seconds);
    if (gameMode === 'online' && peerConn.isConnected) {
      peerConn.sendMessage({
        type: 'sync_settings',
        payload: { rule: specialRule, limit: seconds },
      });
    }
  };

  // スキル発動モード開始
  const handleActivateSkill = (skill: SkillType) => {
    if (skill === 'double') {
      // 連打スキル
      soundManager.playSkill();
      setIsDoubleMoveActive(true);
      if (currentTurn === 'black') {
        setBlackSkills((prev) => ({ ...prev, double: false }));
      } else {
        setWhiteSkills((prev) => ({ ...prev, double: false }));
      }
      setActiveSkillMode(null);
    } else {
      setActiveSkillMode(skill);
    }
  };

  // 相手の石をクリックしてスキル実行（反転または破壊）
  const handleStoneSkillClick = (row: number, col: number) => {
    if (!activeSkillMode) return;
    const targetPlayer = board[row][col];
    if (!targetPlayer || targetPlayer === currentTurn) return;

    soundManager.playSkill();

    const newBoard = board.map((r) => [...r]);

    if (activeSkillMode === 'flip') {
      newBoard[row][col] = currentTurn;
      if (currentTurn === 'black') {
        setBlackSkills((prev) => ({ ...prev, flip: false }));
      } else {
        setWhiteSkills((prev) => ({ ...prev, flip: false }));
      }
    } else if (activeSkillMode === 'destroy') {
      newBoard[row][col] = null;
      if (currentTurn === 'black') {
        setBlackSkills((prev) => ({ ...prev, destroy: false }));
      } else {
        setWhiteSkills((prev) => ({ ...prev, destroy: false }));
      }
    }

    setBoard(newBoard);
    setActiveSkillMode(null);

    // 反転や破壊による勝利判定
    const globalWin = checkGlobalWin(newBoard, winTarget);
    if (globalWin) {
      setWinner(globalWin.winner);
      setWinningLine(globalWin.winningLine);
      soundManager.playWin();
      return;
    }

    // 手番交代
    const nextTurn = currentTurn === 'black' ? 'white' : 'black';
    setCurrentTurn(nextTurn);
    setTimeLeft(timeLimit);
  };

  // 地雷爆発処理 (周囲3×3を消滅)
  const triggerMineExplosion = (row: number, col: number, newBoard: BoardState) => {
    soundManager.playExplosion();
    setRevealedMines((prev) => [...prev, { row, col }]);

    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        const nr = row + dr;
        const nc = col + dc;
        if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE) {
          newBoard[nr][nc] = null;
        }
      }
    }
  };

  // 石を打つ処理
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

    // 1. 地雷五目並べの判定
    const hitMine = specialRule === 'minefield' && mines.some((m) => m.row === row && m.col === col);
    if (hitMine) {
      triggerMineExplosion(row, col, newBoard);
      setBoard(newBoard);
      setMoveHistory((prev) => [...prev, { row, col, player }]);

      // 地雷を踏んだ場合は手番が相手に移る
      const nextTurn = player === 'black' ? 'white' : 'black';
      setCurrentTurn(nextTurn);
      setTimeLeft(timeLimit);
      return;
    }

    // 2. 消える五目並べの判定（最大6個）
    if (specialRule === 'disappearing') {
      if (player === 'black') {
        const updated = [...blackStones, { row, col }];
        if (updated.length > 6) {
          const oldest = updated.shift()!;
          newBoard[oldest.row][oldest.col] = null;
        }
        setBlackStones(updated);
      } else {
        const updated = [...whiteStones, { row, col }];
        if (updated.length > 6) {
          const oldest = updated.shift()!;
          newBoard[oldest.row][oldest.col] = null;
        }
        setWhiteStones(updated);
      }
    }

    setBoard(newBoard);
    const newHistory = [...moveHistory, { row, col, player }];
    setMoveHistory(newHistory);
    soundManager.playStonePlacement();

    // オンライン送信
    if (gameMode === 'online') {
      peerConn.sendMessage({
        type: 'move',
        payload: { row, col, player },
      });
    }

    // 勝利判定
    const winResult = checkWin(newBoard, row, col, winTarget);
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

    // 3. 連打スキル中判定
    if (isDoubleMoveActive) {
      setIsDoubleMoveActive(false);
      // 同じプレイヤーがもう1手打てる（手番交代しない）
      setTimeLeft(timeLimit);
      return;
    }

    // 4. 六目並べ（Connect 6）判定
    // 初手（1手目、黒）は1手のみで手番交代。以降は2手ごとに交代
    if (specialRule === 'connect6') {
      if (moveHistory.length === 0) {
        // 初手黒1手終了 → 白の手番へ（2手待ち）
        setCurrentTurn('white');
        setConnect6MovesInTurn(0);
        setTimeLeft(timeLimit);
        triggerAIMoveIfNeeded(newBoard, 'white');
        return;
      } else if (connect6MovesInTurn === 0) {
        // 1手目完了 → 同プレイヤーの2手目待ちへ
        setConnect6MovesInTurn(1);
        setTimeLeft(timeLimit);
        if (gameMode === 'ai' && player === 'white') {
          triggerAIMoveIfNeeded(newBoard, 'white');
        }
        return;
      } else {
        // 2手目完了 → 相手の手番へ交代
        setConnect6MovesInTurn(0);
        const nextTurn = player === 'black' ? 'white' : 'black';
        setCurrentTurn(nextTurn);
        setTimeLeft(timeLimit);
        triggerAIMoveIfNeeded(newBoard, nextTurn);
        return;
      }
    }

    // 通常の手番交代
    const nextTurn = player === 'black' ? 'white' : 'black';
    setCurrentTurn(nextTurn);
    setTimeLeft(timeLimit);

    // CPUの着手
    triggerAIMoveIfNeeded(newBoard, nextTurn);
  };

  // CPU着手呼び出し
  const triggerAIMoveIfNeeded = (currentBoard: BoardState, nextTurn: Player) => {
    if (gameMode === 'ai' && nextTurn === 'white') {
      setIsAiThinking(true);
      setTimeout(() => {
        const aiMove = getAIMove(currentBoard, 'white', aiDifficulty);
        if (aiMove) {
          const updatedBoard = currentBoard.map((r) => [...r]);
          updatedBoard[aiMove.row][aiMove.col] = 'white';

          // 地雷判定
          if (specialRule === 'minefield' && mines.some((m) => m.row === aiMove.row && m.col === aiMove.col)) {
            triggerMineExplosion(aiMove.row, aiMove.col, updatedBoard);
            setBoard(updatedBoard);
            setMoveHistory((prev) => [...prev, { row: aiMove.row, col: aiMove.col, player: 'white' }]);
            setCurrentTurn('black');
            setTimeLeft(timeLimit);
            setIsAiThinking(false);
            return;
          }

          // 消える五目並べ判定
          if (specialRule === 'disappearing') {
            setWhiteStones((prev) => {
              const updated = [...prev, { row: aiMove.row, col: aiMove.col }];
              if (updated.length > 6) {
                const oldest = updated.shift()!;
                updatedBoard[oldest.row][oldest.col] = null;
              }
              return updated;
            });
          }

          setBoard(updatedBoard);
          setMoveHistory((prev) => [
            ...prev,
            { row: aiMove.row, col: aiMove.col, player: 'white' },
          ]);

          soundManager.playStonePlacement();

          const aiWin = checkWin(updatedBoard, aiMove.row, aiMove.col, winTarget);
          if (aiWin) {
            setWinner(aiWin.winner);
            setWinningLine(aiWin.winningLine);
            soundManager.playWin();
          } else if (isBoardFull(updatedBoard)) {
            setWinner('draw');
          } else {
            // 六目並べのCPU2手目処理
            if (specialRule === 'connect6' && connect6MovesInTurn === 0 && moveHistory.length > 0) {
              setConnect6MovesInTurn(1);
              triggerAIMoveIfNeeded(updatedBoard, 'white');
              return;
            } else {
              setConnect6MovesInTurn(0);
              setCurrentTurn('black');
              setTimeLeft(timeLimit);
            }
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

  // 待ったボタン
  const handleUndo = () => {
    if (moveHistory.length === 0 || winner) return;
    if (gameMode === 'local') {
      const steps = 1;
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
    } else if (gameMode === 'ai') {
      const steps = moveHistory.length >= 2 ? 2 : 1;
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
      setIsAiThinking(false);
    } else if (gameMode === 'online') {
      if (peerConn.isConnected) {
        alert('対戦相手に「待った」の要請を送信しました。');
        peerConn.sendMessage({ type: 'undo_request' });
      }
    }
  };

  // 投了
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

  const isMyTurn =
    gameMode === 'local'
      ? true
      : gameMode === 'ai'
      ? currentTurn === 'black' && !isAiThinking
      : peerConn.isConnected &&
        ((peerConn.isHost && currentTurn === 'black') || (!peerConn.isHost && currentTurn === 'white'));

  const lastMove = moveHistory.length > 0 ? moveHistory[moveHistory.length - 1] : null;

  return (
    <div className="min-h-screen bg-[#141414] text-zinc-100 flex flex-col justify-between py-2 sm:py-4 px-2 sm:px-4">
      {/* 上部ヘッダー */}
      <GameHeader
        gameMode={gameMode}
        onSelectMode={(mode) => {
          setGameMode(mode);
          handleResetGame();
        }}
        aiDifficulty={aiDifficulty}
        onSelectAIDifficulty={setAiDifficulty}
        specialRule={specialRule}
        currentTurn={currentTurn}
        myColor={gameMode === 'online' ? (peerConn.isHost ? 'black' : 'white') : null}
        moveCount={moveHistory.length}
        isMuted={isMuted}
        onToggleSound={handleToggleSound}
        onOpenRules={() => setIsRulesModalOpen(true)}
        onOpenOnlineModal={() => setIsOnlineModalOpen(true)}
        isOnlineConnected={peerConn.isConnected}
        timeLeft={timeLeft}
        maxTimeLimit={timeLimit}
        connect6Step={connect6MovesInTurn + 1}
      />

      {/* 特殊ルール選択バー */}
      <SpecialRuleSelector
        specialRule={specialRule}
        onSelectRule={handleSelectRule}
        timeLimit={timeLimit}
        onSetTimeLimit={handleSetTimeLimit}
        disabled={moveHistory.length > 0}
      />

      {/* スキル発動バー（スキル五目並べ時のみ表示） */}
      {specialRule === 'skill' && (
        <SkillBar
          skills={currentTurn === 'black' ? blackSkills : whiteSkills}
          activeSkillMode={activeSkillMode}
          onActivateSkill={handleActivateSkill}
          onCancelSkill={() => setActiveSkillMode(null)}
          disabled={!isMyTurn || Boolean(winner)}
        />
      )}

      {/* メイン盤面 */}
      <main className="my-auto py-2 sm:py-3 w-full flex flex-col items-center justify-center">
        <Board
          board={board}
          lastMove={lastMove}
          winningLine={winningLine}
          currentTurn={currentTurn}
          isMyTurn={isMyTurn}
          disabled={Boolean(winner) || isAiThinking}
          specialRule={specialRule}
          blackStoneHistory={blackStones}
          whiteStoneHistory={whiteStones}
          revealedMines={revealedMines}
          activeSkillMode={activeSkillMode}
          onCellClick={handlePlaceStone}
          onStoneSkillClick={handleStoneSkillClick}
        />
      </main>

      {/* 操作コントロール */}
      <Controls
        gameMode={gameMode}
        canUndo={moveHistory.length > 0 && !winner && !isAiThinking && specialRule === 'standard'}
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

      {/* フッター */}
      <footer className="text-center text-[11px] text-zinc-500 py-1">
        五目並べ Online &copy; {new Date().getFullYear()} - 完全無料・登録不要
      </footer>

      {/* 各種モーダル */}
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
