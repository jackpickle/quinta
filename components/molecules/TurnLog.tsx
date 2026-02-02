"use client";
import { useEffect, useRef } from "react";
import { Chip } from "@/components/atoms/Chip";
import type { TurnHistoryEntry } from "@/types/game";

interface TurnLogProps {
  entries: TurnHistoryEntry[];
  maxSlots?: number;
}

export function TurnLog({ entries }: TurnLogProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Ensure entries is an array (defensive handling)
  const safeEntries = Array.isArray(entries) ? entries : [];

  // Auto-scroll to bottom when new entries arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [safeEntries.length]);

  // Fixed height to match hand: 5 cards * 80px + 4 gaps * 8px = 432px
  return (
    <div className="flex flex-col h-[432px] w-full overflow-hidden">
      <div className="text-xs uppercase tracking-wide text-brown-light text-center mb-2 shrink-0">
        Turn Log
      </div>
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col gap-2 min-h-0 pr-2"
        style={{ 
          scrollbarWidth: 'thin',
          scrollbarColor: '#8B7355 transparent'
        }}
      >
        {safeEntries.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-brown-light text-sm italic">
            No moves yet
          </div>
        ) : (
          safeEntries.map((entry, index) => (
            <TurnLogEntry key={index} entry={entry} />
          ))
        )}
      </div>
    </div>
  );
}

function TurnLogEntry({ entry }: { entry: TurnHistoryEntry }) {
  const actionText = getActionText(entry);
  return (
    <div className="h-20 flex items-center gap-2 p-2 rounded-lg bg-cream shrink-0">
      <Chip color={entry.playerColor} size="xs" className="shrink-0" />
      <span className="text-xs text-brown-light leading-tight">
        <span className="font-medium text-brown">{entry.playerName}</span>{" "}
        {actionText}
      </span>
    </div>
  );
}

function getActionText(entry: TurnHistoryEntry): React.ReactNode {
  switch (entry.action) {
    case "natural":
      return (
        <>
          played {entry.cardValue} <strong className="text-brown">natural</strong> on cell{" "}
          {entry.cellNumber}, drawing a card
        </>
      );
    case "higher":
      return (
        <>
          played {entry.cardValue} <strong className="text-brown">higher</strong> on cell{" "}
          {entry.cellNumber}
        </>
      );
    case "pass":
      return <strong className="text-brown">passed</strong>;
    default:
      return "";
  }
}