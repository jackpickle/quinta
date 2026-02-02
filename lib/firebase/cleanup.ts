import { ref, get, remove, query, orderByChild, endAt } from 'firebase/database';
import { database } from './config';
import { GameState } from '@/types';

/**
 * Room expiration rules
 */
const EXPIRATION_RULES = {
  // Lobby rooms expire after 2 hours of inactivity
  LOBBY_TIMEOUT: 2 * 60 * 60 * 1000, // 2 hours
  
  // Finished games expire after 24 hours
  FINISHED_GAME_TIMEOUT: 24 * 60 * 60 * 1000, // 24 hours
  
  // Active games expire after 7 days of inactivity
  ACTIVE_GAME_TIMEOUT: 7 * 24 * 60 * 60 * 1000, // 7 days
  
  // Empty rooms (no players) expire immediately
  EMPTY_ROOM_TIMEOUT: 0
};

/**
 * Check if a room should be deleted
 */
function shouldDeleteRoom(gameState: GameState): boolean {
  const now = Date.now();
  const age = now - gameState.createdAt;
  
  // Empty room
  if (gameState.players.length === 0) {
    return true;
  }
  
  // Check expiration based on status
  switch (gameState.status) {
    case 'waiting':
      return age > EXPIRATION_RULES.LOBBY_TIMEOUT;
    
    case 'finished':
      return age > EXPIRATION_RULES.FINISHED_GAME_TIMEOUT;
    
    case 'playing':
      // Check last activity via presence system
      return age > EXPIRATION_RULES.ACTIVE_GAME_TIMEOUT;
    
    default:
      return false;
  }
}

/**
 * Clean up a single room by code
 */
