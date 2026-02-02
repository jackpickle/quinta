"use client";

import { cn } from "@/lib/utils";

interface HowToPlayModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HowToPlayModal({ isOpen, onClose }: HowToPlayModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-brown/60 flex items-center justify-center p-4 z-50"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-cream rounded-xl max-w-md w-full max-h-[80vh] overflow-y-auto shadow-lg">
        <header className="p-6 border-b border-wood flex justify-between items-center">
          <h3 className="font-[family-name:var(--font-fraunces)] text-2xl font-normal">
            How to Play
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-wood-light flex items-center justify-center text-xl text-brown-light hover:bg-wood"
          >
            ×
          </button>
        </header>

        <div className="p-6 space-y-6">
          <RuleSection number={1} title="Goal">
            Be the first player to place <strong>5 chips in a row</strong> on the board
            in any direction! (horizontal, vertical, or diagonal)
          </RuleSection>

          <RuleSection number={2} title="The Board">
            A 10×10 grid with numbers 0-99 arranged in a spiral from the center.
            Each number appears once.
          </RuleSection>

          <RuleSection number={3} title="Your Turn">
            <p className="mb-3">
              You hold 5 numbered cards. Each turn, choose one action:
            </p>

            <ActionExample
              name="Natural"
              description="Place a chip on the exact number matching your card. Draw a new card."
              color="text-gold-dark"
            />
            <ActionExample
              name="Higher"
              description="Place a chip on any number higher than your card. No draw."
              color="text-chip-coral"
            />
            <ActionExample
              name="Pass"
              description="Skip your turn. Draw a new card."
              color="text-brown-light"
            />
          </RuleSection>

          <RuleSection number={4} title="Strategy">
            Natural keeps your hand full but limits options. Higher gives
            flexibility but shrinks your hand. Balance is key!
          </RuleSection>
        </div>
      </div>
    </div>
  );
}

function RuleSection({
  number,
  title,
  children,
}: {
  number: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h4 className="font-semibold mb-2 flex items-center gap-2">
        <span className="w-6 h-6 bg-wood text-brown rounded-full flex items-center justify-center text-xs font-semibold">
          {number}
        </span>
        {title}
      </h4>
      <div className="text-brown-light text-[0.9375rem] leading-relaxed">
        {children}
      </div>
    </div>
  );
}

function ActionExample({
  name,
  description,
  color,
}: {
  name: string;
  description: string;
  color: string;
}) {
  return (
    <div className="flex items-center gap-4 p-3 bg-wood-light rounded-lg mt-2">
      <span className={cn("font-semibold min-w-[70px]", color)}>{name}</span>
      <span className="text-sm text-brown-light">{description}</span>
    </div>
  );
}
