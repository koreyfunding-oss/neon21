/**
 * NEON21 — EV (Expected Value) Tools
 * Calculate player edge, expected value, and risk metrics
 */

/**
 * Player advantage from true count
 * House edge shifts ~0.5% per true count point
 * Base house edge for 6-deck, S17, DAS: ~0.5%
 */
function playerAdvantage(trueCount, baseHouseEdge = 0.005) {
  const advantage = (trueCount * 0.005) - baseHouseEdge;
  return parseFloat(advantage.toFixed(4));
}

/**
 * Expected value of a bet given edge and bet size
 */
function expectedValue(betAmount, edge) {
  return parseFloat((betAmount * edge).toFixed(2));
}

/**
 * Risk of ruin formula (Gambler's ruin approximation)
 * @param {number} bankroll - Total bankroll in units
 * @param {number} unitBet - Current bet size in units
 * @param {number} edge - Player edge as decimal (e.g. 0.01 = 1%)
 * @param {number} stdDev - Standard deviation per hand (default 1.15 for BJ)
 */
function riskOfRuin(bankroll, unitBet, edge, stdDev = 1.15) {
  if (edge <= 0) return 1.0;
  const units = bankroll / unitBet;
  const ror = Math.exp((-2 * units * edge) / (stdDev * stdDev));
  return parseFloat(Math.min(Math.max(ror, 0), 1).toFixed(4));
}

/**
 * N0 — number of hands to overcome variance (reach expected profit with high confidence)
 */
function handsToProfit(edge, stdDev = 1.15) {
  if (edge <= 0) return Infinity;
  return Math.ceil((stdDev / edge) ** 2);
}

/**
 * Kelly Criterion optimal bet fraction
 */
function kellyCriterion(edge, odds = 1, fraction = 0.25) {
  if (edge <= 0) return 0;
  const full = (edge * (odds + 1) - (1 - edge)) / odds;
  return parseFloat(Math.max(full * fraction, 0).toFixed(4));
}

/**
 * Full EV summary for a given game state
 */
function evSummary(trueCount, betAmount, bankroll, minBet) {
  const edge = playerAdvantage(trueCount);
  const ev = expectedValue(betAmount, edge);
  const ror = riskOfRuin(bankroll, minBet, Math.max(edge, 0.001));
  const kelly = kellyCriterion(Math.max(edge, 0));
  const n0 = handsToProfit(Math.abs(edge));

  return {
    trueCount,
    edge: parseFloat((edge * 100).toFixed(2)),
    edgeLabel: edge > 0 ? 'PLAYER ADVANTAGE' : edge < 0 ? 'HOUSE EDGE' : 'NEUTRAL',
    ev,
    riskOfRuin: parseFloat((ror * 100).toFixed(1)),
    kellyCriterion: kelly,
    handsToProfit: isFinite(n0) ? n0 : null
  };
}

module.exports = { playerAdvantage, expectedValue, riskOfRuin, handsToProfit, kellyCriterion, evSummary };
