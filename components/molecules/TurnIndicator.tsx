"use client";

import { Chip } from "@/components/atoms/Chip";
import type { ChipColor } from "@/types/game";

interface TurnIndicatorProps {
  playerName: string;
  playerColor: ChipColor;
  isMyTurn: boolean;
  actionHint?: string;
}

export function TurnIndicator({
  playerName,
  playerColor,
  isMyTurn,
  actionHint,
}: TurnIndicatorProps) {
  // Show "Your turn" on mobile if it's your turn, otherwise truncate name
  const displayText = isMyTurn ? "Your turn" : `${playerName}'s turn`;

  return (
    <div className="flex items-center gap-1.5 md:gap-2 min-w-0">
      <Chip color={playerColor} size="sm" className="shrink-0" />
      <span className="text-xs md:text-sm font-medium truncate">
        <span className="md:hidden">{isMyTurn ? "Your turn" : `${playerName}`}</span>
        <span className="hidden md:inline">{displayText}</span>
        {actionHint && (
          <span className="text-brown-light font-normal hidden sm:inline"> · {actionHint}</span>
        )}
      </span>
    </div>
  );
}
