import { ref, set, onValue, update, get } from 'firebase/database';
import { database } from './config';
import { GameState, PlayerId, Card, TurnHistoryEntry } from '@/types';

/**
 * Generate a random 6-character room code
 */
export function generateRoomCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Create a new game room in Firebase with private hands
 */
export async function createGameRoom(gameState: GameState): Promise<string> {
  const roomCode = generateRoomCode();
  const roomRef = ref(database, `rooms/${roomCode}`);

  // Extract hands from players and store them privately
  const privateHands: Record<string, { hand: Card[] }> = {};
  const playersWithoutHands = gameState.players.map((player) => {
    privateHands[player.id] = { hand: player.hand };
    const { hand: _hand, ...playerWithoutHand } = player;
    return { ...playerWithoutHand, hand: [] }; // Empty hand in public data
  });

  await set(roomRef, {
    ...gameState,
    players: playersWithoutHands,
    privateHands,
    roomId: roomCode,
    createdAt: Date.now(),
  });

  return roomCode;
}

/**
 * Join an existing game room
 */
export async function joinGameRoom(
  roomCode: string,
  player: { id: PlayerId; name: string; color: string; isHost: boolean }
): Promise<{ success: boolean; error?: string }> {
  const roomRef = ref(database, `rooms/${roomCode}`);

  try {
    const snapshot = await get(roomRef);

    if (!snapshot.exists()) {
      return { success: false, error: 'Room not found' };
    }

    const gameState = snapshot.val() as GameState;

    // Check if room is full
    if (gameState.players.length >= gameState.settings.maxPlayers) {
      return { success: false, error: 'Room is full' };
    }

    // Check if color is already taken
    const colorTaken = gameState.players.some((p) => p.color === player.color);
    if (colorTaken) {
      return { success: false, error: 'Color already taken' };
    }

    // Add player to room
    const updatedPlayers = [...gameState.players, { ...player, hand: [] }];
    await update(roomRef, {
      players: updatedPlayers,
    });

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Listen to game state changes in real-time
 * Note: This returns the public state without private hands
 */
export function subscribeToGameState(
  roomCode: string,
  callback: (gameState: GameState | null) => void
): () => void {
  const roomRef = ref(database, `rooms/${roomCode}`);

  const unsubscribe = onValue(roomRef, (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.val();
      // Remove privateHands from the returned state
      const { privateHands: _privateHands, turnHistory: rawHistory, ...publicState } = data;

      // Convert turnHistory from Firebase object to sorted array
      let turnHistory: TurnHistoryEntry[] = [];
      if (rawHistory && typeof rawHistory === 'object') {
        turnHistory = Object.values(rawHistory) as TurnHistoryEntry[];
        turnHistory.sort((a, b) => a.timestamp - b.timestamp);
      }

      callback({ ...publicState, turnHistory } as GameState);
    } else {
      callback(null);
    }
  });

  return unsubscribe;
}

/**
 * Subscribe to a player's private hand
 */
export function subscribeToPrivateHand(
  roomCode: string,
  playerId: PlayerId,
  callback: (hand: Card[]) => void
): () => void {
  const handRef = ref(database, `rooms/${roomCode}/privateHands/${playerId}/hand`);

  const unsubscribe = onValue(handRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.val() as Card[]);
    } else {
      callback([]);
    }
  });

  return unsubscribe;
}

/**
 * Get a player's private hand (one-time fetch)
 */
export async function getPrivateHand(
  roomCode: string,
  playerId: PlayerId
): Promise<Card[]> {
  const handRef = ref(database, `rooms/${roomCode}/privateHands/${playerId}/hand`);
  const snapshot = await get(handRef);
  return snapshot.exists() ? (snapshot.val() as Card[]) : [];
}

/**
 * Update a player's private hand
 */
export async function updatePrivateHand(
  roomCode: string,
  playerId: PlayerId,
  hand: Card[]
): Promise<void> {
  const handRef = ref(database, `rooms/${roomCode}/privateHands/${playerId}`);
  await update(handRef, { hand });
}

/**
 * Get all private hands (for server-side operations like turn execution)
 */
export async function getAllPrivateHands(
  roomCode: string
): Promise<Record<PlayerId, Card[]>> {
  const handsRef = ref(database, `rooms/${roomCode}/privateHands`);
  const snapshot = await get(handsRef);

  if (!snapshot.exists()) {
    return {};
  }

  const data = snapshot.val();
  const hands: Record<PlayerId, Card[]> = {};

  for (const playerId of Object.keys(data)) {
    hands[playerId] = data[playerId].hand || [];
  }

  return hands;
}

/**
 * Update multiple private hands at once (used after turn execution)
 */
export async function updateAllPrivateHands(
  roomCode: string,
  hands: Record<PlayerId, Card[]>
): Promise<void> {
  const updates: Record<string, Card[]> = {};

  for (const [playerId, hand] of Object.entries(hands)) {
    updates[`privateHands/${playerId}/hand`] = hand;
  }

  const roomRef = ref(database, `rooms/${roomCode}`);
  await update(roomRef, updates);
}

/**
 * Update game state in Firebase
 */
export async function updateGameState(
  roomCode: string,
  updates: Partial<GameState>
): Promise<void> {
  const roomRef = ref(database, `rooms/${roomCode}`);
  await update(roomRef, updates);
}

/**
 * Update specific player's hand (private data)
 * @deprecated Use updatePrivateHand instead
 */
export async function updatePlayerHand(
  roomCode: string,
  playerId: PlayerId,
  hand: Card[]
): Promise<void> {
  await updatePrivateHand(roomCode, playerId, hand);
}

/**
 * Start the game (host only)
 */
export async function startGame(roomCode: string): Promise<void> {
  await update(ref(database, `rooms/${roomCode}`), {
    status: 'playing',
  });
}

/**
 * Check if room exists
 */
export async function roomExists(roomCode: string): Promise<boolean> {
  const roomRef = ref(database, `rooms/${roomCode}`);
  const snapshot = await get(roomRef);
  return snapshot.exists();
}

/**
 * Delete a room (cleanup)
 */
export async function deleteRoom(roomCode: string): Promise<void> {
  const roomRef = ref(database, `rooms/${roomCode}`);
  await set(roomRef, null);
}
