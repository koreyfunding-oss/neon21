/**
 * NEON21 — Bet Ramp Engine
 * Calculates optimal bet sizing based on true count and bankroll
 */

class BetRampEngine {
  /**
   * Kelly Criterion bet sizing
   * f* = (bp - q) / b where b=odds, p=win prob, q=lose prob
   */
  static kelly(trueCount, bankroll, kellyFraction = 0.25) {
    const edge = trueCount * 0.005 - 0.005; // player edge at this TC
    if (edge <= 0) return 0; // no edge, bet minimum
    const fullKelly = edge; // simplified: edge / 1 (even money game)
    const fractionalKelly = fullKelly * kellyFraction;
    return Math.round(bankroll * fractionalKelly);
  }

  /**
   * Standard bet ramp lookup table
   * Returns bet units based on true count
   */
  static unitBet(trueCount, minBet = 25, maxBet = 500) {
    const ramp = [
      { tc: -Infinity, units: 1 },
      { tc: 1, units: 1 },
      { tc: 2, units: 2 },
      { tc: 3, units: 4 },
      { tc: 4, units: 8 },
      { tc: 5, units: 12 },
      { tc: 6, units: 16 },
    ];

    let units = 1;
    for (const step of ramp) {
      if (trueCount >= step.tc) units = step.units;
    }

    const bet = Math.round(minBet * units);
    return Math.min(bet, maxBet);
  }

  /**
   * Spread recommendation (min:max ratio)
   */
  static spread(numDecks) {
    // Larger spread needed for more decks
    const spreads = { 1: '1:4', 2: '1:6', 4: '1:8', 6: '1:12', 8: '1:16' };
    return spreads[numDecks] || '1:12';
  }

  /**
   * Risk of ruin calculation
   */
  static riskOfRuin(bankroll, unitBet, edge, stdDev = 1.15) {
    if (edge <= 0) return 1.0;
    const n = bankroll / unitBet; // number of units in bankroll
    const ror = Math.exp(-2 * n * edge / (stdDev * stdDev));
    return Math.min(Math.max(ror, 0), 1);
  }

  /**
   * Full bet recommendation with context
   */
  static recommend(trueCount, bankroll, minBet, maxBet, numDecks) {
    const bet = this.unitBet(trueCount, minBet, maxBet);
    const kellyBet = this.kelly(trueCount, bankroll);
    const edge = trueCount * 0.005 - 0.005;
    const ror = this.riskOfRuin(bankroll, minBet, Math.max(edge, 0.001));

    let signal = 'NEUTRAL';
    let signalColor = 'amber';
    if (trueCount >= 3) { signal = 'FAVORABLE'; signalColor = 'cyan'; }
    if (trueCount >= 5) { signal = 'STRONG EDGE'; signalColor = 'green'; }
    if (trueCount <= -2) { signal = 'UNFAVORABLE'; signalColor = 'red'; }

    return {
      recommendedBet: bet,
      kellyBet: Math.min(kellyBet, maxBet),
      trueCount,
      edge: parseFloat((edge * 100).toFixed(2)),
      signal,
      signalColor,
      spread: this.spread(numDecks),
      riskOfRuin: parseFloat((ror * 100).toFixed(1))
    };
  }
}

module.exports = { BetRampEngine };
