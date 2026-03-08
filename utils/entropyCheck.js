/**
 * NEON21 — Entropy Check
 * Detects statistical anomalies in card distribution that may indicate
 * non-random shuffling or biased dealing
 */

/**
 * Chi-square test for uniform distribution
 * Returns p-value approximation (lower = more anomalous)
 */
function chiSquareUniform(observed, expected) {
  if (expected === 0) return 0;
  let chi2 = 0;
  for (const count of observed) {
    chi2 += Math.pow(count - expected, 2) / expected;
  }
  return chi2;
}

/**
 * Analyze card distribution across ranks in the dealt history
 * Returns anomaly score and flagged ranks
 */
function checkCardDistribution(dealtCards, numDecks = 6) {
  const rankCounts = {};
  const RANKS = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];

  for (const rank of RANKS) rankCounts[rank] = 0;

  for (const card of dealtCards) {
    const c = String(card).toUpperCase().trim();
    const key = ['J','Q','K'].includes(c) ? '10' : c;
    if (rankCounts[key] !== undefined) rankCounts[key]++;
  }

  const totalCards = dealtCards.length;
  if (totalCards < 52) {
    return { status: 'INSUFFICIENT_DATA', totalCards, message: 'Need at least 52 cards for analysis' };
  }

  // Expected count per rank: (numDecks * 4) cards per rank
  const expectedPerRank = (numDecks * 4 * totalCards) / (numDecks * 52);
  const observed = RANKS.map(r => rankCounts[r]);
  const chi2 = chiSquareUniform(observed, expectedPerRank);

  // Degrees of freedom = 12 (13 ranks - 1)
  // Critical value at p=0.05 with df=12 is ~21.0
  const anomalyThreshold = 21.0;
  const isAnomalous = chi2 > anomalyThreshold;

  const flaggedRanks = RANKS.filter(r => {
    const deviation = Math.abs(rankCounts[r] - expectedPerRank);
    return deviation > expectedPerRank * 0.3; // >30% deviation
  });

  return {
    status: isAnomalous ? 'ANOMALY_DETECTED' : 'NORMAL',
    chi2: parseFloat(chi2.toFixed(2)),
    totalCards,
    expectedPerRank: parseFloat(expectedPerRank.toFixed(1)),
    distribution: rankCounts,
    flaggedRanks,
    message: isAnomalous
      ? `Statistical anomaly detected (χ²=${chi2.toFixed(1)}). Possible non-random distribution.`
      : 'Card distribution within normal statistical range.'
  };
}

/**
 * Check run-length for consecutive high/low cards (detects clumping)
 */
function checkRunLength(dealtCards) {
  if (dealtCards.length < 10) return null;

  const HIGH_CARDS = ['10', 'J', 'Q', 'K', 'A'];

  let maxRun = 1;
  let currentRun = 1;
  let longestRunType = null;

  for (let i = 1; i < dealtCards.length; i++) {
    const prev = dealtCards[i - 1];
    const curr = dealtCards[i];
    const prevIsHigh = HIGH_CARDS.includes(String(prev).toUpperCase());
    const currIsHigh = HIGH_CARDS.includes(String(curr).toUpperCase());

    if (prevIsHigh === currIsHigh) {
      currentRun++;
      if (currentRun > maxRun) {
        maxRun = currentRun;
        longestRunType = prevIsHigh ? 'HIGH' : 'LOW';
      }
    } else {
      currentRun = 1;
    }
  }

  const CLUMP_THRESHOLD = 8;
  return {
    maxConsecutiveRun: maxRun,
    longestRunType,
    isClumped: maxRun >= CLUMP_THRESHOLD,
    message: maxRun >= CLUMP_THRESHOLD
      ? `Clumping detected: ${maxRun} consecutive ${longestRunType} cards`
      : 'No significant clumping detected'
  };
}

module.exports = { checkCardDistribution, checkRunLength, chiSquareUniform };
