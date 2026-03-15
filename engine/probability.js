/**
 * NEON21 — Probability Engine
 * Calculates bust probabilities, draw odds, and EV for decisions
 */

const BASIC_STRATEGY = {
  // [playerTotal][dealerUpcard] => action
  // H=Hit, S=Stand, D=Double, P=Split, R=Surrender
  hard: {
    21: { 2:'S',3:'S',4:'S',5:'S',6:'S',7:'S',8:'S',9:'S',10:'S',A:'S' },
    20: { 2:'S',3:'S',4:'S',5:'S',6:'S',7:'S',8:'S',9:'S',10:'S',A:'S' },
    19: { 2:'S',3:'S',4:'S',5:'S',6:'S',7:'S',8:'S',9:'S',10:'S',A:'S' },
    18: { 2:'S',3:'S',4:'S',5:'S',6:'S',7:'S',8:'S',9:'S',10:'S',A:'S' },
    17: { 2:'S',3:'S',4:'S',5:'S',6:'S',7:'S',8:'S',9:'S',10:'S',A:'S' },
    16: { 2:'S',3:'S',4:'S',5:'S',6:'S',7:'H',8:'H',9:'H',10:'R',A:'R' },
    15: { 2:'S',3:'S',4:'S',5:'S',6:'S',7:'H',8:'H',9:'H',10:'R',A:'H' },
    14: { 2:'S',3:'S',4:'S',5:'S',6:'S',7:'H',8:'H',9:'H',10:'H',A:'H' },
    13: { 2:'S',3:'S',4:'S',5:'S',6:'S',7:'H',8:'H',9:'H',10:'H',A:'H' },
    12: { 2:'H',3:'H',4:'S',5:'S',6:'S',7:'H',8:'H',9:'H',10:'H',A:'H' },
    11: { 2:'D',3:'D',4:'D',5:'D',6:'D',7:'D',8:'D',9:'D',10:'D',A:'H' },
    10: { 2:'D',3:'D',4:'D',5:'D',6:'D',7:'D',8:'D',9:'D',10:'H',A:'H' },
    9:  { 2:'H',3:'D',4:'D',5:'D',6:'D',7:'H',8:'H',9:'H',10:'H',A:'H' },
    8:  { 2:'H',3:'H',4:'H',5:'H',6:'H',7:'H',8:'H',9:'H',10:'H',A:'H' },
    7:  { 2:'H',3:'H',4:'H',5:'H',6:'H',7:'H',8:'H',9:'H',10:'H',A:'H' },
  },
  soft: {
    // Soft hands (with Ace counted as 11)
    20: { 2:'S',3:'S',4:'S',5:'S',6:'S',7:'S',8:'S',9:'S',10:'S',A:'S' },
    19: { 2:'S',3:'S',4:'S',5:'D',6:'D',7:'S',8:'S',9:'S',10:'S',A:'S' },
    18: { 2:'D',3:'D',4:'D',5:'D',6:'D',7:'S',8:'S',9:'H',10:'H',A:'H' },
    17: { 2:'H',3:'D',4:'D',5:'D',6:'D',7:'H',8:'H',9:'H',10:'H',A:'H' },
    16: { 2:'H',3:'H',4:'D',5:'D',6:'D',7:'H',8:'H',9:'H',10:'H',A:'H' },
    15: { 2:'H',3:'H',4:'D',5:'D',6:'D',7:'H',8:'H',9:'H',10:'H',A:'H' },
    14: { 2:'H',3:'H',4:'H',5:'D',6:'D',7:'H',8:'H',9:'H',10:'H',A:'H' },
    13: { 2:'H',3:'H',4:'H',5:'D',6:'D',7:'H',8:'H',9:'H',10:'H',A:'H' },
  },
  pairs: {
    'A': { 2:'P',3:'P',4:'P',5:'P',6:'P',7:'P',8:'P',9:'P',10:'P',A:'P' },
    '10':{ 2:'S',3:'S',4:'S',5:'S',6:'S',7:'S',8:'S',9:'S',10:'S',A:'S' },
    '9': { 2:'P',3:'P',4:'P',5:'P',6:'P',7:'S',8:'P',9:'P',10:'S',A:'S' },
    '8': { 2:'P',3:'P',4:'P',5:'P',6:'P',7:'P',8:'P',9:'P',10:'P',A:'P' },
    '7': { 2:'P',3:'P',4:'P',5:'P',6:'P',7:'P',8:'H',9:'H',10:'H',A:'H' },
    '6': { 2:'P',3:'P',4:'P',5:'P',6:'P',7:'H',8:'H',9:'H',10:'H',A:'H' },
    '5': { 2:'D',3:'D',4:'D',5:'D',6:'D',7:'D',8:'D',9:'D',10:'H',A:'H' },
    '4': { 2:'H',3:'H',4:'H',5:'P',6:'P',7:'H',8:'H',9:'H',10:'H',A:'H' },
    '3': { 2:'P',3:'P',4:'P',5:'P',6:'P',7:'P',8:'H',9:'H',10:'H',A:'H' },
    '2': { 2:'P',3:'P',4:'P',5:'P',6:'P',7:'P',8:'H',9:'H',10:'H',A:'H' },
  }
};

