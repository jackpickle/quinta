"use client";

import { useState, useCallback } from "react";
import { getValidMovesForCard } from "@/lib/firebase/game-actions";
import { getPlayerId } from "@/lib/firebase/player-identity";

interface ValidMoves {
  natural: number[];
  higher: number[];
}

export function useValidMoves(roomCode: string) {
  const [validMoves, setValidMoves] = useState<ValidMoves>({
    natural: [],
    higher: [],
  });
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const selectCard = useCallback(
    async (cardId: string) => {
      if (selectedCardId === cardId) {
        // Deselect if clicking same card
        setSelectedCardId(null);
        setValidMoves({ natural: [], higher: [] });
        return;
      }

      setSelectedCardId(cardId);
      setLoading(true);

      try {
        const playerId = getPlayerId();
        const moves = await getValidMovesForCard(roomCode, playerId, cardId);
        console.log(moves)
        if (moves) {
          setValidMoves(moves);
        } else {
          setValidMoves({ natural: [], higher: [] });
        }
      } catch {
        setValidMoves({ natural: [], higher: [] });
      } finally {
        setLoading(false);
      }
    },
    [roomCode, selectedCardId]
  );

  const clearSelection = useCallback(() => {
    setSelectedCardId(null);
    setValidMoves({ natural: [], higher: [] });
  }, []);

  return {
    validMoves,
    selectedCardId,
    selectCard,
    clearSelection,
    loading,
  };
}
