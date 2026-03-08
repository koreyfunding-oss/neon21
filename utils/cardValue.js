/**
 * NEON21 — Card Value Utilities
 * Blackjack hand totals, soft/hard hands, bust detection
 */

const FACE_VALUE = 10;
const ACE_HIGH = 11;
const ACE_LOW = 1;

/**
 * Get the numeric blackjack value of a card label
 */
function cardValue(card) {
  const c = String(card).toUpperCase().trim();
  if (['J', 'Q', 'K', 'JACK', 'QUEEN', 'KING'].includes(c)) return FACE_VALUE;
  if (['A', 'ACE'].includes(c)) return ACE_HIGH; // Ace defaults to 11; caller handles soft/hard
  const num = parseInt(c);
  if (!isNaN(num) && num >= 2 && num <= 10) return num;
  return 0;
}

/**
 * Calculate the best blackjack total for a hand of cards
 * Returns { total, isSoft, isBust }
 */
function handTotal(cards) {
  let total = 0;
  let aces = 0;

  for (const card of cards) {
    const val = cardValue(card);
    if (val === ACE_HIGH) {
      aces++;
      total += ACE_HIGH;
    } else {
      total += val;
    }
  }

  // Convert aces from 11 to 1 as needed to avoid bust
  while (total > 21 && aces > 0) {
    total -= 10;
    aces--;
  }

  return {
    total,
    isSoft: aces > 0 && total <= 21,
    isBust: total > 21,
    isBlackjack: cards.length === 2 && total === 21
  };
}

/**
 * Check if a hand is a pair
 */
function isPair(cards) {
  if (cards.length !== 2) return false;
  const a = String(cards[0]).toUpperCase().trim();
  const b = String(cards[1]).toUpperCase().trim();
  const normalize = c => {
    if (['J', 'Q', 'K', 'JACK', 'QUEEN', 'KING'].includes(c)) return '10';
    if (['A', 'ACE'].includes(c)) return 'A';
    return c;
  };
  return normalize(a) === normalize(b);
}

/**
 * Check if adding a card busts the hand
 */
function wouldBust(currentTotal, isSoft, card) {
  const val = cardValue(card);
  let newTotal = currentTotal + val;
  if (isSoft && newTotal > 21) newTotal -= 10; // Ace flips from 11 to 1
  return newTotal > 21;
}

/**
 * Probability of busting on next draw given current total
 */
function bustProbabilityOnDraw(total) {
  const table = {
    12: 0.31, 13: 0.38, 14: 0.46, 15: 0.54,
    16: 0.62, 17: 0.69, 18: 0.77, 19: 0.85,
    20: 0.92, 21: 1.00
  };
  if (total <= 11) return 0;
  return table[total] || (total > 21 ? 1 : 0);
}

module.exports = {
  cardValue,
  handTotal,
  isPair,
  wouldBust,
  bustProbabilityOnDraw,
  FACE_VALUE,
  ACE_HIGH,
  ACE_LOW
};
