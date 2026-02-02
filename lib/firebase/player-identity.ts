import { PlayerId } from '@/types';

const PLAYER_ID_KEY = 'quinta_player_id';
const PLAYER_NAME_KEY = 'quinta_player_name';

/**
 * Generate a unique player ID
 */
function generatePlayerId(): PlayerId {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 9);
  return `player-${timestamp}-${random}`;
}

/**
 * Get or create a persistent player ID
 * ID persists for the session (survives page refresh)
 */
export function getPlayerId(): PlayerId {
  if (typeof window === 'undefined') {
    return generatePlayerId(); // SSR fallback
  }

  let playerId = sessionStorage.getItem(PLAYER_ID_KEY);
  
  if (!playerId) {
    playerId = generatePlayerId();
    sessionStorage.setItem(PLAYER_ID_KEY, playerId);
  }
  
  return playerId;
}

/**
 * Save player's display name
 */
export function savePlayerName(name: string): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(PLAYER_NAME_KEY, name);
}

/**
 * Get saved player name (if any)
 */
export function getPlayerName(): string | null {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem(PLAYER_NAME_KEY);
}

/**
 * Get or prompt for player name
 */
export function ensurePlayerName(): string {
  const saved = getPlayerName();
  if (saved) return saved;
  
  // In a real app, this would be a UI form
  // For now, return a fallback
  return `Player ${Math.floor(Math.random() * 1000)}`;
}

/**
 * Get complete player identity
 */
export function getPlayerIdentity(): { id: PlayerId; name: string } {
  return {
    id: getPlayerId(),
    name: ensurePlayerName()
  };
}

/**
 * Clear player identity (for logout/reset)
 */
export function clearPlayerIdentity(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(PLAYER_ID_KEY);
  sessionStorage.removeItem(PLAYER_NAME_KEY);
}

/**
 * Check if player has a saved identity
 */
export function hasPlayerIdentity(): boolean {
  if (typeof window === 'undefined') return false;
  return sessionStorage.getItem(PLAYER_ID_KEY) !== null;
}