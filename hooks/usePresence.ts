"use client";

import { useEffect, useState } from "react";
import {
  initializePresence,
  subscribeToPresence,
  type PlayerPresence,
} from "@/lib/firebase/presence";
import type { PlayerId } from "@/types/game";

export function usePresence(roomCode: string, playerId: string) {
  const [presence, setPresence] = useState<Record<PlayerId, PlayerPresence>>(
    {}
  );

  useEffect(() => {
    if (!roomCode || !playerId) return;

    // Initialize our presence
    const cleanupPresence = initializePresence(roomCode, playerId);

    // Subscribe to all presence updates
    const unsubscribe = subscribeToPresence(roomCode, setPresence);

    return () => {
      cleanupPresence();
      unsubscribe();
    };
  }, [roomCode, playerId]);

  const isPlayerOnline = (pid: PlayerId): boolean => {
    const p = presence[pid];
    if (!p) return false;
    // Player is online if marked online AND lastSeen within 60 seconds
    const now = Date.now();
    return p.online && now - p.lastSeen < 60000;
  };

  return { presence, isPlayerOnline };
}
