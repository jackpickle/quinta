import { Card, GameSettings } from '@/types';

/**
 * Generate a deck based on game settings
 */
export function generateDeck(settings: GameSettings): Card[] {
  const deck: Card[] = [];
  const totalNumbers = settings.deckSize; // 100 or 200
  const copiesPerNumber = settings.cardsPerNumber; // 1, 2, or 3

  for (let num = 0; num < totalNumbers; num++) {
    for (let copy = 0; copy < copiesPerNumber; copy++) {
      deck.push({
        value: num,
        id: `card-${num}-${copy}-${Date.now()}-${Math.random()}`
      });
    }
  }

  return deck;
}

/**
 * Shuffle deck using Fisher-Yates algorithm
 */
export function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck];
  
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  
  return shuffled;
}

/**
 * Deal cards to players
 */
export function dealCards(
  deck: Card[], 
  playerCount: number, 
  handSize: number
): { hands: Card[][], remainingDeck: Card[] } {
  const hands: Card[][] = Array(playerCount).fill(null).map(() => []);
  let deckCopy = [...deck];

  // Deal handSize cards to each player
  for (let i = 0; i < handSize; i++) {
    for (let p = 0; p < playerCount; p++) {
      if (deckCopy.length > 0) {
        hands[p].push(deckCopy.shift()!);
      }
    }
  }

  return {
    hands,
    remainingDeck: deckCopy
  };
}

/**
 * Draw a card from deck
 */
export function drawCard(deck: Card[]): { card: Card | null, remainingDeck: Card[] } {
  if (deck.length === 0) {
    return { card: null, remainingDeck: [] };
  }

  const deckCopy = [...deck];
  const card = deckCopy.shift()!;

  return {
    card,
    remainingDeck: deckCopy
  };
}

/**
 * Add card to discard pile
 */
export function discardCard(card: Card, discardPile: Card[]): Card[] {
  return [...discardPile, card];
}

/**
 * Reshuffle discard pile into deck (for when deck runs out)
 */
export function reshuffleDiscardIntoDeck(discardPile: Card[]): Card[] {
  return shuffleDeck(discardPile);
}