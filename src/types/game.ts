export type Player = 'black' | 'white';
export type Cell = Player | null;
export type BoardState = Cell[][];

export type GameMode = 'ai' | 'local' | 'online';
export type AIDifficulty = 'easy' | 'medium' | 'hard';

export type SpecialRule = 'standard' | 'disappearing' | 'connect6' | 'minefield' | 'skill';

export type SkillType = 'flip' | 'destroy' | 'double';

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
  type:
    | 'move'
    | 'reset_request'
    | 'reset_accept'
    | 'undo_request'
    | 'undo_accept'
    | 'surrender'
    | 'chat'
    | 'sync_settings'
    | 'skill_action'
    | 'timeout';
  payload?: any;
}

export interface ChatMessage {
  id: string;
  sender: 'self' | 'opponent' | 'system';
  text: string;
  timestamp: number;
}

export interface PlayerSkills {
  flip: boolean;    // 相手の石を自色に反転
  destroy: boolean; // 相手の石を1つ破壊
  double: boolean;  // 1ターンに2個置ける
}
