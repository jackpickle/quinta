"use client";

import { useState, useEffect, useCallback } from "react";
import {
  getPlayerId,
  getPlayerName,
  savePlayerName,
  getPlayerIdentity,
} from "@/lib/firebase/player-identity";

export function usePlayerIdentity() {
  const [playerId, setPlayerId] = useState<string>("");
  const [playerName, setPlayerName] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    // Only run on client
    setPlayerId(getPlayerId());
    setPlayerName(getPlayerName());
    setInitialized(true);
  }, []);

  const updateName = useCallback((name: string) => {
    savePlayerName(name);
    setPlayerName(name);
  }, []);

  const identity = initialized
    ? { id: playerId, name: playerName || `Player ${playerId.slice(-4)}` }
    : null;

  return {
    playerId,
    playerName,
    updateName,
    identity,
    initialized,
  };
}
