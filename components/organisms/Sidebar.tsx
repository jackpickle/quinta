"use client";
import { CardHand } from "@/components/molecules/CardHand";
import { Button } from "@/components/atoms/Button";
import type { Card, ChipColor } from "@/types/game";

interface SidebarProps {
  hand: Card[];
  selectedCardId: string | null;
  onCardSelect: (cardId: string) => void;
  onPass: () => void;
  disabled?: boolean;
  playerColor?: ChipColor;
  maxCards?: number;
}

export function Sidebar({
  hand,
  selectedCardId,
  onCardSelect,
  onPass,
  disabled,
  playerColor = 'coral',
  maxCards = 5,
}: SidebarProps) {
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
          disabled={disabled}
          variant="action"
          className="shrink-0 px-4 md:w-full"
        >
          Pass
        </Button>
      </div>
    </div>
  );
}