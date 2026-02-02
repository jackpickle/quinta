"use client";

import { useState, useEffect } from "react";
import type { Card } from "@/types/game";
import { subscribeToPrivateHand } from "@/lib/firebase/game-sync";

export function usePrivateHand(roomCode: string, playerId: string) {
  const [hand, setHand] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!roomCode || !playerId) {
      setLoading(false);
      return;
    }

    const unsubscribe = subscribeToPrivateHand(roomCode, playerId, (cards) => {
      setHand(cards);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [roomCode, playerId]);

  return { hand, loading };
}
