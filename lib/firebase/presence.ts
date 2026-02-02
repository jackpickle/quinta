import { ref, onDisconnect, set, onValue, serverTimestamp } from 'firebase/database';
import { database } from './config';
import { PlayerId } from '@/types';

/**
 * Player presence tracking
 */
export interface PlayerPresence {
  playerId: PlayerId;
  online: boolean;
  lastSeen: number;
}

/**
 * Initialize presence tracking for a player
 * Returns cleanup function
 */
export function initializePresence(
  roomCode: string,
  playerId: PlayerId
): () => void {
  
  const presenceRef = ref(database, `rooms/${roomCode}/presence/${playerId}`);
  
  // Set player as online
  set(presenceRef, {
    online: true,
    lastSeen: serverTimestamp()
  });

  // Set up disconnect handler - marks player offline when they disconnect
  const disconnectRef = onDisconnect(presenceRef);
  disconnectRef.set({
    online: false,
    lastSeen: serverTimestamp()
  });

  // Heartbeat - update lastSeen every 30 seconds while connected
  const heartbeatInterval = setInterval(() => {
    set(presenceRef, {
      online: true,
      lastSeen: serverTimestamp()
    });
  }, 30000);

  // Cleanup function
  return () => {
    clearInterval(heartbeatInterval);
    set(presenceRef, {
      online: false,
      lastSeen: serverTimestamp()
    });
  };
}

/**
 * Subscribe to all player presence in a room
 */
export function subscribeToPresence(
  roomCode: string,
  callback: (presence: Record<PlayerId, PlayerPresence>) => void
): () => void {
  
  const presenceRef = ref(database, `rooms/${roomCode}/presence`);
  
  const unsubscribe = onValue(presenceRef, (snapshot) => {
    const presenceData: Record<PlayerId, PlayerPresence> = {};
    
    if (snapshot.exists()) {
      const data = snapshot.val();
      Object.keys(data).forEach(playerId => {
        presenceData[playerId] = {
          playerId,
          online: data[playerId].online,
          lastSeen: data[playerId].lastSeen
        };
      });
    }
    
    callback(presenceData);
  });

  return unsubscribe;
}

/**
 * Check if a player is currently online
 */
export function isPlayerOnline(
  presence: Record<PlayerId, PlayerPresence>,
  playerId: PlayerId
): boolean {
  
  const playerPresence = presence[playerId];
  if (!playerPresence) return false;
  
  // Consider online if marked online AND last seen within 60 seconds
  const now = Date.now();
  const isRecent = (now - playerPresence.lastSeen) < 60000;
  
  return playerPresence.online && isRecent;
}

/**
 * Get list of offline players
 */
export function getOfflinePlayers(
  presence: Record<PlayerId, PlayerPresence>,
  allPlayerIds: PlayerId[]
): PlayerId[] {
  
  return allPlayerIds.filter(id => !isPlayerOnline(presence, id));
}

/**
 * Auto-pause game if any player disconnects
 * Returns cleanup function
 */
export function enableAutoPause(
  roomCode: string,
  onPause: (offlinePlayers: PlayerId[]) => void,
  onResume: () => void
): () => void {
  
  const gameRef = ref(database, `rooms/${roomCode}`);
  let allPlayerIds: PlayerId[] = [];

  // Get player list
  const gameUnsubscribe = onValue(gameRef, (snapshot) => {
    if (snapshot.exists()) {
      const gameState = snapshot.val();
      allPlayerIds = gameState.players.map((p: any) => p.id);
    }
  });

  // Monitor presence
  const presenceUnsubscribe = subscribeToPresence(roomCode, (presence) => {
    const offline = getOfflinePlayers(presence, allPlayerIds);
    
    if (offline.length > 0) {
      onPause(offline);
    } else if (allPlayerIds.length > 0) {
      onResume();
    }
  });

  return () => {
    gameUnsubscribe();
    presenceUnsubscribe();
  };
}