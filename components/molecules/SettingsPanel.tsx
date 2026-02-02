"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import type { GameSettings } from "@/types/game";

interface SettingRowProps {
  label: string;
  value: number | boolean;
  onChange: (value: number | boolean) => void;
  type: "number" | "boolean";
  min?: number;
  max?: number;
  disabled?: boolean;
}

function SettingRow({
  label,
  value,
  onChange,
  type,
  min = 1,
  max = 10,
  disabled,
}: SettingRowProps) {
  if (type === "boolean") {
    return (
      <div className="flex justify-between items-center py-2 border-b border-wood last:border-b-0">
        <span className="text-sm">{label}</span>
        <label className="cursor-pointer">
          <input
            type="checkbox"
            checked={value as boolean}
            onChange={(e) => onChange(e.target.checked)}
            disabled={disabled}
            className="mr-1"
          />
          {value ? "On" : "Off"}
        </label>
      </div>
    );
  }

  return (
    <div className="flex justify-between items-center py-2 border-b border-wood last:border-b-0">
      <span className="text-sm">{label}</span>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onChange(Math.max(min, (value as number) - 1))}
          disabled={disabled || (value as number) <= min}
          className="w-7 h-7 rounded-full border border-wood-dark bg-cream flex items-center justify-center text-base hover:bg-wood disabled:opacity-50"
        >
          −
        </button>
        <span className="min-w-[2rem] text-center font-medium">{value}</span>
        <button
          onClick={() => onChange(Math.min(max, (value as number) + 1))}
          disabled={disabled || (value as number) >= max}
          className="w-7 h-7 rounded-full border border-wood-dark bg-cream flex items-center justify-center text-base hover:bg-wood disabled:opacity-50"
        >
          +
        </button>
      </div>
    </div>
  );
}

interface SettingsPanelProps {
  settings: GameSettings;
  onChange: (settings: Partial<GameSettings>) => void;
  disabled?: boolean;
}

export function SettingsPanel({
  settings,
  onChange,
  disabled,
}: SettingsPanelProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-wood-light rounded-lg overflow-hidden mb-6">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-4 flex justify-between items-center text-sm font-medium cursor-pointer"
      >
        <span>Game Settings</span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={cn("transition-transform", isOpen && "rotate-180")}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {isOpen && (
        <div className="px-4 pb-4">
          <SettingRow
            label="Hand Size"
            value={settings.handSize}
            onChange={(v) => onChange({ handSize: v as number })}
            type="number"
            min={3}
            max={7}
            disabled={disabled}
          />
          <SettingRow
            label="Win Length"
            value={settings.winLength}
            onChange={(v) => onChange({ winLength: v as number })}
            type="number"
            min={4}
            max={6}
            disabled={disabled}
          />
          <SettingRow
            label="Draw on Higher"
            value={settings.drawOnHigher}
            onChange={(v) => onChange({ drawOnHigher: v as boolean })}
            type="boolean"
            disabled={disabled}
          />
        </div>
      )}
    </div>
  );
}
