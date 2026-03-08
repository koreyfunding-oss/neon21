/**
 * NEON21 — Deck Tools
 * Utilities for shoe/deck management and card operations
 */

const { CARDS_PER_DECK } = require('../config/constants');

const SUITS = ['♠', '♥', '♦', '♣'];
const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

/**
 * Build a fresh shoe of n decks
 */
function buildShoe(numDecks = 6) {
  const shoe = [];
  for (let d = 0; d < numDecks; d++) {
    for (const suit of SUITS) {
      for (const rank of RANKS) {
        shoe.push({ rank, suit, label: `${rank}${suit}` });
      }
    }
  }
  return shoe;
}

/**
 * Shuffle an array in place (Fisher-Yates)
 */
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Count how many of a given rank remain in the shoe
 */
function countRemainingRank(dealtCards, rank, numDecks = 6) {
  const total = numDecks * 4; // 4 suits per deck
  const dealt = dealtCards.filter(c => String(c).toUpperCase() === String(rank).toUpperCase()).length;
  return Math.max(total - dealt, 0);
}

/**
 * Calculate deck penetration as a percentage (0-100)
 */
function penetrationPercent(cardsDealt, numDecks = 6) {
  const total = numDecks * CARDS_PER_DECK;
  return parseFloat(((cardsDealt / total) * 100).toFixed(1));
}

/**
 * Estimate decks remaining from cards dealt
 */
function decksRemaining(cardsDealt, numDecks = 6) {
  const remaining = numDecks * CARDS_PER_DECK - cardsDealt;
  return Math.max(remaining / CARDS_PER_DECK, 0.1);
}

/**
 * Normalize a card label to a standard format (e.g. 'jack' -> 'J', '10' -> '10')
 */
function normalizeCard(card) {
  const str = String(card).toUpperCase().trim();
  const map = {
    'ACE': 'A', '1': 'A', '11': 'A',
    'JACK': 'J', 'QUEEN': 'Q', 'KING': 'K',
    'FACE': '10'
  };
  if (map[str]) return map[str];
  const num = parseInt(str);
  if (!isNaN(num) && num >= 10) return '10';
  if (!isNaN(num) && num >= 2) return String(num);
  return str;
}

module.exports = {
  buildShoe,
  shuffle,
  countRemainingRank,
  penetrationPercent,
  decksRemaining,
  normalizeCard,
  SUITS,
  RANKS
};
