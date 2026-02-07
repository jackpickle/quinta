"use client";
import { CardHand } from "@/components/molecules/CardHand";
import { Button } from "@/components/atoms/Button";
import type { Card, ChipColor } from "@/types/game";

interface SidebarProps {
  hand: Card[];
  selectedCardId: string | null;
  onCardSelect: (cardId: string) => void;
  onPass: () => void;
  onForfeit?: () => void;
  disabled?: boolean;
  isForfeited?: boolean;
  playerColor?: ChipColor;
  maxCards?: number;
  consecutiveTimeouts?: number;
}

export function Sidebar({
  hand,
  selectedCardId,
  onCardSelect,
  onPass,
  onForfeit,
  disabled,
  isForfeited,
  playerColor = 'coral',
  maxCards = 5,
  consecutiveTimeouts = 0,
}: SidebarProps) {
  const missesLeft = 3 - consecutiveTimeouts;
  return (
    <div className="shrink-0 bg-wood-light px-3 py-2 md:p-4 border-t border-wood md:border-t-0 md:border-l md:w-48 lg:w-52 md:flex md:flex-col md:justify-center">
      <div className="hidden md:block text-xs uppercase tracking-wide text-brown-light text-center mb-2">
        Your Hand
      </div>

      {/* Mobile: horizontal layout with pass button */}
      <div className="flex items-center gap-2 md:flex-col">
        <div className="flex-1 overflow-x-auto md:overflow-visible md:mb-4">
          <CardHand
            cards={hand}
            selectedCardId={selectedCardId}
            onCardSelect={onCardSelect}
            disabled={disabled}
            playerColor={playerColor}
            maxCards={maxCards}
          />
        </div>

        <Button
          onClick={onPass}
          disabled={disabled || isForfeited}
          variant="action"
          className="shrink-0 px-4 md:w-full"
        >
          Pass
        </Button>

        {onForfeit && !isForfeited && (
          <div className="shrink-0 flex flex-col items-center md:w-full">
            <Button
              onClick={onForfeit}
              variant="action"
              className="px-4 md:w-full"
            >
              Forfeit
            </Button>
            {consecutiveTimeouts > 0 && (
              <span className="text-xs text-amber-600 mt-1">
                {missesLeft} miss{missesLeft !== 1 ? 'es' : ''} until removed
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}