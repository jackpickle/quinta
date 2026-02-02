"use client";

import { Chip } from "@/components/atoms/Chip";
import type { ChipColor, BoardCell, Player } from "@/types/game";

interface ScoreDisplayProps {
  players: Player[];
  board: BoardCell[][];
}

export function ScoreDisplay({ players, board }: ScoreDisplayProps) {
  // Count chips for each player
  const chipCounts = players.reduce(
    (acc, player) => {
      acc[player.id] = 0;
      return acc;
    },
    {} as Record<string, number>
  );

  // Flatten board and count chips
  board.flat().forEach((cell) => {
    if (cell.chip) {
      chipCounts[cell.chip.playerId]++;
    }
  });

  return (
    <div className="flex gap-2 md:gap-4">
      {players.map((player) => (
        <div key={player.id} className="flex items-center gap-1 text-xs">
          <Chip color={player.color} size="xs" />
          <span className="font-medium">{chipCounts[player.id]}</span>
        </div>
      ))}
    </div>
  );
}
