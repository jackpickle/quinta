// ===========================
// Core Game Types
// ===========================

export type ChipColor = 
  | 'coral'
  | 'mint'
  | 'sky'
  | 'peach'
  | 'lavender'
  | 'yellow';

export type PlayerId = string; // unique identifier for each player

export interface Player {
  id: PlayerId;
  name: string;
  color: ChipColor;
  hand: Card[];
  isHost: boolean;
}

export interface Card {
  value: number; // 0-99
  id: string; // unique card identifier
}

export interface Chip {
  playerId: PlayerId;
  color: ChipColor;
}

export interface BoardCell {
  number: number; // 0-99
  chip: Chip | null;
  position: { row: number; col: number }; // grid coordinates
}

// ===========================
// Game State
// ===========================

export type GameStatus = 
  | 'waiting'  // in lobby
  | 'playing'  // game in progress
  | 'finished'; // game over

export type TurnAction =
  | 'natural'  // place on exact match, draw card
  | 'higher'   // place on higher number, no draw
  | 'pass';    // skip placement, draw card

export type BoardPattern = 'spiral' | 'snake' | 'normal';

export interface GameSettings {
  allowChipOverride: boolean; // can place on occupied spaces?
  deckSize: number; // 100 or 200
  cardsPerNumber: number; // 1, 2, or 3
  handSize: number; // 3-7
  winLength: number; // 4, 5, or 6
  drawOnHigher: boolean; // draw card after Higher play?
  maxPlayers: number; // 2-6
  boardPattern: BoardPattern; // spiral, snake, or normal
}

export interface GameState {
  roomId: string;
  status: GameStatus;
  settings: GameSettings;
  board: BoardCell[][]; // 10x10 grid
  players: Player[];
  currentPlayerIndex: number;
  deck: Card[];
  discardPile: Card[];
  winner: PlayerId | null;
  createdAt: number; // timestamp
  turnHistory?: TurnHistoryEntry[]; // optional for backwards compatibility
}

// ===========================
// Game Actions
// ===========================

export interface PlaceChipAction {
  type: 'place_chip';
  playerId: PlayerId;
  cardId: string;
  cellNumber: number;
  action: TurnAction;
}

export interface PassAction {
  type: 'pass';
  playerId: PlayerId;
}

export type GameAction = PlaceChipAction | PassAction;

// ===========================
// Utility Types
// ===========================

export interface WinningLine {
  cells: BoardCell[];
  direction: 'horizontal' | 'vertical' | 'diagonal';
}

export interface TurnHistoryEntry {
  playerId: PlayerId;
  playerName: string;
  playerColor: ChipColor;
  action: TurnAction;
  cardValue?: number;    // The card played (if not pass)
  cellNumber?: number;   // Where they placed (if not pass)
  timestamp: number;
}

export interface RoomCode {
  code: string;
  expiresAt: number;
}