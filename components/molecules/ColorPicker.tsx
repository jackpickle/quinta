"use client";
import { cn } from "@/lib/utils";
import type { ChipColor } from "@/types/game";

const ALL_COLORS: ChipColor[] = [
  "coral",
  "mint",
  "sky",
  "peach",
  "lavender",
  "yellow",
];

const colorClasses: Record<ChipColor, string> = {
  coral: "bg-chip-coral",
  mint: "bg-chip-mint",
  sky: "bg-chip-sky",
  peach: "bg-chip-peach",
  lavender: "bg-chip-lavender",
  yellow: "bg-chip-yellow",
};

interface ColorPickerProps {
  selectedColor: ChipColor | null;
  takenColors: ChipColor[];
  onSelect: (color: ChipColor) => void;
}

export function ColorPicker({
  selectedColor,
  takenColors,
  onSelect,
}: ColorPickerProps) {
  return (
    <div className="mb-6 text-center">
      <div className="text-sm font-medium mb-4 text-center">Choose Your Color</div>
      <div className="flex gap-2 justify-center flex-wrap">
        {ALL_COLORS.map((color) => {
          const isTaken = takenColors.includes(color);
          const isSelected = selectedColor === color;
          return (
            <button
              key={color}
              onClick={() => !isTaken && onSelect(color)}
              disabled={isTaken}
              className={cn(
                "w-11 h-11 rounded-full border-3 border-transparent",
                "cursor-pointer transition-all duration-200",
                "shadow-sm hover:scale-110",
                colorClasses[color],
                isSelected && "border-brown shadow-md",
                isTaken && "opacity-30 cursor-not-allowed hover:scale-100"
              )}
              aria-label={`Select ${color} color`}
            />
          );
        })}
      </div>
    </div>
  );
}