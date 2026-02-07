import { useEffect, useRef, useState } from 'react';
import type { GameState } from '@/types';
import { isBotPlayer, chooseBotMove } from '@/lib/game/bot';
import { getPrivateHand } from '@/lib/firebase/game-sync';
import { executePlayerTurn } from '@/lib/firebase/game-actions';

/**
 * Hook that auto-plays bot turns when the current user is the host.
 * Only the host's client drives bot moves to avoid duplicate execution.
 *
 * Uses a retrigger counter to ensure the effect re-runs after each bot turn,
 * even if React hasn't re-rendered from the Firebase state change yet.
 */
export function useBotTurns(
  roomCode: string,
  gameState: GameState | null,
  playerId: string
): void {
  const executingRef = useRef(false);
  const [retrigger, setRetrigger] = useState(0);

  const status = gameState?.status;
  const currentIndex = gameState?.currentPlayerIndex;
  const players = gameState?.players;
  const board = gameState?.board;
  const settings = gameState?.settings;

  useEffect(() => {
    if (status !== 'playing' || currentIndex === undefined || !players || !board || !settings) {
      return;
    }

    const currentPlayer = players[currentIndex];
    if (!currentPlayer || !isBotPlayer(currentPlayer)) return;

    // Only the host should execute bot turns
    const isHost = players.find(p => p.id === playerId)?.isHost;
    if (!isHost) return;

    // Prevent double-execution
    if (executingRef.current) return;

    const delay = 400 + Math.random() * 400; // 0.4-0.8 seconds

    const timer = setTimeout(async () => {
      if (executingRef.current) return;
      executingRef.current = true;

      try {
        const hand = await getPrivateHand(roomCode, currentPlayer.id);
        if (hand.length === 0) {
          // No cards — pass
          await executePlayerTurn(roomCode, currentPlayer.id, 'pass');
          return;
        }

        const move = chooseBotMove(hand, board, settings, currentPlayer.color);
        await executePlayerTurn(
          roomCode,
          currentPlayer.id,
          move.action,
          move.cardId,
          move.targetNumber
        );
      } catch (err) {
        console.error('Bot turn failed:', err);
      } finally {
        executingRef.current = false;
        // Force effect to re-run so the next bot (if any) gets a timer
        setRetrigger(c => c + 1);
      }
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [roomCode, playerId, status, currentIndex, players, board, settings, retrigger]);
}
