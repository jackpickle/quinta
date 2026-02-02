"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface RoomCodeDisplayProps {
  roomCode: string;
  showCopyButton?: boolean;
}

export function RoomCodeDisplay({
  roomCode,
  showCopyButton = true,
}: RoomCodeDisplayProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-wood-light rounded-xl p-6 text-center shadow-[var(--shadow-inset)]">
      <div className="text-xs uppercase tracking-widest text-brown-light mb-2">
        Room Code
      </div>
      <div className="font-[family-name:var(--font-fraunces)] text-4xl font-semibold tracking-[0.15em] text-brown">
        {roomCode}
      </div>
      {showCopyButton && (
        <button
          onClick={handleCopy}
          className={cn(
            "mt-2 text-sm text-gold-dark cursor-pointer",
            "inline-flex items-center gap-1",
            "hover:underline transition-colors"
          )}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
          {copied ? "Copied!" : "Copy code"}
        </button>
      )}
    </div>
  );
}
