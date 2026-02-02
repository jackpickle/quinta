"use client";

import { useState, useEffect } from "react";
import { subscribeToLobby, type LobbyState } from "@/lib/firebase/lobby";
import type { GameState } from "@/types/game";

export function useLobbyState(roomCode: string) {
  const [lobbyState, setLobbyState] = useState<LobbyState | null>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!roomCode) {
      setLoading(false);
      return;
    }

    const unsubscribe = subscribeToLobby(roomCode, (state) => {
      setLoading(false);

      if (!state) {
        setLobbyState(null);
        setError("Room not found");
        return;
      }

      // Check if game has started (status changed from 'waiting')
      if (state.status !== "waiting") {
        setGameStarted(true);
      } else {
        setLobbyState(state as LobbyState);
        setError(null);
      }
    });

    return () => unsubscribe();
  }, [roomCode]);

  return { lobbyState, gameStarted, loading, error };
}
