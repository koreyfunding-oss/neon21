/**
 * NEON21 — Dealer Profile
 * Tracks observed dealer tendencies: bust rate, speed, shuffle style
 */

class DealerProfile {
  constructor(dealerId = 'unknown') {
    this.dealerId = dealerId;
    this.hands = [];
    this.bustCount = 0;
    this.totalHands = 0;
    this.shuffleStyle = null; // 'riffle', 'strip', 'wash', 'auto'
    this.avgHandSpeed = null; // seconds per hand
    this.dealStartTimes = [];
  }

  recordHand({ dealerTotal, busted, handDurationMs }) {
    this.totalHands++;
    if (busted) this.bustCount++;

    this.hands.push({
      dealerTotal,
      busted,
      handDurationMs: handDurationMs || null,
      ts: Date.now()
    });

    if (handDurationMs) {
      this.dealStartTimes.push(handDurationMs);
      if (this.dealStartTimes.length > 50) this.dealStartTimes.shift();
      this.avgHandSpeed = parseFloat(
        (this.dealStartTimes.reduce((a, b) => a + b, 0) / this.dealStartTimes.length / 1000).toFixed(1)
      );
    }

    if (this.hands.length > 200) this.hands.shift();
  }

  get bustRate() {
    if (this.totalHands === 0) return null;
    return parseFloat((this.bustCount / this.totalHands).toFixed(3));
  }

  get bustRatePercent() {
    if (this.bustRate === null) return null;
    return parseFloat((this.bustRate * 100).toFixed(1));
  }

  get tendencyLabel() {
    const rate = this.bustRate;
    if (rate === null || this.totalHands < 20) return 'INSUFFICIENT_DATA';
    if (rate > 0.35) return 'BUST_PRONE';
    if (rate < 0.22) return 'STRONG_DEALER';
    return 'AVERAGE';
  }

  setShuffleStyle(style) {
    const valid = ['riffle', 'strip', 'wash', 'auto'];
    if (valid.includes(style)) this.shuffleStyle = style;
  }

  getProfile() {
    return {
      dealerId: this.dealerId,
      totalHands: this.totalHands,
      bustRate: this.bustRate,
      bustRatePercent: this.bustRatePercent,
      tendencyLabel: this.tendencyLabel,
      shuffleStyle: this.shuffleStyle,
      avgHandSpeed: this.avgHandSpeed
    };
  }

  reset() {
    this.hands = [];
    this.bustCount = 0;
    this.totalHands = 0;
    this.dealStartTimes = [];
    this.avgHandSpeed = null;
  }
}

module.exports = { DealerProfile };
