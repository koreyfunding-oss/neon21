/**
 * NEON21 — Shuffle Bias Engine
 * Detects shuffle bias and high/low card clumping patterns
 */

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

  reset() {
    this.preShuffle = [];
    this.postShuffle = [];
    this.shufflePoints = [];
  }
}

module.exports = { ShuffleBiasEngine };
