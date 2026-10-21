import type { BoardState, Position, WinResult } from '../types/game';

export const BOARD_SIZE = 15;

export const createEmptyBoard = (): BoardState => {
  return Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(null));
};

const DIRECTIONS: [number, number][] = [
  [0, 1],   // 横 (右)
  [1, 0],   // 縦 (下)
  [1, 1],   // 斜め (右下)
  [1, -1],  // 斜め (左下)
];

/**
 * 着手位置を起点に勝利判定を行う
 * @param targetCount 勝利に必要な連続数（通常5、六目並べは6）
 */
export const checkWin = (
  board: BoardState,
  lastRow: number,
  lastCol: number,
  targetCount: number = 5
): WinResult | null => {
  const player = board[lastRow][lastCol];
  if (!player) return null;

  for (const [dr, dc] of DIRECTIONS) {
    const line: Position[] = [{ row: lastRow, col: lastCol }];

    // 正方向
    let r = lastRow + dr;
    let c = lastCol + dc;
    while (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && board[r][c] === player) {
      line.push({ row: r, col: c });
      r += dr;
      c += dc;
    }

    // 逆方向
    r = lastRow - dr;
    c = lastCol - dc;
    while (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && board[r][c] === player) {
      line.unshift({ row: r, col: c });
      r -= dr;
      c -= dc;
    }

    if (line.length >= targetCount) {
      return {
        winner: player,
        winningLine: line,
      };
    }
  }

  return null;
};

/**
 * 盤面全体を検査して勝利ラインがあるか判定する（スキル等で石が変化した際用）
 */
export const checkGlobalWin = (board: BoardState, targetCount: number = 5): WinResult | null => {
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (board[r][c] !== null) {
        const res = checkWin(board, r, c, targetCount);
        if (res) return res;
      }
    }
  }
  return null;
};

/**
 * 盤面が満杯（引き分け）か判定
 */
export const isBoardFull = (board: BoardState): boolean => {
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (board[r][c] === null) return false;
    }
  }
  return true;
};
