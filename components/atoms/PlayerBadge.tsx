"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "text-xs px-2 py-1 rounded font-[family-name:var(--font-dm-sans)]",
  {
    variants: {
      variant: {
        default: "bg-wood text-brown-light",
        host: "bg-wood text-brown",
        ready: "bg-wood-dark text-cream",
        you: "bg-chip-sky text-brown",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

interface PlayerBadgeProps extends VariantProps<typeof badgeVariants> {
  children: React.ReactNode;
  className?: string;
}

export function PlayerBadge({
  variant,
  children,
  className,
}: PlayerBadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)}>
      {children}
    </span>
  );
}

export { badgeVariants };
