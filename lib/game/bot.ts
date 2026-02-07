import type { Card, BoardCell, GameSettings, TurnAction, ChipColor } from '@/types';
import { getValidPlacements } from './validation';

export interface BotMove {
  action: TurnAction;
  cardId?: string;
  targetNumber?: number;
}

export const BOT_NAMES = [
  'Botsworth',
  'Chippy',
  'Quinta-Bot',
  'AutoPlay',
  'Robo',
  'Circuit',
];

export function generateBotId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 9);
  return `bot-${timestamp}-${random}`;
}

export function isBotPlayer(player: { isBot?: boolean }): boolean {
  return player.isBot === true;
}

/**
 * Score a board position for the bot.
 * Evaluates all lines of winLength passing through (row, col).
 * Higher score = better move (building own lines + blocking opponents).
 */
function scorePosition(
  board: BoardCell[][],
  row: number,
  col: number,
  botColor: ChipColor,
  winLength: number,
): number {
  let score = 0;
  const size = board.length;

  // 4 line directions: horizontal, vertical, both diagonals
  const directions: [number, number][] = [
    [0, 1],   // horizontal
    [1, 0],   // vertical
    [1, 1],   // diagonal ↘
    [1, -1],  // diagonal ↙
  ];

  for (const [dr, dc] of directions) {
    // Check every window of winLength cells that includes (row, col)
    for (let offset = 0; offset < winLength; offset++) {
      const startRow = row - offset * dr;
      const startCol = col - offset * dc;

      let friendlyCount = 0;
      let enemyCount = 0;
      let enemyColor: ChipColor | null = null;
      let mixedEnemy = false;
      let valid = true;

      for (let i = 0; i < winLength; i++) {
        const r = startRow + i * dr;
        const c = startCol + i * dc;

        if (r < 0 || r >= size || c < 0 || c >= size) {
          valid = false;
          break;
        }

        const cell = board[r][c];
        if (!cell.chip) {
          // empty cell
        } else if (cell.chip.color === botColor) {
          friendlyCount++;
        } else {
          // Track enemy chips — only a threat if all the same color
          if (enemyColor === null) {
            enemyColor = cell.chip.color;
            enemyCount++;
          } else if (cell.chip.color === enemyColor) {
            enemyCount++;
          } else {
            mixedEnemy = true;
          }
        }
      }

      if (!valid || mixedEnemy) continue;

      // Line with both friendly and enemy chips is dead for both sides
      if (friendlyCount > 0 && enemyCount > 0) continue;

      if (friendlyCount > 0) {
        // Offensive: building toward a win
        if (friendlyCount === winLength - 1) {
          score += 10000; // winning move
        } else if (friendlyCount === winLength - 2) {
          score += 100;
        } else {
          score += friendlyCount * 3;
        }
      } else if (enemyCount > 0) {
        // Defensive: blocking an opponent's line
        if (enemyCount === winLength - 1) {
          score += 5000; // must block
        } else if (enemyCount === winLength - 2) {
          score += 50;
        } else {
          score += enemyCount * 2;
        }
      } else {
        // Empty line — slight potential
        score += 1;
      }
    }
  }

  return score;
}

/**
 * Build a lookup from cell number to (row, col) position.
 */
function buildCellPositionMap(board: BoardCell[][]): Map<number, { row: number; col: number }> {
  const map = new Map<number, { row: number; col: number }>();
  for (let r = 0; r < board.length; r++) {
    for (let c = 0; c < board[r].length; c++) {
      map.set(board[r][c].number, { row: r, col: c });
    }
  }
  return map;
}

/**
 * Choose the best move for a bot.
 * Scores each valid placement by board position (build lines, block opponents).
 * Natural moves get a bonus since they draw a replacement card.
 */
export function chooseBotMove(
  hand: Card[],
  board: BoardCell[][],
  settings: GameSettings,
  botColor: ChipColor,
): BotMove {
  const posMap = buildCellPositionMap(board);
  const winLength = settings.winLength;

  interface ScoredMove {
    action: TurnAction;
    cardId: string;
    targetNumber: number;
    score: number;
  }

  const scoredMoves: ScoredMove[] = [];

  for (const card of hand) {
    const placements = getValidPlacements(board, card, settings);

    for (const target of placements.natural) {
      const pos = posMap.get(target);
      if (!pos) continue;
      const posScore = scorePosition(board, pos.row, pos.col, botColor, winLength);
      scoredMoves.push({
        action: 'natural',
        cardId: card.id,
        targetNumber: target,
        score: posScore + 50, // bonus for drawing a replacement card
      });
    }

    for (const target of placements.higher) {
      const pos = posMap.get(target);
      if (!pos) continue;
      const posScore = scorePosition(board, pos.row, pos.col, botColor, winLength);
      scoredMoves.push({
        action: 'higher',
        cardId: card.id,
        targetNumber: target,
        score: posScore,
      });
    }
  }

  if (scoredMoves.length === 0) {
    return { action: 'pass' };
  }

  // Pick the best scoring move; break ties randomly for variety
  scoredMoves.sort((a, b) => b.score - a.score);
  const topScore = scoredMoves[0].score;
  const topMoves = scoredMoves.filter(m => m.score === topScore);
  const pick = topMoves[Math.floor(Math.random() * topMoves.length)];

  return {
    action: pick.action,
    cardId: pick.cardId,
    targetNumber: pick.targetNumber,
  };
}
