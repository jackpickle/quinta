"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import type { ChipColor } from "@/types/game";

const chipVariants = cva(
  "rounded-full shadow-[var(--shadow-sm),inset_0_-2px_4px_rgba(0,0,0,0.1),inset_0_2px_4px_rgba(255,255,255,0.3)]",
  {
    variants: {
      color: {
        coral: "bg-chip-coral",
        mint: "bg-chip-mint",
        sky: "bg-chip-sky",
        peach: "bg-chip-peach",
        lavender: "bg-chip-lavender",
        yellow: "bg-chip-yellow",
      },
      size: {
        xs: "w-4 h-4",
        sm: "w-6 h-6",
        md: "w-8 h-8",
        lg: "w-12 h-12",
      },
    },
    defaultVariants: {
      size: "md",
    },
  }
);

interface ChipProps extends Omit<VariantProps<typeof chipVariants>, "color"> {
  color: ChipColor;
  className?: string;
}

export function Chip({ color, size, className }: ChipProps) {
  return <div className={cn(chipVariants({ color, size }), className)} />;
}

export { chipVariants };
