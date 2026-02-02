"use client";
import { cn } from "@/lib/utils";
import type { Card as CardType, ChipColor } from "@/types/game";

interface CardProps {
  card: CardType;
  selected?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  playerColor?: ChipColor;
}

export function Card({ card, selected, onClick, disabled, playerColor = 'coral' }: CardProps) {
  const borderColor = `var(--chip-${playerColor})`;
  
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        // Smaller on mobile, larger on desktop
        "w-11 h-16 md:w-14 md:h-20 bg-cream rounded-lg",
        "flex items-center justify-center shrink-0",
        "font-[family-name:var(--font-fraunces)] text-xl md:text-2xl font-medium text-brown",
        "shadow-md cursor-pointer transition-all duration-200",
        "border-2 border-transparent relative",
        // Inner border decoration
        "before:absolute before:inset-0.5 md:before:inset-1 before:border before:border-wood before:rounded",
        // Hover state
        "hover:-translate-y-1 hover:shadow-lg",
        // Selected state - uses player color
        selected && "-translate-y-1 md:-translate-y-2 shadow-lg ring-2 md:ring-4",
        // Disabled state
        disabled && "opacity-50 cursor-not-allowed hover:translate-y-0"
      )}
      style={selected ? {
        '--tw-ring-color': borderColor
      } as React.CSSProperties : undefined}
    >
      {card.value}
    </button>
  );
}