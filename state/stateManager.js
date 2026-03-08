/**
 * NEON21 — State Manager
 * Central state for shoe, session, and dealer tracking
 */

const counting = require('../engine/counting');
const { BetRampEngine } = require('../engine/betRamp');
const { PatternEngine, ShuffleBiasEngine } = require('../engine/patterns');
const { Shoe } = require('./shoe');
const { Session } = require('./session');
const { DealerProfile } = require('./dealerProfile');

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
      meta: new Session(sessionId, { numDecks, system, minBet, maxBet, bankroll }),
      shoe: new Shoe(numDecks),
      patterns: new PatternEngine(),
      shuffleBias: new ShuffleBiasEngine(),
      dealer: new DealerProfile(),
      system,
      minBet,
      maxBet,
      bankroll,
      runningCount: 0,
      cardsSeen: 0
    };

    this.sessions.set(sessionId, session);
    return session;
  }

  getSession(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) return null;
    session.meta.touch();
    return session;
  }

  getOrCreate(sessionId, options) {
    return this.getSession(sessionId) || this.createSession(sessionId, options);
  }

  addCard(sessionId, card, options = {}) {
    const session = this.getOrCreate(sessionId, options);
    counting.update(card);
    session.runningCount = counting.runningCount;
    session.cardsSeen = counting.cardsSeen;
    session.shoe.deal(card);
    session.meta.touch();
    return {
      card,
      runningCount: session.runningCount,
      trueCount: counting.getTrueCount(),
      cardsSeen: session.cardsSeen
    };
  }

  getFullState(sessionId) {
    const session = this.getSession(sessionId);
    if (!session) throw new Error('Session not found: ' + sessionId);

    const trueCount = counting.getTrueCount();
    const betRec = BetRampEngine.recommend(
      trueCount,
      session.bankroll,
      session.minBet,
      session.maxBet,
      session.shoe.numDecks
    );
    const shoeState = session.shoe.getState();
    const stats = session.meta.getStats();
    const patterns = session.patterns.summary();

    return {
      session: stats,
      count: {
        runningCount: session.runningCount,
        trueCount: parseFloat(trueCount.toFixed(2)),
        cardsSeen: session.cardsSeen,
        cardsDealt: shoeState.cardsDealt,
        cardsRemaining: shoeState.cardsRemaining,
        decksRemaining: shoeState.decksRemaining,
        penetration: shoeState.penetration / 100
      },
      bet: betRec,
      shoe: shoeState,
      patterns,
      dealer: session.dealer.getProfile()
    };
  }

  resetShoe(sessionId) {
    const session = this.getSession(sessionId);
    if (!session) throw new Error('Session not found: ' + sessionId);
    session.shuffleBias.recordShuffle(session.runningCount, session.cardsSeen);
    session.shoe.reset();
    counting.reset();
    session.runningCount = 0;
    session.cardsSeen = 0;
    return { reset: true, shuffleBias: session.shuffleBias.detectBias() };
  }

  deleteSession(sessionId) {
    this.sessions.delete(sessionId);
  }

  cleanup() {
    for (const [id, session] of this.sessions) {
      if (session.meta.isStale()) this.sessions.delete(id);
    }
  }
}

const stateManager = new StateManager();
setInterval(() => stateManager.cleanup(), 30 * 60 * 1000);

module.exports = { stateManager, StateManager };
