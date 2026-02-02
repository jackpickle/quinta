"use client";

import { useState, useEffect } from "react";
import type { GameState } from "@/types/game";
import { subscribeToGameState } from "@/lib/firebase/game-sync";

export function useGameState(roomCode: string) {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!roomCode) {
      setLoading(false);
      return;
    }

    const unsubscribe = subscribeToGameState(roomCode, (state) => {
      setGameState(state);
      setLoading(false);
      if (!state) {
        setError("Game not found");
      } else {
        setError(null);
      }
    });

    return () => unsubscribe();
  }, [roomCode]);

  return { gameState, loading, error };
}
