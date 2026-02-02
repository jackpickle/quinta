"use client";
import { cn } from "@/lib/utils";
import { Chip } from "./Chip";
import type { ChipColor } from "@/types/game";

interface BoardCellProps {
  number: number;
  chip?: { color: ChipColor } | null;
  isValidMove?: boolean;
  isWinning?: boolean;
  winningColor?: string;
  onClick?: () => void;
  disabled?: boolean;
}

export function BoardCell({
  number,
  chip,
  isValidMove,
  isWinning,
  winningColor,
  onClick,
  disabled,
}: BoardCellProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "aspect-square flex items-center justify-center relative",
        "text-[clamp(0.5rem,2vw,0.75rem)] text-brown-light",
        "transition-all duration-150 cursor-pointer",
        !isValidMove && !isWinning && "bg-cream hover:bg-cream-dark",
        isValidMove && "bg-brown/20 hover:bg-brown/30",
        chip && "cursor-default hover:bg-cream",
      )}
      style={isWinning && winningColor ? {
        backgroundColor: winningColor,
      } as React.CSSProperties : undefined}
    >
      <span className={cn(chip && "opacity-0")}>{number}</span>
      {chip && (
        <Chip
          color={chip.color}
          size="md"
          className="absolute w-[70%] h-[70%]"
        />
      )}
    </button>
  );
}