import { ref, get, onValue } from 'firebase/database';
import { database } from './config';
import { GameState, PlayerId } from '@/types';

/**
 * Reconnection state
 */
export interface ReconnectionState {
  wasInGame: boolean;
  gameStillExists: boolean;
  gameState: GameState | null;
  yourTurn: boolean;
  missedTurns: number;
}

/**
 * Check if player can reconnect to a game
 */
export async function canReconnect(
  roomCode: string,
  playerId: PlayerId
): Promise<ReconnectionState> {
  
  const roomRef = ref(database, `rooms/${roomCode}`);
  
  try {
    const snapshot = await get(roomRef);
    
    if (!snapshot.exists()) {
      return {
        wasInGame: false,
        gameStillExists: false,
        gameState: null,
        yourTurn: false,
        missedTurns: 0
      };
    }

    const gameState = snapshot.val() as GameState;
    
    // Check if player is in this game
    const player = gameState.players.find(p => p.id === playerId);
    if (!player) {
      return {
        wasInGame: false,
        gameStillExists: true,
        gameState,
        yourTurn: false,
        missedTurns: 0
      };
    }

    // Check if it's their turn
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    const yourTurn = currentPlayer.id === playerId;

    // Count missed turns (rough estimate based on chips placed)
    let totalChips = 0;
    gameState.board.forEach(row => {
      row.forEach(cell => {
        if (cell.chip) totalChips++;
      });
    });
    
    const turnsPerPlayer = Math.floor(totalChips / gameState.players.length);
    const playerChips = gameState.board.flat().filter(
      cell => cell.chip?.playerId === playerId
    ).length;
    
    const missedTurns = Math.max(0, turnsPerPlayer - playerChips);

    return {
      wasInGame: true,
      gameStillExists: true,
      gameState,
      yourTurn,
      missedTurns
    };

  } catch (error) {
    return {
      wasInGame: false,
      gameStillExists: false,
      gameState: null,
      yourTurn: false,
      missedTurns: 0
    };
  }
}

/**
 * Sync local state with server after reconnection
 */
export async function syncAfterReconnect(
  roomCode: string,
  playerId: PlayerId
): Promise<GameState | null> {
  
  const reconnectState = await canReconnect(roomCode, playerId);
  
  if (!reconnectState.gameStillExists || !reconnectState.wasInGame) {
    return null;
  }

  return reconnectState.gameState;
}

/**
 * Monitor connection state and handle reconnection
 */
export function monitorConnection(
  roomCode: string,
  playerId: PlayerId,
  onDisconnect: () => void,
  onReconnect: (gameState: GameState) => void
): () => void {
  
  const connectedRef = ref(database, '.info/connected');
  
  const unsubscribe = onValue(connectedRef, async (snapshot) => {
    const connected = snapshot.val();
    
    if (!connected) {
      // Lost connection
      onDisconnect();
    } else {
      // Reconnected - sync game state
      const gameState = await syncAfterReconnect(roomCode, playerId);
      if (gameState) {
        onReconnect(gameState);
      }
    }
  });

  return unsubscribe;
}

/**
 * Store last known room code in localStorage for crash recovery
 */
export function saveLastRoom(roomCode: string, playerId: PlayerId): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('quinta_last_room', JSON.stringify({
      roomCode,
      playerId,
      timestamp: Date.now()
    }));
  }
}

/**
 * Retrieve last room for crash recovery
 */
export function getLastRoom(): { 
  roomCode: string; 
  playerId: PlayerId; 
  timestamp: number 
} | null {
  
  if (typeof window === 'undefined') return null;
  
  const data = localStorage.getItem('quinta_last_room');
  if (!data) return null;
  
  try {
    const parsed = JSON.parse(data);
    
    // Only valid for 2 hours
    if (Date.now() - parsed.timestamp > 7200000) {
      localStorage.removeItem('quinta_last_room');
      return null;
    }
    
    return parsed;
  } catch {
    return null;
  }
}

/**
 * Clear saved room (after successful reconnect or game end)
 */
export function clearLastRoom(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('quinta_last_room');
  }
}