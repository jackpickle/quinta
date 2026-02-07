"use client";

import { cn } from "@/lib/utils";
import { Chip } from "@/components/atoms/Chip";
import { PlayerBadge } from "@/components/atoms/PlayerBadge";
import type { ChipColor } from "@/types/game";

interface PlayerListItem {
  id: string;
  name: string;
  color: ChipColor | null;
  isHost: boolean;
  isReady?: boolean;
  isBot?: boolean;
}

interface PlayerListProps {
  players: PlayerListItem[];
  currentPlayerId: string;
  maxPlayers?: number;
  isHost?: boolean;
  onRemoveBot?: (botId: string) => void;
}

export function PlayerList({
  players,
  currentPlayerId,
  maxPlayers = 6,
  isHost,
  onRemoveBot,
}: PlayerListProps) {
  const emptySlots = maxPlayers - players.length;

  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-4">
        <span className="text-sm font-medium uppercase tracking-wide">
          Players
        </span>
        <span className="text-sm text-brown-light">
          {players.length} / {maxPlayers}
        </span>
      </div>

      <div className="space-y-2">
        {players.map((player) => {
          const isYou = player.id === currentPlayerId;

          return (
            <div
              key={player.id}
              className={cn(
                "flex items-center gap-4 p-4 rounded-lg bg-wood-light",
                isYou && "bg-cream-dark border-2 border-wood-dark"
              )}
            >
              {player.color ? (
                <Chip color={player.color} size="md" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-wood border-2 border-dashed border-brown-light" />
              )}
              <span className="flex-1 font-medium">
                {player.name}
                {player.isBot && (
                  <span className="text-xs text-brown-light ml-1">[Bot]</span>
                )}
              </span>
              {player.isHost && (
                <PlayerBadge variant="host">Host</PlayerBadge>
              )}
              {!player.isHost && !player.isBot && player.isReady && (
                <PlayerBadge variant="ready">Ready</PlayerBadge>
              )}
              {player.isBot && isHost && onRemoveBot && (
                <button
                  onClick={() => onRemoveBot(player.id)}
                  className="text-xs text-brown-light hover:text-brown ml-1"
                >
                  Remove
                </button>
              )}
            </div>
          );
        })}

        {Array.from({ length: emptySlots }).map((_, i) => (
          <div
            key={`empty-${i}`}
            className="flex items-center justify-center p-4 border-2 border-dashed border-wood rounded-lg text-brown-light text-sm"
          >
            Waiting for players...
          </div>
        ))}
      </div>
    </div>
  );
}
