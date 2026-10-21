import React from 'react';
import type { BoardState, Player, Position, SpecialRule, SkillType } from '../types/game';
import { BOARD_SIZE } from '../logic/gomoku';

interface BoardProps {
  board: BoardState;
  lastMove: Position | null;
  winningLine: Position[] | null;
  currentTurn: Player;
  isMyTurn: boolean;
  disabled: boolean;
  specialRule: SpecialRule;
  blackStoneHistory: Position[];
  whiteStoneHistory: Position[];
  revealedMines: Position[];
  activeSkillMode: SkillType | null;
  onCellClick: (row: number, col: number) => void;
  onStoneSkillClick?: (row: number, col: number) => void;
}

const STAR_POINTS: [number, number][] = [
  [3, 3],
  [3, 11],
  [7, 7],
  [11, 3],
  [11, 11],
];

export const Board: React.FC<BoardProps> = ({
  board,
  lastMove,
  winningLine,
  currentTurn,
  isMyTurn,
  disabled,
  specialRule,
  blackStoneHistory,
  whiteStoneHistory,
  revealedMines,
  activeSkillMode,
  onCellClick,
  onStoneSkillClick,
}) => {
  const isWinningCell = (row: number, col: number) => {
    return winningLine?.some((p) => p.row === row && p.col === col) ?? false;
  };

  const isStarPoint = (row: number, col: number) => {
    return STAR_POINTS.some(([r, c]) => r === row && c === col);
  };

  const isRevealedMine = (row: number, col: number) => {
    return revealedMines.some((m) => m.row === row && m.col === col);
  };

  // 消える五目並べ: 各石が消えるまでのカウントダウン
  const getDisappearIndex = (row: number, col: number, player: Player): number | null => {
    if (specialRule !== 'disappearing') return null;
    const history = player === 'black' ? blackStoneHistory : whiteStoneHistory;
    const idx = history.findIndex((p) => p.row === row && p.col === col);
    if (idx === -1) return null;
    // idx === 0 の石が次に消える最古の石
    return idx + 1;
  };

  return (
    <div className="relative p-2.5 sm:p-5 rounded-2xl wood-board border-4 border-[#8f5d24] w-[min(94vw,560px)] aspect-square mx-auto select-none shadow-2xl flex items-center justify-center">
      {/* 盤面グリッド */}
      <div
        className="grid w-full h-full relative"
        style={{
          gridTemplateColumns: `repeat(${BOARD_SIZE}, 1fr)`,
          gridTemplateRows: `repeat(${BOARD_SIZE}, 1fr)`,
        }}
      >
        {Array.from({ length: BOARD_SIZE }).map((_, row) =>
          Array.from({ length: BOARD_SIZE }).map((_, col) => {
            const cell = board[row][col];
            const isLast = lastMove?.row === row && lastMove?.col === col;
            const isWin = isWinningCell(row, col);
            const isStar = isStarPoint(row, col);
            const isMine = isRevealedMine(row, col);

            const disappearIdx = cell ? getDisappearIndex(row, col, cell) : null;
            const isOldest = disappearIdx === 1 && (cell === 'black' ? blackStoneHistory.length >= 6 : whiteStoneHistory.length >= 6);

            const isSkillTargetable =
              activeSkillMode &&
              cell &&
              cell !== currentTurn &&
              (activeSkillMode === 'flip' || activeSkillMode === 'destroy');

            return (
              <div
                key={`${row}-${col}`}
                className={`relative flex items-center justify-center cursor-pointer group w-full h-full ${
                  isSkillTargetable ? 'ring-2 ring-rose-400 rounded-full animate-pulse' : ''
                }`}
                onClick={() => {
                  if (isSkillTargetable && onStoneSkillClick) {
                    onStoneSkillClick(row, col);
                  } else if (!cell && !disabled && isMyTurn) {
                    onCellClick(row, col);
                  }
                }}
              >
                {/* 盤面の格子線 */}
                <div
                  className={`absolute h-[1.5px] bg-[#613b16] pointer-events-none ${
                    col === 0
                      ? 'left-1/2 right-0'
                      : col === BOARD_SIZE - 1
                      ? 'left-0 right-1/2'
                      : 'left-0 right-0'
                  }`}
                />
                <div
                  className={`absolute w-[1.5px] bg-[#613b16] pointer-events-none ${
                    row === 0
                      ? 'top-1/2 bottom-0'
                      : row === BOARD_SIZE - 1
                      ? 'top-0 bottom-1/2'
                      : 'top-0 bottom-0'
                  }`}
                />

                {/* 星点 */}
                {isStar && !cell && !isMine && (
                  <div className="absolute w-2 h-2 rounded-full bg-[#522f0f] pointer-events-none z-0" />
                )}

                {/* 地雷爆発跡・地雷マーク */}
                {isMine && !cell && (
                  <div className="absolute w-4 h-4 rounded-full bg-rose-600/80 flex items-center justify-center text-[10px] pointer-events-none z-10 animate-bounce">
                    💥
                  </div>
                )}

                {/* ホバー時の半透明プレビュー */}
                {!cell && !disabled && isMyTurn && !activeSkillMode && (
                  <div
                    className={`absolute w-[84%] h-[84%] rounded-full opacity-0 group-hover:opacity-40 transition-opacity duration-150 pointer-events-none z-10 ${
                      currentTurn === 'black' ? 'bg-black' : 'bg-white shadow'
                    }`}
                  />
                )}

                {/* 碁石 */}
                {cell && (
                  <div
                    className={`relative w-[86%] h-[86%] rounded-full flex items-center justify-center z-10 transition-transform duration-200 ${
                      cell === 'black' ? 'stone-black' : 'stone-white'
                    } ${isWin ? 'scale-110 ring-4 ring-amber-400 animate-pulse' : 'scale-100'} ${
                      isOldest ? 'opacity-80 ring-2 ring-purple-400' : ''
                    }`}
                  >
                    {/* 消える五目並べの残り番号（最古の石に警告） */}
                    {disappearIdx !== null && (
                      <span
                        className={`text-[9px] font-extrabold pointer-events-none select-none ${
                          isOldest ? 'text-purple-400 animate-ping' : cell === 'black' ? 'text-zinc-500' : 'text-zinc-400'
                        }`}
                      >
                        {disappearIdx}
                      </span>
                    )}

                    {/* 直前の着手マーク */}
                    {isLast && !isWin && !disappearIdx && (
                      <div
                        className={`w-2 h-2 rounded-full ${
                          cell === 'black' ? 'bg-amber-400' : 'bg-rose-500'
                        }`}
                      />
                    )}

                    {/* 勝利ラインの強調マーク */}
                    {isWin && (
                      <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
