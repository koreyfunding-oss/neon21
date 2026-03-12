/**
 * NEON21 — True Count Engine
 * Converts running count to true count based on decks remaining
 */

class TrueCountEngine {
  /**
   * Standard true count: running count / decks remaining
   */
  static calculate(runningCount, cardsDealt, numDecks) {
    const totalCards = numDecks * 52;
    const cardsRemaining = totalCards - cardsDealt;
    const decksRemaining = cardsRemaining / 52;
    if (decksRemaining <= 0) return 0;
    return runningCount / decksRemaining;
  }

  /**
   * Rounded true count (standard casino-style)
   */
  static rounded(runningCount, cardsDealt, numDecks) {
    return Math.round(this.calculate(runningCount, cardsDealt, numDecks));
  }

  /**
   * Advantage calculation based on true count
   * House edge shifts ~0.5% per true count point
   */
  static playerAdvantage(trueCount, baseHouseEdge = -0.005) {
    const advantage = baseHouseEdge + (trueCount * 0.005);
    return Math.min(Math.max(advantage, -0.05), 0.05); // cap at ±5%
  }

  /**
   * Insurance recommendation threshold
   */
  static shouldTakeInsurance(trueCount) {
    return trueCount >= 3;
  }

  /**
   * Deviation index — should we deviate from basic strategy?
   * Returns the index play deviations at this true count
   */
  static getDeviations(trueCount) {
    const deviations = [];
    if (trueCount >= 3) deviations.push({ play: 'Insurance', action: 'Take it', tc: 3 });
    if (trueCount >= 4) deviations.push({ play: '16 vs 10', action: 'Stand', tc: 4 });
    if (trueCount >= 4) deviations.push({ play: '15 vs 10', action: 'Stand', tc: 4 });
    if (trueCount >= 3) deviations.push({ play: '12 vs 3', action: 'Stand', tc: 3 });
    if (trueCount >= 2) deviations.push({ play: '12 vs 4', action: 'Stand', tc: 2 });
    if (trueCount <= -2) deviations.push({ play: '11 vs A', action: 'Hit (not double)', tc: -2 });
    if (trueCount >= 5) deviations.push({ play: '10 vs A', action: 'Double', tc: 5 });
    if (trueCount >= 4) deviations.push({ play: '9 vs 2', action: 'Double', tc: 4 });
    return deviations;
  }

  /**
   * Deck penetration quality assessment
   */
  static penetrationQuality(cardsDealt, numDecks) {
    const pct = cardsDealt / (numDecks * 52);
    if (pct < 0.5) return { label: 'LOW', color: 'red', note: 'Insufficient penetration — count unreliable' };
    if (pct < 0.65) return { label: 'MODERATE', color: 'amber', note: 'Acceptable penetration' };
    if (pct < 0.80) return { label: 'GOOD', color: 'cyan', note: 'Strong penetration — count reliable' };
    return { label: 'EXCELLENT', color: 'green', note: 'Deep penetration — maximum advantage' };
  }
}

module.exports = { TrueCountEngine };
