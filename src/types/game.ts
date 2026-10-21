export type Player = 'black' | 'white';
export type Cell = Player | null;
export type BoardState = Cell[][];

export type GameMode = 'local' | 'ai' | 'online';
export type AIDifficulty = 'easy' | 'medium' | 'hard';

export interface Position {
  row: number;
  col: number;
}

export interface MoveRecord {
  row: number;
  col: number;
  player: Player;
}

export interface WinResult {
  winner: Player;
  winningLine: Position[];
}

export interface PeerMessage {
  type: 'move' | 'reset_request' | 'reset_accept' | 'undo_request' | 'undo_accept' | 'surrender' | 'chat';
  payload?: any;
}

export interface ChatMessage {
  id: string;
  sender: 'self' | 'opponent' | 'system';
  text: string;
  timestamp: number;
}
