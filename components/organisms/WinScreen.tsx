"use client";
import { Button } from "@/components/atoms/Button";
import { Chip } from "@/components/atoms/Chip";
import { GameBoard } from "./GameBoard";
import type { Player, BoardCell } from "@/types/game";

interface WinScreenProps {
  winner: Player;
  board: BoardCell[][];
  winningCells: number[];
  isWinner: boolean;
  onPlayAgain: () => void;
  onNewGame: () => void;
  teamMembers?: Player[];
}

export function WinScreen({
  winner,
  board,
  winningCells,
  isWinner,
  onPlayAgain,
  onNewGame,
  teamMembers,
}: WinScreenProps) {
  const winnerColor = `var(--chip-${winner.color})`;
  const isTeamWin = teamMembers && teamMembers.length > 1;
  const winLabel = isTeamWin
    ? `${teamMembers.map((p) => p.name).join(" & ")} win!`
    : `${winner.name} wins!`;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
      <div className="mb-8 animate-fade-in">
        <div
          className="flex items-center justify-center gap-4 p-6 bg-wood-light rounded-xl mb-4 border-4"
          style={{ borderColor: winnerColor }}
        >
          <Chip color={winner.color} size="lg" />
          <span className="font-[family-name:var(--font-fraunces)] text-2xl font-medium">
            {winLabel}
          </span>
        </div>

        <p className="text-brown-light text-sm">5 in a row</p>
      </div>

      <div className="max-w-[300px] w-full mb-8 opacity-80">
        <GameBoard
          board={board}
          winningCells={winningCells}
          winningColor={winnerColor}
          disabled
        />
      </div>

      <div className="flex flex-col gap-2 w-full max-w-[280px]">
        <Button
          onClick={onPlayAgain}
          variant={null as any}
          className="bg-cream border-2 px-6 py-4 text-base rounded-lg"
          style={{
            backgroundColor: winnerColor,
            borderColor: winnerColor,
            color: "var(--brown)",
          }}
        >
          Play Again
        </Button>
        <Button variant="secondary" onClick={onNewGame}>
          New Game
        </Button>
      </div>
    </div>
  );
}
