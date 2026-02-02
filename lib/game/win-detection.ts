import { BoardCell, WinningLine, PlayerId } from '@/types';

/**
 * Check if a player has won (5 in a row)
 */
export function checkWinner(
  board: BoardCell[][],
  winLength: number = 5
): { winner: PlayerId | null; winningLine: WinningLine | null } {
  // Check all directions
  const horizontalWin = checkHorizontal(board, winLength);
  if (horizontalWin) return horizontalWin;

  const verticalWin = checkVertical(board, winLength);
  if (verticalWin) return verticalWin;

  const diagonalWin = checkDiagonals(board, winLength);
  if (diagonalWin) return diagonalWin;

  return { winner: null, winningLine: null };
}

/**
 * Check horizontal lines
 */
function checkHorizontal(
  board: BoardCell[][],
  winLength: number
): { winner: PlayerId; winningLine: WinningLine } | null {
  for (let row = 0; row < board.length; row++) {
    for (let col = 0; col <= board[row].length - winLength; col++) {
      const line = board[row].slice(col, col + winLength);
      const winner = checkLine(line);
      
      if (winner) {
        return {
          winner,
          winningLine: { cells: line, direction: 'horizontal' }
        };
      }
    }
  }
  return null;
}

/**
 * Check vertical lines
 */
function checkVertical(
  board: BoardCell[][],
  winLength: number
): { winner: PlayerId; winningLine: WinningLine } | null {
  for (let col = 0; col < board[0].length; col++) {
    for (let row = 0; row <= board.length - winLength; row++) {
      const line: BoardCell[] = [];
      for (let i = 0; i < winLength; i++) {
        line.push(board[row + i][col]);
      }
      
      const winner = checkLine(line);
      if (winner) {
        return {
          winner,
          winningLine: { cells: line, direction: 'vertical' }
        };
      }
    }
  }
  return null;
}

/**
 * Check diagonal lines (both directions)
 */
function checkDiagonals(
  board: BoardCell[][],
  winLength: number
): { winner: PlayerId; winningLine: WinningLine } | null {
  // Check top-left to bottom-right diagonals
  for (let row = 0; row <= board.length - winLength; row++) {
    for (let col = 0; col <= board[0].length - winLength; col++) {
      const line: BoardCell[] = [];
      for (let i = 0; i < winLength; i++) {
        line.push(board[row + i][col + i]);
      }
      
      const winner = checkLine(line);
      if (winner) {
        return {
          winner,
          winningLine: { cells: line, direction: 'diagonal' }
        };
      }
    }
  }

  // Check top-right to bottom-left diagonals
  for (let row = 0; row <= board.length - winLength; row++) {
    for (let col = winLength - 1; col < board[0].length; col++) {
      const line: BoardCell[] = [];
      for (let i = 0; i < winLength; i++) {
        line.push(board[row + i][col - i]);
      }
      
      const winner = checkLine(line);
      if (winner) {
        return {
          winner,
          winningLine: { cells: line, direction: 'diagonal' }
        };
      }
    }
  }

  return null;
}

/**
 * Check if a line of cells belongs to the same player
 */
function checkLine(cells: BoardCell[]): PlayerId | null {
  // All cells must have chips
  if (cells.some(cell => !cell.chip)) {
    return null;
  }

  // All chips must belong to the same player
  const firstPlayerId = cells[0].chip!.playerId;
  const allSamePlayer = cells.every(cell => cell.chip?.playerId === firstPlayerId);

  return allSamePlayer ? firstPlayerId : null;
}

/**
 * Highlight winning line (helper for UI)
 */
export function getWinningCellNumbers(winningLine: WinningLine | null): number[] {
  if (!winningLine) return [];
  return winningLine.cells.map(cell => cell.number);
}