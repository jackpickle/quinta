"use client";

import { Chip } from "@/components/atoms/Chip";
import type { ChipColor, BoardCell, Player } from "@/types/game";

interface ScoreDisplayProps {
  players: Player[];
  board: BoardCell[][];
}

export function ScoreDisplay({ players, board }: ScoreDisplayProps) {
  const teamsEnabled = players.some((p) => p.teamIndex !== undefined);

  if (teamsEnabled) {
    // Aggregate chip counts by color (team)
    const colorCounts: Record<string, number> = {};
    board.flat().forEach((cell) => {
      if (cell.chip) {
        colorCounts[cell.chip.color] = (colorCounts[cell.chip.color] || 0) + 1;
      }
    });

    // Get unique team colors (preserve order)
    const seenColors = new Set<ChipColor>();
    const teamEntries: { color: ChipColor; count: number }[] = [];
    for (const player of players) {
      if (!seenColors.has(player.color)) {
        seenColors.add(player.color);
        teamEntries.push({ color: player.color, count: colorCounts[player.color] || 0 });
      }
    }

    return (
      <div className="flex gap-2 md:gap-4">
        {teamEntries.map((entry) => (
          <div key={entry.color} className="flex items-center gap-1 text-xs">
            <Chip color={entry.color} size="xs" />
            <span className="font-medium">{entry.count}</span>
          </div>
        ))}
      </div>
    );
  }

  // FFA mode: count per player
  const chipCounts = players.reduce(
    (acc, player) => {
      acc[player.id] = 0;
      return acc;
    },
    {} as Record<string, number>
  );

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
