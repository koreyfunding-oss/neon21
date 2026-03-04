/**
 * NEON21 — Pattern & Shuffle Bias Engine
 * Detects dealer patterns, shuffle bias, and anomalies
 */

class PatternEngine {
  constructor() {
    this.hands = [];
    this.dealerResults = [];
  }

  recordHand(playerResult, dealerTotal, dealerBusted) {
    this.hands.push({ playerResult, dealerTotal, dealerBusted, ts: Date.now() });
    this.dealerResults.push({ total: dealerTotal, busted: dealerBusted });
    if (this.hands.length > 100) {
      this.hands.shift();
      this.dealerResults.shift();
    }
  }

  dealerBustRate() {
    if (this.dealerResults.length === 0) return null;
    const busts = this.dealerResults.filter(r => r.busted).length;
    return busts / this.dealerResults.length;
  }

  detectStreaks() {
    if (this.hands.length < 5) return null;
    const recent = this.hands.slice(-10);
    const wins = recent.filter(h => h.playerResult === 'win').length;
    const losses = recent.filter(h => h.playerResult === 'loss').length;

    if (wins >= 7) return { type: 'HOT_STREAK', message: 'Player on hot streak', severity: 'positive' };
    if (losses >= 7) return { type: 'COLD_STREAK', message: 'Cold streak detected — consider table change', severity: 'warning' };
    return null;
  }

  detectDealerBias() {
    const bustRate = this.dealerBustRate();
    if (bustRate === null || this.dealerResults.length < 20) return null;

    const expectedBustRate = 0.285; // theoretical average
    const deviation = Math.abs(bustRate - expectedBustRate);

    if (deviation > 0.1) {
      return {
        type: bustRate > expectedBustRate ? 'DEALER_BUSTING_HIGH' : 'DEALER_BUSTING_LOW',
        observed: parseFloat((bustRate * 100).toFixed(1)),
        expected: parseFloat((expectedBustRate * 100).toFixed(1)),
        deviation: parseFloat((deviation * 100).toFixed(1)),
        message: bustRate > expectedBustRate
          ? 'Dealer busting above average — favorable conditions'
          : 'Dealer busting below average — exercise caution'
      };
    }
    return null;
  }

  summary() {
    return {
      handsRecorded: this.hands.length,
      dealerBustRate: this.dealerBustRate(),
      streak: this.detectStreaks(),
      dealerBias: this.detectDealerBias()
    };
  }
}

class ShuffleBiasEngine {
  constructor() {
    this.preShuffle = [];
    this.postShuffle = [];
    this.shufflePoints = [];
  }

  recordShuffle(runningCount, cardsDealt) {
    this.shufflePoints.push({ runningCount, cardsDealt, ts: Date.now() });
    this.preShuffle.push(runningCount);
    if (this.preShuffle.length > 20) this.preShuffle.shift();
  }

  detectBias() {
    if (this.shufflePoints.length < 3) return null;

    const avgPreShuffle = this.preShuffle.reduce((a, b) => a + b, 0) / this.preShuffle.length;

    if (Math.abs(avgPreShuffle) > 5) {
      return {
        type: 'SHUFFLE_BIAS_DETECTED',
        avgPreShuffleCount: parseFloat(avgPreShuffle.toFixed(2)),
        direction: avgPreShuffle > 0 ? 'HIGH_CARDS_CLUMPED_BACK' : 'LOW_CARDS_CLUMPED_BACK',
        message: avgPreShuffle > 0
          ? 'High cards may be clumping toward end of shoe'
          : 'Low cards may be clumping toward end of shoe',
        confidence: Math.min(this.shufflePoints.length / 10, 1.0)
      };
    }
    return null;
  }
}

module.exports = { PatternEngine, ShuffleBiasEngine };
