import type { BoardState, Position, WinResult } from '../types/game';

export const BOARD_SIZE = 15;

export const createEmptyBoard = (): BoardState => {
  return Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(null));
};

// 方向ベクトル: [行方向, 列方向]
const DIRECTIONS: [number, number][] = [
  [0, 1],   // 横 (右)
  [1, 0],   // 縦 (下)
  [1, 1],   // 斜め (右下)
  [1, -1],  // 斜め (左下)
];

/**
 * 着手後に勝利（5連以上）があるかどうか判定する
 */
export const checkWin = (board: BoardState, lastRow: number, lastCol: number): WinResult | null => {
  const player = board[lastRow][lastCol];
  if (!player) return null;

  for (const [dr, dc] of DIRECTIONS) {
    const line: Position[] = [{ row: lastRow, col: lastCol }];

    // 正方向を調べる
    let r = lastRow + dr;
    let c = lastCol + dc;
    while (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && board[r][c] === player) {
      line.push({ row: r, col: c });
      r += dr;
      c += dc;
    }

    // 逆方向を調べる
    r = lastRow - dr;
    c = lastCol - dc;
    while (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && board[r][c] === player) {
      line.unshift({ row: r, col: c });
      r -= dr;
      c -= dc;
    }

    // 5個以上並んでいる場合は勝利
    if (line.length >= 5) {
      return {
        winner: player,
        winningLine: line,
      };
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
