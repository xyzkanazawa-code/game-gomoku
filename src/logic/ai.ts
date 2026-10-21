import type { BoardState, AIDifficulty, Player, Position } from '../types/game';
import { BOARD_SIZE, checkWin } from './gomoku';

const DIRECTIONS: [number, number][] = [
  [0, 1],   // 横
  [1, 0],   // 縦
  [1, 1],   // 右下
  [1, -1],  // 左下
];

// パターンスコア
const SCORES = {
  WIN: 1000000,       // 5連
  OPEN_FOUR: 50000,   // 活四 (両端空き)
  BLOCKED_FOUR: 5000, // 眠四 (片端空き)
  OPEN_THREE: 4000,   // 活三
  BLOCKED_THREE: 500, // 眠三
  OPEN_TWO: 200,      // 活二
  BLOCKED_TWO: 20,    // 眠二
};

/**
 * 指定位置に石を置いた場合の特定方向のパターンスコアを計算
 */
const evaluateDirection = (
  board: BoardState,
  row: number,
  col: number,
  dr: number,
  dc: number,
  player: Player
): number => {
  let count = 1;
  let openEnds = 0;

  // 正方向
  let r = row + dr;
  let c = col + dc;
  while (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && board[r][c] === player) {
    count++;
    r += dr;
    c += dc;
  }
  if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && board[r][c] === null) {
    openEnds++;
  }

  // 逆方向
  r = row - dr;
  c = col - dc;
  while (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && board[r][c] === player) {
    count++;
    r -= dr;
    c -= dc;
  }
  if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && board[r][c] === null) {
    openEnds++;
  }

  if (count >= 5) return SCORES.WIN;
  if (count === 4) {
    if (openEnds === 2) return SCORES.OPEN_FOUR;
    if (openEnds === 1) return SCORES.BLOCKED_FOUR;
  }
  if (count === 3) {
    if (openEnds === 2) return SCORES.OPEN_THREE;
    if (openEnds === 1) return SCORES.BLOCKED_THREE;
  }
  if (count === 2) {
    if (openEnds === 2) return SCORES.OPEN_TWO;
    if (openEnds === 1) return SCORES.BLOCKED_TWO;
  }
  return 0;
};

/**
 * 指定位置の総合スコアを計算（攻撃スコア + 防御スコア）
 */
const evaluatePosition = (
  board: BoardState,
  row: number,
  col: number,
  aiPlayer: Player,
  opponentPlayer: Player,
  defenseWeight: number
): number => {
  let attackScore = 0;
  let defenseScore = 0;

  for (const [dr, dc] of DIRECTIONS) {
    attackScore += evaluateDirection(board, row, col, dr, dc, aiPlayer);
    defenseScore += evaluateDirection(board, row, col, dr, dc, opponentPlayer);
  }

  // 盤面中央に近いほど僅かにボーナス（初手・序盤の戦略性）
  const centerDist = Math.abs(row - 7) + Math.abs(col - 7);
  const centerBonus = Math.max(0, 14 - centerDist);

  return attackScore + defenseScore * defenseWeight + centerBonus;
};

/**
 * 既存の石の周辺（探索候補）を取得
 */
const getCandidateMoves = (board: BoardState, distance: number = 2): Position[] => {
  const candidates: Position[] = [];
  const visited = Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(false));

  let hasStone = false;
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (board[r][c] !== null) {
        hasStone = true;
        // 周辺の空マスをマーク
        for (let dr = -distance; dr <= distance; dr++) {
          for (let dc = -distance; dc <= distance; dc++) {
            const nr = r + dr;
            const nc = c + dc;
            if (
              nr >= 0 &&
              nr < BOARD_SIZE &&
              nc >= 0 &&
              nc < BOARD_SIZE &&
              board[nr][nc] === null &&
              !visited[nr][nc]
            ) {
              visited[nr][nc] = true;
              candidates.push({ row: nr, col: nc });
            }
          }
        }
      }
    }
  }

  // まだ石が1つもなければ天元（中央 7, 7）
  if (!hasStone) {
    return [{ row: 7, col: 7 }];
  }

  return candidates;
};

/**
 * CPUの次の一手を決定する
 */
export const getAIMove = (
  board: BoardState,
  aiPlayer: Player,
  difficulty: AIDifficulty
): Position | null => {
  const opponent: Player = aiPlayer === 'black' ? 'white' : 'black';
  const candidates = getCandidateMoves(board, difficulty === 'easy' ? 1 : 2);

  if (candidates.length === 0) {
    // 盤面空きマスからランダム
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        if (board[r][c] === null) return { row: r, col: c };
      }
    }
    return null;
  }

  // 初級（Easy）：ランダム性が高く、たまに勝利や即座の防御を見逃す
  if (difficulty === 'easy') {
    // 即座に勝てる手があれば打つ
    for (const pos of candidates) {
      board[pos.row][pos.col] = aiPlayer;
      const win = checkWin(board, pos.row, pos.col);
      board[pos.row][pos.col] = null;
      if (win) return pos;
    }
    // 70%の確率で単純にランダム
    if (Math.random() < 0.6) {
      return candidates[Math.floor(Math.random() * candidates.length)];
    }
  }

  // 中級（Medium）：防御重視のスコアリング
  // 上級（Hard）：先手取り重視、攻防高精度スコアリング
  const defenseWeight = difficulty === 'hard' ? 1.2 : 0.9;

  let bestMove: Position = candidates[0];
  let maxScore = -1;

  for (const pos of candidates) {
    // 自身が勝てるなら最優先
    board[pos.row][pos.col] = aiPlayer;
    const canWin = checkWin(board, pos.row, pos.col);
    board[pos.row][pos.col] = null;
    if (canWin) return pos;

    // 相手が次に勝てる手があれば絶対に阻止
    board[pos.row][pos.col] = opponent;
    const opponentCanWin = checkWin(board, pos.row, pos.col);
    board[pos.row][pos.col] = null;
    if (opponentCanWin) {
      return pos;
    }

    const score = evaluatePosition(board, pos.row, pos.col, aiPlayer, opponent, defenseWeight);

    // 同点時の揺らぎのために微小な乱数を付加
    const randomizedScore = score + Math.random() * 5;

    if (randomizedScore > maxScore) {
      maxScore = randomizedScore;
      bestMove = pos;
    }
  }

  return bestMove;
};
