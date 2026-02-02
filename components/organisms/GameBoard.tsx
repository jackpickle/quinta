"use client";
import { BoardCell } from "@/components/atoms/BoardCell";
import type { BoardCell as BoardCellType, ChipColor } from "@/types/game";

interface GameBoardProps {
  board: BoardCellType[][];
  validMoves?: number[];
  winningCells?: number[];
  winningColor?: string;
  onCellClick?: (cellNumber: number) => void;
  disabled?: boolean;
}

export function GameBoard({
  board,
  validMoves = [],
  winningCells = [],
  winningColor,
  onCellClick,
  disabled,
}: GameBoardProps) {
  const flatBoard = board.flat();

  // Map color to CSS variable
  const borderColor = `var(--brown)`;

  return (
    <div
      className="grid grid-cols-10 gap-0.5 bg-wood p-0.5 shadow-lg border-4 w-full aspect-square max-w-[min(85vw,calc(100vh-180px),500px)] md:max-w-[min(85vw,calc(100vh-120px),500px)]"
      style={
        {
          "--tw-border-color": borderColor,
        } as React.CSSProperties
      }
    >
      {flatBoard.map((cell) => (
        <BoardCell
          key={cell.number}
          number={cell.number}
          chip={cell.chip}
          isValidMove={validMoves.includes(cell.number)}
          isWinning={winningCells.includes(cell.number)}
          onClick={() => onCellClick?.(cell.number)}
          disabled={disabled}
          winningColor={winningColor}
        />
      ))}
    </div>
  );
}
