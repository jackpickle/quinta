"use client";
import { Button } from "@/components/atoms/Button";
import { RoomCodeDisplay } from "@/components/molecules/RoomCodeDisplay";
import { PlayerList } from "@/components/molecules/PlayerList";
import { ColorPicker } from "@/components/molecules/ColorPicker";
import { SettingsPanel } from "@/components/molecules/SettingsPanel";
import type { GameSettings, ChipColor } from "@/types/game";

interface LobbyPlayer {
  id: string;
  name: string;
  color: ChipColor | null;
  isHost: boolean;
  isReady: boolean;
}

interface LobbyPanelProps {
  roomCode: string;
  players: LobbyPlayer[];
  currentPlayerId: string;
  isHost: boolean;
  settings: GameSettings;
  onColorSelect: (color: ChipColor) => void;
  onToggleReady: () => void;
  onUpdateSettings: (settings: Partial<GameSettings>) => void;
  onStartGame: () => void;
  onLeave: () => void;
  canStart: boolean;
}

export function LobbyPanel({
  roomCode,
  players,
  currentPlayerId,
  isHost,
  settings,
  onColorSelect,
  onToggleReady,
  onUpdateSettings,
  onStartGame,
  onLeave,
  canStart,
}: LobbyPanelProps) {
  const currentPlayer = players.find((p) => p.id === currentPlayerId);
  const takenColors = players
    .filter((p) => p.color !== null)
    .map((p) => p.color as ChipColor);

  return (
    <div className="max-w-md mx-auto p-6 pt-8">
      <header className="text-center mb-8">
        <h2 className="font-[family-name:var(--font-fraunces)] text-2xl font-normal">
          Game Lobby
        </h2>
      </header>

      <RoomCodeDisplay roomCode={roomCode} />

      <div className="mt-6 flex flex-col items-center">
        <ColorPicker
          selectedColor={currentPlayer?.color ?? null}
          takenColors={takenColors}
          onSelect={onColorSelect}
        />

        <div className="w-full">
          <PlayerList
            players={players}
            currentPlayerId={currentPlayerId}
            maxPlayers={settings.maxPlayers}
          />
        </div>

        {isHost && (
          <SettingsPanel
            settings={settings}
            onChange={onUpdateSettings}
            disabled={false}
          />
        )}

        <div className="flex flex-col gap-2 w-full">
          {isHost ? (
            <Button variant="secondary" onClick={onStartGame} disabled={!canStart}>
              Start Game
            </Button>
          ) : (
            <>
              <Button variant="secondary" onClick={onToggleReady}>
                {currentPlayer?.isReady ? "Not Ready" : "Ready"}
              </Button>
              <p className="text-center text-brown-light italic py-2">
                Waiting for host to start...
              </p>
            </>
          )}
          <Button variant="ghost" onClick={onLeave}>
            Leave Lobby
          </Button>
        </div>
      </div>
    </div>
  );
}