"use client";

import { cn } from "@/lib/utils";

interface TurnTimerProps {
  secondsRemaining: number;
  isRunning: boolean;
  playerColor?: string;
}

export function TurnTimer({ secondsRemaining, isRunning, playerColor }: TurnTimerProps) {
  if (!isRunning) return null;

  const progress = secondsRemaining / 30;
  const isUrgent = secondsRemaining <= 10;
  const isCritical = secondsRemaining <= 5;

  return (
    <div style={{ flexShrink: 0, textAlign: 'center', padding: '8px 0 0' }}>
      <span
        className={cn(
          "text-lg font-semibold tabular-nums",
          isCritical ? "text-red-400 animate-pulse" : isUrgent ? "text-amber-500" : "text-brown",
        )}
      >
        {secondsRemaining}s
      </span>
    </div>
  );
}
