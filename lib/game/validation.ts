import { BoardCell, Card, GameSettings, TurnAction } from '@/types';
import { getCellByNumber, isCellOccupied } from './board';

/**
 * Check if a chip placement is valid based on action type and game settings
 */
export function isValidPlacement(
  board: BoardCell[][],
  card: Card,
  targetNumber: number,
  action: TurnAction,
  settings: GameSettings
): { valid: boolean; reason?: string } {
  
  // Can't place on a cell that doesn't exist
  const targetCell = getCellByNumber(board, targetNumber);
  if (!targetCell) {
    return { valid: false, reason: 'Cell does not exist' };
  }

  // Check if cell is occupied (unless override is allowed)
  const occupied = isCellOccupied(board, targetNumber);
  if (occupied && !settings.allowChipOverride) {
    return { valid: false, reason: 'Cell is already occupied' };
  }

  // Validate based on action type
  switch (action) {
    case 'natural':
      // Natural: card value must exactly match target number
      if (card.value !== targetNumber) {
        return { valid: false, reason: 'Natural play requires exact match' };
      }
      return { valid: true };

    case 'higher':
      // Higher: target number must be higher than card value
      if (targetNumber <= card.value) {
        return { valid: false, reason: 'Higher play requires target > card value' };
      }
      return { valid: true };

    case 'pass':
      // Pass means no placement, so this shouldn't be called
      return { valid: false, reason: 'Cannot validate placement for pass action' };

    default:
      return { valid: false, reason: 'Invalid action type' };
  }
}

/**
 * Get all valid placement options for a given card
 */
export function getValidPlacements(
  board: BoardCell[][],
  card: Card,
  settings: GameSettings
): { natural: number[]; higher: number[] } {
  const natural: number[] = [];
  const higher: number[] = [];

  for (let num = 0; num < 100; num++) {
    const cell = getCellByNumber(board, num);
    if (!cell) continue;

    const occupied = isCellOccupied(board, num);
    
    // Skip occupied cells unless override is allowed
    if (occupied && !settings.allowChipOverride) {
      continue;
    }

    // Check Natural placement
    if (num === card.value) {
      natural.push(num);
    }

    // Check Higher placement
    if (num > card.value) {
      higher.push(num);
    }
  }

  return { natural, higher };
}

/**
 * Check if a player has any valid moves
 */
export function hasValidMoves(
  board: BoardCell[][],
  hand: Card[],
  settings: GameSettings
): boolean {
  // Player can always pass
  if (hand.length === 0) {
    return false; // No cards = no moves (not even pass helps)
  }

  // Check if any card has valid placements
  for (const card of hand) {
    const placements = getValidPlacements(board, card, settings);
    if (placements.natural.length > 0 || placements.higher.length > 0) {
      return true;
    }
  }

  return false;
}