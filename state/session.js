/**
 * NEON21 — Session State
 * Tracks per-player session stats: hands played, wins, losses, bankroll
 */

class Session {
  constructor(sessionId, options = {}) {
    this.id = sessionId;
    this.createdAt = Date.now();
    this.lastActivity = Date.now();
    this.bankroll = options.bankroll || 1000;
    this.minBet = options.minBet || 25;
    this.maxBet = options.maxBet || 500;
    this.system = options.system || 'hi-lo';
    this.numDecks = options.numDecks || 6;
    this.handCount = 0;
    this.winCount = 0;
    this.lossCount = 0;
    this.pushCount = 0;
    this.totalWagered = 0;
    this.totalProfit = 0;
  }

  touch() {
    this.lastActivity = Date.now();
  }

  recordResult(result, amount = 0) {
    this.touch();
    this.handCount++;
    this.totalWagered += amount;
    if (result === 'win') {
      this.winCount++;
      this.totalProfit += amount;
      this.bankroll += amount;
    } else if (result === 'loss') {
      this.lossCount++;
      this.totalProfit -= amount;
      this.bankroll -= amount;
    } else if (result === 'push') {
      this.pushCount++;
    }
  }

  get winRate() {
    if (this.handCount === 0) return 0;
    return parseFloat(((this.winCount / this.handCount) * 100).toFixed(1));
  }

  get roi() {
    if (this.totalWagered === 0) return 0;
    return parseFloat(((this.totalProfit / this.totalWagered) * 100).toFixed(2));
  }

  isStale(maxAgeMs = 4 * 60 * 60 * 1000) {
    return (Date.now() - this.lastActivity) > maxAgeMs;
  }

  getStats() {
    return {
      id: this.id,
      uptime: Date.now() - this.createdAt,
      handCount: this.handCount,
      winCount: this.winCount,
      lossCount: this.lossCount,
      pushCount: this.pushCount,
      winRate: this.winRate,
      roi: this.roi,
      bankroll: this.bankroll,
      totalProfit: this.totalProfit
    };
  }
}

module.exports = { Session };
