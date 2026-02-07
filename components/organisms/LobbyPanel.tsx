"use client";
import { Button } from "@/components/atoms/Button";
import { RoomCodeDisplay } from "@/components/molecules/RoomCodeDisplay";
import { PlayerList } from "@/components/molecules/PlayerList";
import { ColorPicker } from "@/components/molecules/ColorPicker";
import { SettingsPanel } from "@/components/molecules/SettingsPanel";
import { Chip } from "@/components/atoms/Chip";
import { cn } from "@/lib/utils";
import type { GameSettings, ChipColor } from "@/types/game";

const TEAM_LABELS = ["Team 1", "Team 2", "Team 3"];

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
  // Team props
  teams?: Record<string, number>;
  teamColors?: (ChipColor | null)[];
  onAssignPlayerToTeam?: (playerId: string, teamIndex: number | null) => void;
  onSelectTeamColor?: (teamIndex: number, color: ChipColor) => void;
}

function TeamAssignmentUI({
  players,
  teams,
  teamColors,
  isHost,
  onAssignPlayerToTeam,
  onSelectTeamColor,
}: {
  players: LobbyPlayer[];
  teams: Record<string, number>;
  teamColors: (ChipColor | null)[];
  isHost: boolean;
  onAssignPlayerToTeam?: (playerId: string, teamIndex: number | null) => void;
  onSelectTeamColor?: (teamIndex: number, color: ChipColor) => void;
}) {
  // Determine how many teams to show (2 by default, 3 if any player is on team 2)
  const hasTeam3 = Object.values(teams).some((t) => t === 2);
  const teamCount = hasTeam3 ? 3 : 2;

  // Taken team colors (for disabling in pickers)
  const takenTeamColors = teamColors.filter((c): c is ChipColor => c !== null);

  return (
    <div className="w-full mb-6 space-y-4">
      {Array.from({ length: teamCount }, (_, teamIdx) => {
        const teamMembers = players.filter((p) => teams[p.id] === teamIdx);
        const teamColor = teamColors[teamIdx];

        return (
          <div
            key={teamIdx}
            className="bg-wood-light rounded-lg p-3"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {teamColor && <Chip color={teamColor} size="sm" />}
                <span className="text-sm font-medium">{TEAM_LABELS[teamIdx]}</span>
              </div>
              {isHost && onSelectTeamColor && (
                <div className="flex gap-1">
                  {(["coral", "mint", "sky", "peach", "lavender", "yellow"] as ChipColor[]).map(
                    (color) => {
                      const taken =
                        takenTeamColors.includes(color) && teamColors[teamIdx] !== color;
                      return (
                        <button
                          key={color}
                          onClick={() => !taken && onSelectTeamColor(teamIdx, color)}
                          disabled={taken}
                          className={cn(
                            "w-6 h-6 rounded-full border-2 border-transparent",
                            `bg-chip-${color}`,
                            teamColors[teamIdx] === color && "border-brown",
                            taken && "opacity-30 cursor-not-allowed"
                          )}
                        />
                      );
                    }
                  )}
                </div>
              )}
            </div>
            <div className="space-y-1">
              {teamMembers.length === 0 && (
                <p className="text-xs text-brown-light italic">No players assigned</p>
              )}
              {teamMembers.map((p) => (
                <div key={p.id} className="flex items-center justify-between text-sm py-0.5">
                  <span>{p.name}</span>
                  {isHost && onAssignPlayerToTeam && (
                    <button
                      onClick={() => onAssignPlayerToTeam(p.id, null)}
                      className="text-xs text-brown-light hover:text-brown"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {/* Unassigned players */}
      {(() => {
        const unassigned = players.filter((p) => teams[p.id] === undefined);
        if (unassigned.length === 0) return null;
        return (
          <div className="bg-cream rounded-lg p-3">
            <span className="text-sm font-medium mb-2 block">Unassigned</span>
            {unassigned.map((p) => (
              <div key={p.id} className="flex items-center justify-between text-sm py-0.5">
                <span>{p.name}</span>
                {isHost && onAssignPlayerToTeam && (
                  <div className="flex gap-1">
                    {Array.from({ length: teamCount }, (_, i) => (
                      <button
                        key={i}
                        onClick={() => onAssignPlayerToTeam(p.id, i)}
                        className="px-2 py-0.5 text-xs rounded bg-wood-light border border-wood-dark hover:bg-wood"
                      >
                        {TEAM_LABELS[i]}
                      </button>
                    ))}
                    {teamCount < 3 && (
                      <button
                        onClick={() => onAssignPlayerToTeam(p.id, 2)}
                        className="px-2 py-0.5 text-xs rounded bg-wood-light border border-wood-dark hover:bg-wood"
                      >
                        Team 3
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        );
      })()}
    </div>
  );
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
  teams,
  teamColors,
  onAssignPlayerToTeam,
  onSelectTeamColor,
}: LobbyPanelProps) {
  const currentPlayer = players.find((p) => p.id === currentPlayerId);
  const takenColors = players
    .filter((p) => p.color !== null)
    .map((p) => p.color as ChipColor);

  const teamsEnabled = settings.teamsEnabled;

  return (
    <div className="max-w-md mx-auto p-6 pt-8">
      <header className="text-center mb-8">
        <h2 className="font-[family-name:var(--font-fraunces)] text-2xl font-normal">
          Game Lobby
        </h2>
      </header>

      <RoomCodeDisplay roomCode={roomCode} />

      <div className="mt-6 flex flex-col items-center">
        {teamsEnabled ? (
          <TeamAssignmentUI
            players={players}
            teams={teams || {}}
            teamColors={teamColors || [null, null, null]}
            isHost={isHost}
            onAssignPlayerToTeam={onAssignPlayerToTeam}
            onSelectTeamColor={onSelectTeamColor}
          />
        ) : (
          <ColorPicker
            selectedColor={currentPlayer?.color ?? null}
            takenColors={takenColors}
            onSelect={onColorSelect}
          />
        )}

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
            playerCount={players.length}
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