const BUST_PROBABILITY = {
  12: 0.31, 13: 0.38, 14: 0.46, 15: 0.54,
  16: 0.62, 17: 0.69, 18: 0.77, 19: 0.85,
  20: 0.92, 21: 1.00
};

const DEALER_BUST_PROBABILITY = {
  2: 0.356, 3: 0.374, 4: 0.401, 5: 0.423, 6: 0.424,
  7: 0.262, 8: 0.241, 9: 0.230, 10: 0.213, A: 0.117
};

class ProbabilityEngine {
  static getBasicStrategy(playerTotal, dealerUpcard, isSoft = false, isPair = false, pairCard = null) {
    const dealer = String(dealerUpcard).toUpperCase();
    const dealerKey = ['J','Q','K'].includes(dealer) ? '10' : dealer;

    if (isPair && pairCard !== null) {
      const pk = String(pairCard).toUpperCase();
      const pairKey = ['J','Q','K'].includes(pk) ? '10' : pk;
      const action = BASIC_STRATEGY.pairs[pairKey]?.[dealerKey];
      if (action) return { action, source: 'pairs' };
    }

    if (isSoft) {
      const action = BASIC_STRATEGY.soft[playerTotal]?.[dealerKey];
      if (action) return { action, source: 'soft' };
    }

    const action = BASIC_STRATEGY.hard[playerTotal]?.[dealerKey] || 'H';
    return { action, source: 'hard' };
  }

  static bustProbability(playerTotal) {
    return BUST_PROBABILITY[playerTotal] || (playerTotal > 21 ? 1.0 : 0);
  }

  static dealerBustProbability(dealerUpcard) {
    const key = String(dealerUpcard).toUpperCase();
    return DEALER_BUST_PROBABILITY[key] || DEALER_BUST_PROBABILITY[10];
  }

  static expectedValue(playerTotal, dealerUpcard, trueCount, isSoft = false) {
    const strategy = this.getBasicStrategy(playerTotal, dealerUpcard, isSoft);
    const bustProb = this.bustProbability(playerTotal);
    const dealerBust = this.dealerBustProbability(dealerUpcard);
    const countEdge = trueCount * 0.005;

    // Simplified EV calculation
    const standEV = dealerBust - (1 - dealerBust) * (playerTotal < 17 ? 0.8 : 0.4) + countEdge;
    const hitEV = (1 - bustProb) * 0.3 + countEdge;

    return {
      stand: parseFloat(standEV.toFixed(4)),
      hit: parseFloat(hitEV.toFixed(4)),
      recommended: strategy.action,
      bustIfHit: bustProb,
      dealerBustProb: dealerBust
    };
  }

  static actionLabel(action) {
    const labels = { H:'HIT', S:'STAND', D:'DOUBLE', P:'SPLIT', R:'SURRENDER' };
    return labels[action] || action;
  }

  static actionColor(action) {
    const colors = { H:'cyan', S:'amber', D:'green', P:'magenta', R:'red' };
    return colors[action] || 'white';
  }
}

module.exports = { ProbabilityEngine, BASIC_STRATEGY };
