import { GameState, Player, Card, TurnAction, Chip, PlayerId } from '@/types';
import { isValidPlacement } from './validation';
import { drawCard, discardCard, reshuffleDiscardIntoDeck } from '@/lib/game/deck';
import { getCellByNumber } from './board';

/**
 * Execute a turn action (Natural, Higher, or Pass)
 */
export function executeTurn(
  gameState: GameState,
  playerId: PlayerId,
  action: TurnAction,
  cardId?: string,
  targetNumber?: number
): { success: boolean; newState: GameState; error?: string } {
  
  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  
  // Validate it's this player's turn
  if (currentPlayer.id !== playerId) {
    return { success: false, newState: gameState, error: 'Not your turn' };
  }

  let newState = { ...gameState };

  try {
    switch (action) {
      case 'natural':
      case 'higher':
        if (!cardId || targetNumber === undefined) {
          return { success: false, newState: gameState, error: 'Missing card or target' };
        }
        newState = executeChipPlacement(newState, playerId, cardId, targetNumber, action);
        break;

      case 'pass':
        newState = executePass(newState, playerId);
        break;

      default:
        return { success: false, newState: gameState, error: 'Invalid action' };
    }

    // Advance to next player
    newState = advanceToNextPlayer(newState);

    return { success: true, newState };

  } catch (error) {
    return { 
      success: false, 
      newState: gameState, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Execute chip placement (Natural or Higher)
 */
function executeChipPlacement(
  gameState: GameState,
  playerId: PlayerId,
  cardId: string,
  targetNumber: number,
  action: TurnAction
): GameState {
  const playerIndex = gameState.players.findIndex(p => p.id === playerId);
  const player = gameState.players[playerIndex];
  
  // Find the card in player's hand
  const cardIndex = player.hand.findIndex(c => c.id === cardId);
  if (cardIndex === -1) {
    throw new Error('Card not found in hand');
  }
  const card = player.hand[cardIndex];

  // Validate placement
  const validation = isValidPlacement(
    gameState.board,
    card,
    targetNumber,
    action,
    gameState.settings
  );

  if (!validation.valid) {
    throw new Error(validation.reason || 'Invalid placement');
  }

  // Place the chip on the board
  const targetCell = getCellByNumber(gameState.board, targetNumber);
  if (!targetCell) {
    throw new Error('Target cell not found');
  }

  const chip: Chip = {
    playerId: player.id,
    color: player.color
  };

  // Update board (find and update the cell)
  const newBoard = gameState.board.map(row =>
    row.map(cell =>
      cell.number === targetNumber
        ? { ...cell, chip }
        : cell
    )
  );

  // Remove card from hand
  const newHand = player.hand.filter((_, i) => i !== cardIndex);

  // Discard the card
  const newDiscardPile = discardCard(card, gameState.discardPile);

  // Draw a card if Natural (or if drawOnHigher setting is enabled)
  let newDeck = gameState.deck;
  let finalHand = newHand;

  const shouldDraw = action === 'natural' || 
                     (action === 'higher' && gameState.settings.drawOnHigher);

  if (shouldDraw && finalHand.length < gameState.settings.handSize) {
    const drawResult = handleDrawCard(newDeck, gameState.discardPile);
    
    if (drawResult.card) {
      finalHand = [...newHand, drawResult.card];
    }
    
    newDeck = drawResult.remainingDeck;
  }

  // Update player
  const newPlayers = [...gameState.players];
  newPlayers[playerIndex] = {
    ...player,
    hand: finalHand
  };

  return {
    ...gameState,
    board: newBoard,
    players: newPlayers,
    deck: newDeck,
    discardPile: newDiscardPile
  };
}

/**
 * Execute pass action
 */
function executePass(gameState: GameState, playerId: PlayerId): GameState {
  const playerIndex = gameState.players.findIndex(p => p.id === playerId);
  const player = gameState.players[playerIndex];

  // Draw a card if hand is not full
  let newDeck = gameState.deck;
  let newHand = player.hand;

  if (newHand.length < gameState.settings.handSize) {
    const drawResult = handleDrawCard(newDeck, gameState.discardPile);
    
    if (drawResult.card) {
      newHand = [...newHand, drawResult.card];
    }
    
    newDeck = drawResult.remainingDeck;
  }

  // Update player
  const newPlayers = [...gameState.players];
  newPlayers[playerIndex] = {
    ...player,
    hand: newHand
  };

  return {
    ...gameState,
    players: newPlayers,
    deck: newDeck
  };
}

/**
 * Handle drawing a card (with deck reshuffle if needed)
 */
function handleDrawCard(
  deck: Card[],
  discardPile: Card[]
): { card: Card | null; remainingDeck: Card[] } {
  
  // If deck has cards, draw from it
  if (deck.length > 0) {
    return drawCard(deck);
  }

  // If deck is empty but discard pile has cards, reshuffle
  if (discardPile.length > 0) {
    const reshuffledDeck = reshuffleDiscardIntoDeck(discardPile);
    return drawCard(reshuffledDeck);
  }

  // No cards available anywhere
  return { card: null, remainingDeck: [] };
}

/**
 * Advance to the next player
 */
function advanceToNextPlayer(gameState: GameState): GameState {
  const nextPlayerIndex = (gameState.currentPlayerIndex + 1) % gameState.players.length;
  
  return {
    ...gameState,
    currentPlayerIndex: nextPlayerIndex
  };
}

/**
 * Get the current player
 */
export function getCurrentPlayer(gameState: GameState): Player {
  return gameState.players[gameState.currentPlayerIndex];
}

/**
 * Check if it's a specific player's turn
 */
export function isPlayerTurn(gameState: GameState, playerId: PlayerId): boolean {
  return getCurrentPlayer(gameState).id === playerId;
}