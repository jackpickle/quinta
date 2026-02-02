import { ref, update, set, get, onValue, remove } from 'firebase/database';
import { database } from './config';
import { GameState, Player, PlayerId, ChipColor, GameSettings, Card } from '@/types';
import { createNewGame } from '@/lib/game';
import { getPlayerId, savePlayerName } from '@/lib/firebase/player-identity';

/**
 * Lobby-specific state (before game starts)
 */
export interface LobbyState {
  roomId: string;
  status: 'waiting';
  settings: GameSettings;
  players: Array<{
    id: PlayerId;
    name: string;
    color: ChipColor | null; // null = not selected yet
    isHost: boolean;
    isReady: boolean;
  }>;
  createdAt: number;
}

/**
 * Available chip colors
 */
export const AVAILABLE_COLORS: ChipColor[] = [
  'coral',
  'mint',
  'sky',
  'peach',
  'lavender',
  'yellow'
];

/**
 * Create a new lobby (before game initialization)
 */
export async function createLobby(
  hostName: string,
  customSettings?: Partial<GameSettings>
): Promise<string> {
  const hostId = getPlayerId();
  savePlayerName(hostName);
  
  const roomCode = generateRoomCode();
  
  const defaultSettings: GameSettings = {
    allowChipOverride: false,
    deckSize: 100,
    cardsPerNumber: 1,
    handSize: 5,
    winLength: 5,
    drawOnHigher: false,
    maxPlayers: 6
  };

  const settings = { ...defaultSettings, ...customSettings };

  const lobbyState: LobbyState = {
    roomId: roomCode,
    status: 'waiting',
    settings,
    players: [
      {
        id: hostId,
        name: hostName,
        color: null,
        isHost: true,
        isReady: false
      }
    ],
    createdAt: Date.now()
  };

  const roomRef = ref(database, `rooms/${roomCode}`);
  await set(roomRef, lobbyState);

  return roomCode;
}

/**
 * Join an existing lobby
 */
