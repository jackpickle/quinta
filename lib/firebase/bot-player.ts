import { ref, update, get } from 'firebase/database';
import { database } from './config';
import { AVAILABLE_COLORS } from './lobby';
import type { LobbyState } from './lobby';
import type { PlayerId, ChipColor } from '@/types';
import { generateBotId, BOT_NAMES } from '@/lib/game/bot';

/**
 * Add a bot to the lobby (host only)
 */
export async function addBotToLobby(
  roomCode: string,
  hostId: PlayerId
): Promise<{ success: boolean; error?: string }> {
  const roomRef = ref(database, `rooms/${roomCode}`);

  try {
    const snapshot = await get(roomRef);
    if (!snapshot.exists()) return { success: false, error: 'Room not found' };

    const lobbyState = snapshot.val() as LobbyState;

    // Verify host
    const host = lobbyState.players.find(p => p.id === hostId);
    if (!host?.isHost) return { success: false, error: 'Only host can add bots' };

    // Check room not full
    if (lobbyState.players.length >= lobbyState.settings.maxPlayers) {
      return { success: false, error: 'Room is full' };
    }

    // Pick an unused bot name
    const usedNames = new Set(lobbyState.players.map(p => p.name));
    const botName = BOT_NAMES.find(n => !usedNames.has(n)) || `Bot ${lobbyState.players.length}`;

    // Auto-assign first available color
    const takenColors = lobbyState.players
      .map(p => p.color)
      .filter((c): c is ChipColor => c !== null);
    const availableColor = AVAILABLE_COLORS.find(c => !takenColors.includes(c));

    if (!availableColor) {
      return { success: false, error: 'No colors available' };
    }

    const botPlayer = {
      id: generateBotId(),
      name: botName,
      color: availableColor,
      isHost: false,
      isReady: true,
      isBot: true,
    };

    await update(roomRef, {
      players: [...lobbyState.players, botPlayer],
    });

    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Remove a bot from the lobby (host only)
 */
export async function removeBotFromLobby(
  roomCode: string,
  hostId: PlayerId,
  botId: PlayerId
): Promise<{ success: boolean; error?: string }> {
  const roomRef = ref(database, `rooms/${roomCode}`);

  try {
    const snapshot = await get(roomRef);
    if (!snapshot.exists()) return { success: false, error: 'Room not found' };

    const lobbyState = snapshot.val() as LobbyState;

    // Verify host
    const host = lobbyState.players.find(p => p.id === hostId);
    if (!host?.isHost) return { success: false, error: 'Only host can remove bots' };

    // Find and remove bot
    const botPlayer = lobbyState.players.find(p => p.id === botId && p.isBot);
    if (!botPlayer) return { success: false, error: 'Bot not found' };

    const updatedPlayers = lobbyState.players.filter(p => p.id !== botId);
    await update(roomRef, { players: updatedPlayers });

    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}