export async function cleanupRoom(roomCode: string): Promise<{
  deleted: boolean;
  reason?: string;
}> {
  
  const roomRef = ref(database, `rooms/${roomCode}`);
  
  try {
    const snapshot = await get(roomRef);
    
    if (!snapshot.exists()) {
      return { deleted: false, reason: 'Room does not exist' };
    }
    
    const gameState = snapshot.val() as GameState;
    
    if (shouldDeleteRoom(gameState)) {
      await remove(roomRef);
      return { deleted: true, reason: getDeleteReason(gameState) };
    }
    
    return { deleted: false, reason: 'Room is still active' };
    
  } catch (error) {
    return { 
      deleted: false, 
      reason: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Get human-readable delete reason
 */
function getDeleteReason(gameState: GameState): string {
  if (gameState.players.length === 0) {
    return 'Empty room';
  }
  
  switch (gameState.status) {
    case 'waiting':
      return 'Lobby expired (2h inactivity)';
    case 'finished':
      return 'Finished game expired (24h)';
    case 'playing':
      return 'Active game expired (7d inactivity)';
    default:
      return 'Expired';
  }
}

/**
 * Clean up all expired rooms
 * Returns list of deleted room codes
 */
export async function cleanupExpiredRooms(): Promise<string[]> {
  const roomsRef = ref(database, 'rooms');
  
  try {
    const snapshot = await get(roomsRef);
    
    if (!snapshot.exists()) {
      return [];
    }
    
    const allRooms = snapshot.val();
    const deletedRooms: string[] = [];
    
    // Check each room
    for (const [roomCode, roomData] of Object.entries(allRooms)) {
      const gameState = roomData as GameState;
      
      if (shouldDeleteRoom(gameState)) {
        await remove(ref(database, `rooms/${roomCode}`));
        deletedRooms.push(roomCode);
        console.log(`Deleted room ${roomCode}: ${getDeleteReason(gameState)}`);
      }
    }
    
    return deletedRooms;
    
  } catch (error) {
    console.error('Error cleaning up rooms:', error);
    return [];
  }
}

/**
 * Schedule automatic cleanup (run periodically)
 * Call this when app starts
 */
export function scheduleAutomaticCleanup(intervalMinutes: number = 60): () => void {
  
  console.log(`Scheduled automatic room cleanup every ${intervalMinutes} minutes`);
  
  // Run immediately on start
  cleanupExpiredRooms();
  
  // Then run periodically
  const interval = setInterval(() => {
    cleanupExpiredRooms();
  }, intervalMinutes * 60 * 1000);
  
  // Return cleanup function
  return () => {
    clearInterval(interval);
  };
}

/**
 * Clean up rooms older than a specific timestamp
 * Useful for one-time bulk cleanup
 */
export async function cleanupRoomsOlderThan(timestamp: number): Promise<string[]> {
  const roomsRef = ref(database, 'rooms');
  
  try {
    const snapshot = await get(roomsRef);
    
    if (!snapshot.exists()) {
      return [];
    }
    
    const allRooms = snapshot.val();
    const deletedRooms: string[] = [];
    
    for (const [roomCode, roomData] of Object.entries(allRooms)) {
      const gameState = roomData as GameState;
      
      if (gameState.createdAt < timestamp) {
        await remove(ref(database, `rooms/${roomCode}`));
        deletedRooms.push(roomCode);
      }
    }
    
    return deletedRooms;
    
  } catch (error) {
    console.error('Error cleaning up old rooms:', error);
    return [];
  }
}

/**
 * Clean up rooms with no players
 */
export async function cleanupEmptyRooms(): Promise<string[]> {
  const roomsRef = ref(database, 'rooms');
  
  try {
    const snapshot = await get(roomsRef);
    
    if (!snapshot.exists()) {
      return [];
    }
    
    const allRooms = snapshot.val();
    const deletedRooms: string[] = [];
    
    for (const [roomCode, roomData] of Object.entries(allRooms)) {
      const gameState = roomData as GameState;
      
      if (gameState.players.length === 0) {
        await remove(ref(database, `rooms/${roomCode}`));
        deletedRooms.push(roomCode);
        console.log(`Deleted empty room: ${roomCode}`);
      }
    }
    
    return deletedRooms;
    
  } catch (error) {
    console.error('Error cleaning up empty rooms:', error);
    return [];
  }
}

/**
 * Get cleanup statistics
 */
export async function getCleanupStats(): Promise<{
  totalRooms: number;
  expiredRooms: number;
  emptyRooms: number;
  activeGames: number;
  waitingLobbies: number;
  finishedGames: number;
}> {
  
  const roomsRef = ref(database, 'rooms');
  
  try {
    const snapshot = await get(roomsRef);
    
    if (!snapshot.exists()) {
      return {
        totalRooms: 0,
        expiredRooms: 0,
        emptyRooms: 0,
        activeGames: 0,
        waitingLobbies: 0,
        finishedGames: 0
      };
    }
    
    const allRooms = snapshot.val();
    const stats = {
      totalRooms: 0,
      expiredRooms: 0,
      emptyRooms: 0,
      activeGames: 0,
      waitingLobbies: 0,
      finishedGames: 0
    };
    
    for (const roomData of Object.values(allRooms)) {
      const gameState = roomData as GameState;
      stats.totalRooms++;
      
      if (gameState.players.length === 0) {
        stats.emptyRooms++;
      }
      
      if (shouldDeleteRoom(gameState)) {
        stats.expiredRooms++;
      }
      
      switch (gameState.status) {
        case 'waiting':
          stats.waitingLobbies++;
          break;
        case 'playing':
          stats.activeGames++;
          break;
        case 'finished':
          stats.finishedGames++;
          break;
      }
    }
    
    return stats;
    
  } catch (error) {
    console.error('Error getting cleanup stats:', error);
    return {
      totalRooms: 0,
      expiredRooms: 0,
      emptyRooms: 0,
      activeGames: 0,
      waitingLobbies: 0,
      finishedGames: 0
    };
  }
}

/**
 * Force delete a specific room (admin function)
 */
export async function forceDeleteRoom(roomCode: string): Promise<boolean> {
  try {
    await remove(ref(database, `rooms/${roomCode}`));
    return true;
  } catch (error) {
    console.error('Error force deleting room:', error);
    return false;
  }
}