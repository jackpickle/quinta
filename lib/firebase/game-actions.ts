import { ref, update, get, push } from "firebase/database";
import { database } from "./config";
import { GameState, PlayerId, TurnAction, Card, TurnHistoryEntry } from "@/types";
import { executeTurn, checkWinner } from "@/lib/game";
import {
  getAllPrivateHands,
  updateAllPrivateHands,
  getPrivateHand,
} from "./game-sync";

import { getValidPlacements } from "@/lib/game/validation";
import { getCellByNumber } from "@/lib/game/board";

/**
 * Execute a player's turn and sync to Firebase
 */
export async function executePlayerTurn(
  roomCode: string,
  playerId: PlayerId,
  action: TurnAction,
  cardId?: string,
  targetNumber?: number,
): Promise<{
  success: boolean;
  error?: string;
  gameOver?: boolean;
  winner?: PlayerId;
}> {
  const roomRef = ref(database, `rooms/${roomCode}`);

  try {
    // Get current game state
    const snapshot = await get(roomRef);

    if (!snapshot.exists()) {
      return { success: false, error: "Game not found" };
    }

    const data = snapshot.val();
    const { privateHands: _privateHands, ...publicState } = data;
    const currentState = publicState as GameState;

    currentState.board = currentState.board.map((row) =>
      row.map((cell) => ({
        ...cell,
        chip: cell.chip || null,
      })),
    );

    // Verify game is in progress
    if (currentState.status !== "playing") {
      return { success: false, error: "Game is not in progress" };
    }

    // Get all private hands to reconstruct full state
    const hands = await getAllPrivateHands(roomCode);

    // Discard pile was never init.
    if (!currentState.discardPile || !Array.isArray(currentState.discardPile)) {
      currentState.discardPile = [];
    }

    // Reconstruct full game state with hands
    const fullState: GameState = {
      ...currentState,
      players: currentState.players.map((player) => ({
        ...player,
        hand: hands[player.id] || [],
      })),
    };

    // Execute turn locally
    const turnResult = executeTurn(
      fullState,
      playerId,
      action,
      cardId,
      targetNumber,
    );

    if (!turnResult.success) {
      return { success: false, error: turnResult.error };
    }

    // Check for winner
    const winCheck = checkWinner(
      turnResult.newState.board,
      turnResult.newState.settings.winLength,
    );

    // Extract hands from the new state to store privately
    const newHands: Record<PlayerId, Card[]> = {};
    const playersWithoutHands = turnResult.newState.players.map((player) => {
      newHands[player.id] = player.hand;
      const { hand: _hand, ...playerWithoutHand } = player;
      return { ...playerWithoutHand, hand: [] };
    });

    // Prepare public state update
    const publicUpdate = {
      ...turnResult.newState,
      players: playersWithoutHands,
    };

    if (winCheck.winner) {
      // Game over!
      publicUpdate.winner = winCheck.winner;
      publicUpdate.status = "finished";
    }

    // Create turn history entry
    const currentPlayer = fullState.players[fullState.currentPlayerIndex];
    const playedCard = cardId ? fullState.players.find(p => p.id === playerId)?.hand.find(c => c.id === cardId) : undefined;

    const historyEntry: TurnHistoryEntry = {
      playerId,
      playerName: currentPlayer.name,
      playerColor: currentPlayer.color,
      action,
      cardValue: playedCard?.value,
      cellNumber: targetNumber,
      timestamp: Date.now(),
    };

    // Update Firebase with public state and private hands
    await update(roomRef, publicUpdate);
    await updateAllPrivateHands(roomCode, newHands);

    // Push turn history entry
    const historyRef = ref(database, `rooms/${roomCode}/turnHistory`);
    await push(historyRef, historyEntry);

    if (winCheck.winner) {
      return {
        success: true,
        gameOver: true,
        winner: winCheck.winner,
      };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function getValidMovesForCard(
  roomCode: string,
  playerId: PlayerId,
  cardId: string,
): Promise<{ natural: number[]; higher: number[] } | null> {
  const roomRef = ref(database, `rooms/${roomCode}`);

  try {
    const snapshot = await get(roomRef);

    if (!snapshot.exists()) {
      return null;
    }

    const data = snapshot.val();
    const { privateHands: _privateHands, ...publicState } = data;
    const gameState = publicState as GameState;

    gameState.board = gameState.board.map((row) =>
      row.map((cell) => ({
        ...cell,
        chip: cell.chip || null, // Ensure chip property exists
      })),
    );

    // Get player's private hand
    const hand = await getPrivateHand(roomCode, playerId);

    if (!hand || hand.length === 0) {
      return null;
    }

    const card = hand.find((c: Card) => c.id === cardId);

    if (!card) {
      return null;
    }

    const moves = getValidPlacements(gameState.board, card, gameState.settings);

    return moves;
  } catch (error) {
    return null;
  }
}

/**
 * Check if it's a specific player's turn
 */
export async function isMyTurn(
  roomCode: string,
  playerId: PlayerId,
): Promise<boolean> {
  const roomRef = ref(database, `rooms/${roomCode}`);

  try {
    const snapshot = await get(roomRef);

    if (!snapshot.exists()) {
      return false;
    }

    const gameState = snapshot.val() as GameState;
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];

    return currentPlayer.id === playerId;
  } catch (error) {
    return false;
  }
}

/**
 * Get current game summary (for UI display)
 */
export async function getGameSummary(roomCode: string): Promise<{
  currentPlayerName: string;
  currentPlayerColor: string;
  turnNumber: number;
  chipsPlaced: Record<string, number>; // playerId -> chip count
} | null> {
  const roomRef = ref(database, `rooms/${roomCode}`);

  try {
    const snapshot = await get(roomRef);

    if (!snapshot.exists()) {
      return null;
    }

    const gameState = snapshot.val() as GameState;
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];

    // Count chips on board for each player
    const chipsPlaced: Record<string, number> = {};
    gameState.players.forEach((p) => {
      chipsPlaced[p.id] = 0;
    });

    gameState.board = gameState.board.map((row) =>
      row.map((cell) => ({
        ...cell,
        chip: cell.chip || null, // Ensure chip exists
      })),
    );

    // Calculate turn number (total chips placed / number of players)
    const totalChips = Object.values(chipsPlaced).reduce((a, b) => a + b, 0);
    const turnNumber = Math.floor(totalChips / gameState.players.length) + 1;

    return {
      currentPlayerName: currentPlayer.name,
      currentPlayerColor: currentPlayer.color,
      turnNumber,
      chipsPlaced,
    };
  } catch (error) {
    return null;
  }
}

/**
 * Forfeit game (resign)
 */
export async function forfeitGame(
  roomCode: string,
  playerId: PlayerId,
): Promise<{ success: boolean; error?: string }> {
  const roomRef = ref(database, `rooms/${roomCode}`);

  try {
    const snapshot = await get(roomRef);

    if (!snapshot.exists()) {
      return { success: false, error: "Game not found" };
    }

    const gameState = snapshot.val() as GameState;

    // Find another player to declare winner
    const otherPlayer = gameState.players.find((p) => p.id !== playerId);

    if (!otherPlayer) {
      return { success: false, error: "No other players in game" };
    }

    // End game with other player as winner
    await update(roomRef, {
      status: "finished",
      winner: otherPlayer.id,
    });

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Request rematch (resets game state)
 */
export async function requestRematch(
  roomCode: string,
  playerId: PlayerId,
): Promise<{ success: boolean; error?: string }> {
  const roomRef = ref(database, `rooms/${roomCode}`);

  try {
    const snapshot = await get(roomRef);

    if (!snapshot.exists()) {
      return { success: false, error: "Game not found" };
    }

    const gameState = snapshot.val() as GameState;

    // Only host or winner can start rematch
    const player = gameState.players.find((p) => p.id === playerId);
    if (!player?.isHost && gameState.winner !== playerId) {
      return {
        success: false,
        error: "Only host or winner can request rematch",
      };
    }

    // Import game creation
    const { createNewGame } = await import("@/lib/game");

    // Create new game with same players and settings
    const newGame = createNewGame(
      roomCode,
      gameState.players.map((p) => ({
        id: p.id,
        name: p.name,
        color: p.color,
        isHost: p.isHost,
      })),
      gameState.settings,
    );

    // Extract hands for private storage
    const privateHands: Record<string, { hand: Card[] }> = {};
    const playersWithoutHands = newGame.players.map((player) => {
      privateHands[player.id] = { hand: player.hand };
      const { hand: _hand, ...playerWithoutHand } = player;
      return { ...playerWithoutHand, hand: [] };
    });

    // Update Firebase with new game state
    await update(roomRef, {
      ...newGame,
      players: playersWithoutHands,
      privateHands,
    });

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
