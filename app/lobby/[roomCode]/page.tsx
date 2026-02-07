"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useLobbyState } from "@/hooks/useLobbyState";
import { usePlayerIdentity } from "@/hooks/usePlayerIdentity";
import { LobbyPanel } from "@/components/organisms/LobbyPanel";
import { Button } from "@/components/atoms/Button";
import {
  selectColor,
  toggleReady,
  updateLobbySettings,
  startGameFromLobby,
  leaveLobby,
  canStartGame,
  assignPlayerToTeam,
  selectTeamColor,
} from "@/lib/firebase/lobby";
import { addBotToLobby, removeBotFromLobby } from "@/lib/firebase/bot-player";
import type { ChipColor, GameSettings } from "@/types/game";
import { playButtonClick } from "@/lib/sounds";

export default function LobbyPage() {
  const params = useParams();
  const router = useRouter();
  const roomCode = params.roomCode as string;

  const { lobbyState, gameStarted, loading, error } = useLobbyState(roomCode);
  const { playerId, initialized } = usePlayerIdentity();

  // Redirect to game when started
  useEffect(() => {
    if (gameStarted) {
      router.push(`/game/${roomCode}`);
    }
  }, [gameStarted, roomCode, router]);

  if (loading || !initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-brown-light">Loading...</p>
      </div>
    );
  }

  if (error || !lobbyState) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-brown-light">{error || "Room not found"}</p>
        <Button onClick={() => router.push("/")}>Back to Home</Button>
      </div>
    );
  }

  const currentPlayer = lobbyState.players.find((p) => p.id === playerId);
  const isHost = currentPlayer?.isHost ?? false;
  const { canStart } = canStartGame(lobbyState);

  const handleColorSelect = async (color: ChipColor) => {
    playButtonClick();
    await selectColor(roomCode, playerId, color);
  };

  const handleToggleReady = async () => {
    playButtonClick();
    await toggleReady(roomCode, playerId);
  };

  const handleUpdateSettings = async (settings: Partial<GameSettings>) => {
    await updateLobbySettings(roomCode, playerId, settings);
  };

  const handleStartGame = async () => {
    playButtonClick();
    await startGameFromLobby(roomCode, playerId);
  };

  const handleLeave = async () => {
    playButtonClick();
    await leaveLobby(roomCode, playerId);
    router.push("/");
  };

  const handleAssignPlayerToTeam = async (targetPlayerId: string, teamIndex: number | null) => {
    playButtonClick();
    await assignPlayerToTeam(roomCode, playerId, targetPlayerId, teamIndex);
  };

  const handleSelectTeamColor = async (teamIndex: number, color: ChipColor) => {
    playButtonClick();
    await selectTeamColor(roomCode, playerId, teamIndex, color);
  };

  const handleAddBot = async () => {
    playButtonClick();
    await addBotToLobby(roomCode, playerId);
  };

  const handleRemoveBot = async (botId: string) => {
    playButtonClick();
    await removeBotFromLobby(roomCode, playerId, botId);
  };

  return (
    <LobbyPanel
      roomCode={roomCode}
      players={lobbyState.players}
      currentPlayerId={playerId}
      isHost={isHost}
      settings={lobbyState.settings}
      onColorSelect={handleColorSelect}
      onToggleReady={handleToggleReady}
      onUpdateSettings={handleUpdateSettings}
      onStartGame={handleStartGame}
      onLeave={handleLeave}
      canStart={canStart}
      teams={lobbyState.teams}
      teamColors={lobbyState.teamColors}
      onAssignPlayerToTeam={handleAssignPlayerToTeam}
      onSelectTeamColor={handleSelectTeamColor}
      onAddBot={handleAddBot}
      onRemoveBot={handleRemoveBot}
    />
  );
}
