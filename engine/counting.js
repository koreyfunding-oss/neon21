/**
 * NEON21 — Counting Engine
 * Supports Hi-Lo, KO (Knockout), Hi-Opt II
 */

const COUNTING_SYSTEMS = {
  'hi-lo': {
    name: 'Hi-Lo',
    values: { 2:1, 3:1, 4:1, 5:1, 6:1, 7:0, 8:0, 9:0, 10:-1, J:-1, Q:-1, K:-1, A:-1 },
    balanced: true,
    description: 'Standard balanced system. Best for beginners and intermediate counters.'
  },
  'ko': {
    name: 'KO (Knockout)',
    values: { 2:1, 3:1, 4:1, 5:1, 6:1, 7:1, 8:0, 9:0, 10:-1, J:-1, Q:-1, K:-1, A:-1 },
    balanced: false,
    description: 'Unbalanced system. No true count conversion needed. Great for noisy environments.'
  },
  'hi-opt-ii': {
    name: 'Hi-Opt II',
    values: { 2:1, 3:1, 4:2, 5:2, 6:1, 7:1, 8:0, 9:0, 10:-2, J:-2, Q:-2, K:-2, A:0 },
    balanced: true,
    description: 'Advanced multi-level system. Highest accuracy for experienced counters.'
  }
};

class CountingEngine {
  constructor(system = 'hi-lo', numDecks = 6) {
    this.system = system;
    this.numDecks = numDecks;
    this.runningCount = 0;
    this.cardsDealt = 0;
    this.totalCards = numDecks * 52;
    this.history = [];
  }

  getCardValue(card) {
    const sys = COUNTING_SYSTEMS[this.system];
    if (!sys) throw new Error(`Unknown counting system: ${this.system}`);
    const normalized = this._normalizeCard(card);
    return sys.values[normalized] ?? 0;
  }

  addCard(card) {
    const value = this.getCardValue(card);
    this.runningCount += value;
    this.cardsDealt++;
    this.history.push({ card, value, runningCount: this.runningCount, timestamp: Date.now() });
    return { card, value, runningCount: this.runningCount };
  }

  removeLastCard() {
    if (this.history.length === 0) return null;
    const last = this.history.pop();
    this.runningCount -= last.value;
    this.cardsDealt--;
    return last;
  }

  getState() {
    return {
      system: this.system,
      systemName: COUNTING_SYSTEMS[this.system]?.name,
      numDecks: this.numDecks,
      runningCount: this.runningCount,
      cardsDealt: this.cardsDealt,
      cardsRemaining: this.totalCards - this.cardsDealt,
      decksRemaining: (this.totalCards - this.cardsDealt) / 52,
      penetration: this.cardsDealt / this.totalCards,
      history: this.history.slice(-20)
    };
  }

  reset() {
    this.runningCount = 0;
    this.cardsDealt = 0;
    this.history = [];
  }

  setSystem(system) {
    if (!COUNTING_SYSTEMS[system]) throw new Error(`Unknown system: ${system}`);
    this.system = system;
    this.reset();
  }

  setNumDecks(n) {
    this.numDecks = n;
    this.totalCards = n * 52;
    this.reset();
  }

  _normalizeCard(card) {
    const str = String(card).toUpperCase().trim();
    const faceMap = { 'JACK':'J', 'QUEEN':'Q', 'KING':'K', 'ACE':'A',
                      'J':'J', 'Q':'Q', 'K':'K', 'A':'A', '1':'A', '11':'A' };
    if (faceMap[str]) return faceMap[str];
    const num = parseInt(str);
    if (num >= 10) return 10;
    if (num >= 2 && num <= 9) return num;
    return str;
  }

  static getSystems() { return COUNTING_SYSTEMS; }
}

module.exports = { CountingEngine, COUNTING_SYSTEMS };
