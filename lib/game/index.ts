// Export all game utilities
export * from './board';
export * from './deck';
export * from './validation';
export * from './win-detection';
export * from './turn';

// Export a game initializer
import { GameState, GameSettings, Player, PlayerId, ChipColor } from '@/types';
import { generateSpiralBoard } from './board';
import { generateDeck, shuffleDeck, dealCards } from './deck';

/**
 * Create a new game with default settings
 */
export function createNewGame(
  roomId: string,
  players: Array<{ id: PlayerId; name: string; color: ChipColor; isHost: boolean }>,
  customSettings?: Partial<GameSettings>
): GameState {
  
  // Default settings
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

  // Generate and shuffle deck
  const deck = shuffleDeck(generateDeck(settings));

  // Deal cards to players
  const { hands, remainingDeck } = dealCards(deck, players.length, settings.handSize);

  // Create player objects with hands
  const gamePlayers: Player[] = players.map((p, i) => ({
    ...p,
    hand: hands[i]
  }));

  // Generate board
  const board = generateSpiralBoard();

  // Create initial game state
  const gameState: GameState = {
    roomId,
    status: 'playing',
    settings,
    board,
    players: gamePlayers,
    currentPlayerIndex: 0,
    deck: remainingDeck,
    discardPile: [],
    winner: null,
    createdAt: Date.now()
  };

  return gameState;
}