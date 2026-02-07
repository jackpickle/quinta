import { useEffect, useRef, useState } from 'react';
import type { GameState } from '@/types';
import { playTimerBeep } from '@/lib/sounds';
import { executePlayerTurn } from '@/lib/firebase/game-actions';
import { forfeitPlayer } from '@/lib/firebase/game-actions';

const TURN_DURATION = 30;
const BEEP_THRESHOLDS = [15, 10, 5];
const AFK_FORFEIT_THRESHOLD = 3;

interface UseTurnTimerResult {
  secondsRemaining: number;
  isRunning: boolean;
}

/**
 * Turn timer hook — counts down from 30s each turn.
 * Plays warning beeps for the active player at 15/10/5 seconds.
 * Host's client auto-passes when timer expires and auto-forfeits after 3 consecutive timeouts.
 */
export function useTurnTimer(
  roomCode: string,
  gameState: GameState | null,
  playerId: string,
): UseTurnTimerResult {
  const [secondsRemaining, setSecondsRemaining] = useState(TURN_DURATION);
  const executingRef = useRef(false);
  const beepedRef = useRef<Set<number>>(new Set());

  const status = gameState?.status;
  const currentIndex = gameState?.currentPlayerIndex;
  const players = gameState?.players;
  const currentPlayer = players?.[currentIndex ?? 0];
  const isMyTurn = currentPlayer?.id === playerId;
  const isHost = players?.find(p => p.id === playerId)?.isHost;

  const shouldRun = status === 'playing'
    && !!currentPlayer
    && !currentPlayer.isBot
    && !currentPlayer.forfeited;

  // Reset timer when turn changes
  useEffect(() => {
    setSecondsRemaining(TURN_DURATION);
    beepedRef.current = new Set();
    executingRef.current = false;
  }, [currentIndex]);

  // Tick the countdown
  useEffect(() => {
    if (!shouldRun) return;

    const interval = setInterval(() => {
      setSecondsRemaining(prev => {
        const next = prev - 1;

        // Play beep at thresholds (only for the player whose turn it is)
        if (isMyTurn && BEEP_THRESHOLDS.includes(next) && !beepedRef.current.has(next)) {
          beepedRef.current.add(next);
          const urgency = BEEP_THRESHOLDS.indexOf(next);
          playTimerBeep(urgency);
        }

        return Math.max(0, next);
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [shouldRun, currentIndex, isMyTurn]);

  // Host enforces auto-pass at 0
  useEffect(() => {
    if (secondsRemaining > 0 || !shouldRun || !isHost || !currentPlayer) return;
    if (executingRef.current) return;
    executingRef.current = true;

    const player = currentPlayer;
    const newTimeouts = (player.consecutiveTimeouts ?? 0) + 1;

    (async () => {
      try {
        await executePlayerTurn(roomCode, player.id, 'pass', undefined, undefined, {
          isTimeout: true,
        });

        if (newTimeouts >= AFK_FORFEIT_THRESHOLD) {
          await forfeitPlayer(roomCode, player.id);
        }
      } catch (err) {
        console.error('Timer auto-pass failed:', err);
      }
    })();
  }, [secondsRemaining, shouldRun, isHost, roomCode, currentPlayer]);

  return {
    secondsRemaining,
    isRunning: shouldRun,
  };
}