export async function joinLobby(
  roomCode: string,
  playerId: PlayerId,
  playerName: string
): Promise<{ success: boolean; error?: string }> {
  const roomRef = ref(database, `rooms/${roomCode}`);
  
  try {
    const snapshot = await get(roomRef);
    
    if (!snapshot.exists()) {
      return { success: false, error: 'Room not found' };
    }

    const lobbyState = snapshot.val() as LobbyState;

    // Check if game already started
    if (lobbyState.status !== 'waiting') {
      return { success: false, error: 'Game already in progress' };
    }

    // Check if room is full
    if (lobbyState.players.length >= lobbyState.settings.maxPlayers) {
      return { success: false, error: 'Room is full' };
    }

    // Check if player is already in room
    if (lobbyState.players.some(p => p.id === playerId)) {
      return { success: false, error: 'Already in this room' };
    }

    // Add player to lobby
    const newPlayer = {
      id: playerId,
      name: playerName,
      color: null,
      isHost: false,
      isReady: false
    };

    await update(roomRef, {
      players: [...lobbyState.players, newPlayer]
    });

    return { success: true };

  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Select a chip color
 */
export async function selectColor(
  roomCode: string,
  playerId: PlayerId,
  color: ChipColor
): Promise<{ success: boolean; error?: string }> {
  const roomRef = ref(database, `rooms/${roomCode}`);
  
  try {
    const snapshot = await get(roomRef);
    
    if (!snapshot.exists()) {
      return { success: false, error: 'Room not found' };
    }

    const lobbyState = snapshot.val() as LobbyState;

    // Check if color is already taken
    const colorTaken = lobbyState.players.some(
      p => p.color === color && p.id !== playerId
    );

    if (colorTaken) {
      return { success: false, error: 'Color already taken' };
    }

    // Update player's color
    const updatedPlayers = lobbyState.players.map(p =>
      p.id === playerId ? { ...p, color } : p
    );

    await update(roomRef, { players: updatedPlayers });

    return { success: true };

  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Toggle player ready state
 */
export async function toggleReady(
  roomCode: string,
  playerId: PlayerId
): Promise<{ success: boolean; error?: string }> {
  const roomRef = ref(database, `rooms/${roomCode}`);
  
  try {
    const snapshot = await get(roomRef);
    
    if (!snapshot.exists()) {
      return { success: false, error: 'Room not found' };
    }

    const lobbyState = snapshot.val() as LobbyState;

    // Find player
    const player = lobbyState.players.find(p => p.id === playerId);
    if (!player) {
      return { success: false, error: 'Player not in room' };
    }

    // Can't ready without a color
    if (!player.color) {
      return { success: false, error: 'Must select a color first' };
    }

    // Toggle ready state
    const updatedPlayers = lobbyState.players.map(p =>
      p.id === playerId ? { ...p, isReady: !p.isReady } : p
    );

    await update(roomRef, { players: updatedPlayers });

    return { success: true };

  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Check if lobby can start (host only)
 */
export function canStartGame(lobbyState: LobbyState): { 
  canStart: boolean; 
  reason?: string 
} {
  // Need at least 2 players
  if (lobbyState.players.length < 2) {
    return { canStart: false, reason: 'Need at least 2 players' };
  }

  // All players must have colors
  const allHaveColors = lobbyState.players.every(p => p.color !== null);
  if (!allHaveColors) {
    return { canStart: false, reason: 'All players must select colors' };
  }

  // All non-host players must be ready
  const allReady = lobbyState.players
    .filter(p => !p.isHost)
    .every(p => p.isReady);
  
  if (!allReady && lobbyState.players.length > 1) {
    return { canStart: false, reason: 'All players must be ready' };
  }

  return { canStart: true };
}

/**
 * Start the game (converts lobby to game state)
 */
export async function startGameFromLobby(
  roomCode: string,
  hostId: PlayerId
): Promise<{ success: boolean; error?: string }> {
  const roomRef = ref(database, `rooms/${roomCode}`);

  try {
    const snapshot = await get(roomRef);

    if (!snapshot.exists()) {
      return { success: false, error: 'Room not found' };
    }

    const lobbyState = snapshot.val() as LobbyState;

    // Verify host
    const host = lobbyState.players.find(p => p.id === hostId);
    if (!host?.isHost) {
      return { success: false, error: 'Only host can start game' };
    }

    // Check if can start
    const startCheck = canStartGame(lobbyState);
    if (!startCheck.canStart) {
      return { success: false, error: startCheck.reason };
    }

    // Convert lobby players to game players (with colors guaranteed)
    const gamePlayers = lobbyState.players.map(p => ({
      id: p.id,
      name: p.name,
      color: p.color!,
      isHost: p.isHost
    }));

    // Create game state
    const gameState = createNewGame(
      roomCode,
      gamePlayers,
      lobbyState.settings
    );

    // Extract hands for private storage
    const privateHands: Record<string, { hand: Card[] }> = {};
    const playersWithoutHands = gameState.players.map((player) => {
      privateHands[player.id] = { hand: player.hand };
      const { hand: _hand, ...playerWithoutHand } = player;
      return { ...playerWithoutHand, hand: [] };
    });

    // Replace lobby with game state (hands stored privately)
    await update(roomRef, {
      ...gameState,
      players: playersWithoutHands,
      privateHands,
      discardPile: gameState.discardPile || [],
    });

    return { success: true };

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Update lobby settings (host only)
 */
export async function updateLobbySettings(
  roomCode: string,
  hostId: PlayerId,
  settings: Partial<GameSettings>
): Promise<{ success: boolean; error?: string }> {
  const roomRef = ref(database, `rooms/${roomCode}`);
  
  try {
    const snapshot = await get(roomRef);
    
    if (!snapshot.exists()) {
      return { success: false, error: 'Room not found' };
    }

    const lobbyState = snapshot.val() as LobbyState;

    // Verify host
    const host = lobbyState.players.find(p => p.id === hostId);
    if (!host?.isHost) {
      return { success: false, error: 'Only host can change settings' };
    }

    // Merge settings
    const updatedSettings = { ...lobbyState.settings, ...settings };

    await update(roomRef, { settings: updatedSettings });

    return { success: true };

  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Subscribe to lobby state changes
 */
export function subscribeToLobby(
  roomCode: string,
  callback: (lobbyState: LobbyState | GameState | null) => void
): () => void {
  const roomRef = ref(database, `rooms/${roomCode}`);
  
  const unsubscribe = onValue(roomRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.val());
    } else {
      callback(null);
    }
  });

  return unsubscribe;
}

/**
 * Leave lobby (removes player)
 */
export async function leaveLobby(
  roomCode: string,
  playerId: PlayerId
): Promise<{ success: boolean; error?: string }> {
  const roomRef = ref(database, `rooms/${roomCode}`);
  
  try {
    const snapshot = await get(roomRef);
    
    if (!snapshot.exists()) {
      return { success: false, error: 'Room not found' };
    }

    const lobbyState = snapshot.val() as LobbyState;

    // Remove player
    const updatedPlayers = lobbyState.players.filter(p => p.id !== playerId);

    // If host leaves, delete room OR promote new host
    const wasHost = lobbyState.players.find(p => p.id === playerId)?.isHost;
    
    if (wasHost && updatedPlayers.length > 0) {
      // Promote first remaining player to host
      updatedPlayers[0].isHost = true;
      await update(roomRef, { players: updatedPlayers });
    } else if (wasHost) {
      // No players left, delete room
      await remove(roomRef);
    } else {
      // Regular player leaving
      await update(roomRef, { players: updatedPlayers });
    }

    return { success: true };

  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Get available colors for a lobby
 */
export function getAvailableColors(lobbyState: LobbyState): ChipColor[] {
  const takenColors = lobbyState.players
    .map(p => p.color)
    .filter((c): c is ChipColor => c !== null);
  
  return AVAILABLE_COLORS.filter(color => !takenColors.includes(color));
}

/**
 * Reset a finished game back to lobby state (for rematch)
 */
export async function resetToLobby(
  roomCode: string
): Promise<{ success: boolean; error?: string }> {
  const roomRef = ref(database, `rooms/${roomCode}`);

  try {
    const snapshot = await get(roomRef);

    if (!snapshot.exists()) {
      return { success: false, error: 'Room not found' };
    }

    const currentState = snapshot.val();

    // Get players from current state (works for both game and lobby state)
    const players = currentState.players || [];

    // Convert game players back to lobby players
    const lobbyPlayers = players.map((p: any) => ({
      id: p.id,
      name: p.name,
      color: p.color || null,
      isHost: p.isHost,
      isReady: false, // Reset ready state
    }));

    // Create fresh lobby state
    const lobbyState: LobbyState = {
      roomId: roomCode,
      status: 'waiting',
      settings: currentState.settings,
      players: lobbyPlayers,
      createdAt: Date.now(),
    };

    // Replace entire room with lobby state (clears board, deck, privateHands, etc.)
    await set(roomRef, lobbyState);

    return { success: true };

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Helper: Generate room code (reused from game-sync.ts)
function generateRoomCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}