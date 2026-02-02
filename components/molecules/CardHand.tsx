"use client";
import { cn } from "@/lib/utils";
import { Card } from "@/components/atoms/Card";
import type { Card as CardType, ChipColor } from "@/types/game";

interface CardHandProps {
  cards: CardType[];
  selectedCardId: string | null;
  onCardSelect: (cardId: string) => void;
  disabled?: boolean;
  playerColor?: ChipColor;
  maxCards?: number;
}

export function CardHand({
  cards,
  selectedCardId,
  onCardSelect,
  disabled,
  playerColor = 'coral',
  maxCards = 5,
}: CardHandProps) {
  const emptySlots = Math.max(0, maxCards - cards.length);

  return (
    <div className="flex flex-row md:flex-col gap-1.5 md:gap-2 justify-start md:justify-center md:items-center py-1 md:py-0">
      {cards.map((card) => (
        <Card
          key={card.id}
          card={card}
          selected={selectedCardId === card.id}
          onClick={() => onCardSelect(card.id)}
          disabled={disabled}
          playerColor={playerColor}
        />
      ))}
      {/* Empty card slots to maintain consistent layout */}
      {Array.from({ length: emptySlots }).map((_, i) => (
        <div
          key={`empty-${i}`}
          className={cn(
            "w-11 h-16 md:w-14 md:h-20 rounded-lg shrink-0",
            "border-2 border-dashed border-wood-dark/30"
          )}
        />
      ))}
    </div>
  );
}
