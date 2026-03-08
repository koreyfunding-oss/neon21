/**
 * NEON21 — Shoe State
 * Tracks the current deck shoe: cards dealt, remaining, penetration
 */

const { DECKS, CARDS_PER_DECK, PENETRATION_TARGET } = require('../config/constants');

class Shoe {
  constructor(numDecks = DECKS) {
    this.numDecks = numDecks;
    this.totalCards = numDecks * CARDS_PER_DECK;
    this.cardsDealt = 0;
    this.history = [];
  }

  deal(card) {
    this.cardsDealt++;
    this.history.push({ card, ts: Date.now() });
    if (this.history.length > 500) this.history.shift();
  }

  undoLast() {
    if (this.history.length === 0) return null;
    const last = this.history.pop();
    this.cardsDealt = Math.max(0, this.cardsDealt - 1);
    return last;
  }

  get cardsRemaining() {
    return Math.max(this.totalCards - this.cardsDealt, 0);
  }

  get decksRemaining() {
    return this.cardsRemaining / CARDS_PER_DECK;
  }

  get penetration() {
    return this.totalCards > 0 ? this.cardsDealt / this.totalCards : 0;
  }

  get isPenetrationReached() {
    return this.penetration >= PENETRATION_TARGET;
  }

  reset() {
    this.cardsDealt = 0;
    this.history = [];
  }

  getState() {
    return {
      numDecks: this.numDecks,
      totalCards: this.totalCards,
      cardsDealt: this.cardsDealt,
      cardsRemaining: this.cardsRemaining,
      decksRemaining: parseFloat(this.decksRemaining.toFixed(2)),
      penetration: parseFloat((this.penetration * 100).toFixed(1)),
      isPenetrationReached: this.isPenetrationReached
    };
  }
}

module.exports = { Shoe };
