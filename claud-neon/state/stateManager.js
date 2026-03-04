/**
 * NEON21 — State Manager
 * Central state for shoe, session, and dealer tracking
 */

const { CountingEngine } = require('../engine/counting');
const { TrueCountEngine } = require('../engine/trueCount');
const { BetRampEngine } = require('../engine/betRamp');
const { PatternEngine, ShuffleBiasEngine } = require('../engine/patterns');

class StateManager {
  constructor() {
    this.sessions = new Map();
  }

  createSession(sessionId, options = {}) {
    const {
      numDecks = 6,
      system = 'hi-lo',
      minBet = 25,
      maxBet = 500,
      bankroll = 1000
    } = options;

    const session = {
      id: sessionId,
      createdAt: Date.now(),
      lastActivity: Date.now(),
      numDecks,
      system,
      minBet,
      maxBet,
      bankroll,
      counting: new CountingEngine(system, numDecks),
      patterns: new PatternEngine(),
      shuffleBias: new ShuffleBiasEngine(),
      dealerUpcard: null,
      playerHand: [],
      handCount: 0,
      winCount: 0,
      lossCount: 0,
      pushCount: 0,
    };

    this.sessions.set(sessionId, session);
    return session;
  }

  getSession(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) return null;
    session.lastActivity = Date.now();
    return session;
  }

  getOrCreate(sessionId, options) {
    return this.getSession(sessionId) || this.createSession(sessionId, options);
  }

  addCard(sessionId, card) {
    const session = this.getSession(sessionId);
    if (!session) throw new Error('Session not found');
    return session.counting.addCard(card);
  }

  getFullState(sessionId) {
    const session = this.getSession(sessionId);
    if (!session) throw new Error('Session not found');

    const countState = session.counting.getState();
    const trueCount = TrueCountEngine.calculate(
      countState.runningCount,
      countState.cardsDealt,
      countState.numDecks
    );
    const betRec = BetRampEngine.recommend(
      trueCount, session.bankroll, session.minBet, session.maxBet, session.numDecks
    );
    const deviations = TrueCountEngine.getDeviations(trueCount);
    const penetration = TrueCountEngine.penetrationQuality(countState.cardsDealt, countState.numDecks);
    const patterns = session.patterns.summary();

    return {
      session: {
        id: sessionId,
        uptime: Date.now() - session.createdAt,
        handCount: session.handCount,
        winCount: session.winCount,
        lossCount: session.lossCount,
        pushCount: session.pushCount,
        winRate: session.handCount > 0 ? (session.winCount / session.handCount * 100).toFixed(1) : 0
      },
      count: {
        ...countState,
        trueCount: parseFloat(trueCount.toFixed(2)),
        trueCountRounded: Math.round(trueCount),
        insurance: TrueCountEngine.shouldTakeInsurance(trueCount),
        deviations
      },
      bet: betRec,
      penetration,
      patterns
    };
  }

  resetShoe(sessionId) {
    const session = this.getSession(sessionId);
    if (!session) throw new Error('Session not found');
    const rc = session.counting.getState().runningCount;
    const cd = session.counting.getState().cardsDealt;
    session.shuffleBias.recordShuffle(rc, cd);
    session.counting.reset();
    return { reset: true, shuffleBias: session.shuffleBias.detectBias() };
  }

  deleteSession(sessionId) {
    this.sessions.delete(sessionId);
  }

  // Cleanup stale sessions (>4 hours)
  cleanup() {
    const cutoff = Date.now() - (4 * 60 * 60 * 1000);
    for (const [id, session] of this.sessions) {
      if (session.lastActivity < cutoff) this.sessions.delete(id);
    }
  }
}

// Singleton
const stateManager = new StateManager();
setInterval(() => stateManager.cleanup(), 30 * 60 * 1000);

module.exports = { stateManager, StateManager };
