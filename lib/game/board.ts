import { BoardCell } from '@/types';

/**
 * Generate the spiral board layout (0-99)
 * Starting at center (0), spiraling outward clockwise
 * 
 * Pattern:
 * 72 71 70 69 68 67 66 65 64 63
 * 73 42 41 40 39 38 37 36 35 62
 * 74 43 20 19 18 17 16 15 34 61
 * 75 44 21  6  5  4  3 14 33 60
 * 76 45 22  7  0  1  2 13 32 59
 * 77 46 23  8  9 10 11 12 31 58
 * 78 47 24 25 26 27 28 29 30 57
 * 79 48 49 50 51 52 53 54 55 56
 * 80 81 82 83 84 85 86 87 88 89
 * 90 91 92 93 94 95 96 97 98 99
 */
export function generateSpiralBoard(): BoardCell[][] {
  const size = 10;
  const board: BoardCell[][] = Array(size).fill(null).map(() => 
    Array(size).fill(null)
  );

  // Start at center
  let row = 4;
  let col = 4;
  let num = 0;

  // Place center (0)
  board[row][col] = {
    number: num,
    chip: null,
    position: { row, col }
  };

  num++;

  // Direction vectors: right, down, left, up
  const directions = [
    { dr: 0, dc: 1 },   // right
    { dr: 1, dc: 0 },   // down
    { dr: 0, dc: -1 },  // left
    { dr: -1, dc: 0 }   // up
  ];

  let dirIndex = 0; // start going right
  let stepsInDirection = 1;
  let stepsTaken = 0;
  let timesDirectionChanged = 0;

  while (num < 100) {
    const { dr, dc } = directions[dirIndex];
    
    row += dr;
    col += dc;
    
    // Place number at this position
    board[row][col] = {
      number: num,
      chip: null,
      position: { row, col }
    };
    
    num++;
    stepsTaken++;

    // Check if we need to change direction
    if (stepsTaken === stepsInDirection) {
      stepsTaken = 0;
      dirIndex = (dirIndex + 1) % 4; // rotate direction
      timesDirectionChanged++;

      // After every 2 direction changes, increase step count
      if (timesDirectionChanged % 2 === 0) {
        stepsInDirection++;
      }
    }
  }

  return board;
}

/**
 * Get a cell by its number value (0-99)
 */
export function getCellByNumber(board: BoardCell[][], number: number): BoardCell | null {
  for (let row = 0; row < board.length; row++) {
    for (let col = 0; col < board[row].length; col++) {
      if (board[row][col].number === number) {
        return board[row][col];
      }
    }
  }
  return null;
}

/**
 * Check if a cell is occupied
 */
export function isCellOccupied(board: BoardCell[][], number: number): boolean {
  const cell = getCellByNumber(board, number);
  return cell ? cell.chip !== null : false;
}