"use client";

import { Button } from "@/components/atoms/Button";
import type { TurnAction } from "@/types/game";

interface ActionBarProps {
  selectedAction: TurnAction | null;
  onActionSelect: (action: TurnAction) => void;
  onPass: () => void;
  hasNaturalMoves: boolean;
  hasHigherMoves: boolean;
  hasCardSelected: boolean;
  disabled?: boolean;
  direction?: "horizontal" | "vertical";
}

export function ActionBar({
  selectedAction,
  onActionSelect,
  onPass,
  hasNaturalMoves,
  hasHigherMoves,
  hasCardSelected,
  disabled,
  direction = "vertical",
}: ActionBarProps) {
  const containerClass =
    direction === "horizontal"
      ? "flex flex-row gap-2 justify-center"
      : "flex flex-col gap-2";

  return (
    <div className={containerClass}>
      <Button
        variant={selectedAction === "natural" ? "actionPrimary" : "action"}
        size="action"
        onClick={() => onActionSelect("natural")}
        disabled={disabled || !hasCardSelected || !hasNaturalMoves}
      >
        Natural
      </Button>
      <Button
        variant={selectedAction === "higher" ? "actionPrimary" : "action"}
        size="action"
        onClick={() => onActionSelect("higher")}
        disabled={disabled || !hasCardSelected || !hasHigherMoves}
      >
        Higher
      </Button>
      <Button variant="action" size="action" onClick={onPass} disabled={disabled}>
        Pass
      </Button>
    </div>
  );
}
