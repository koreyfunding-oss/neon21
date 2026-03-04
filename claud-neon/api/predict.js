/**
 * NEON21 — /api/predict
 * Get basic strategy + count-adjusted recommendation
 */

const express = require('express');
const router = express.Router();
const { stateManager } = require('../state/stateManager');
const { ProbabilityEngine } = require('../engine/probability');
const { TrueCountEngine } = require('../engine/trueCount');

router.post('/', (req, res) => {
  try {
    const { playerTotal, dealerUpcard, isSoft, isPair, pairCard } = req.body;
    const sessionId = req.sessionId;

    if (playerTotal == null || dealerUpcard == null) {
      return res.status(400).json({ error: 'playerTotal and dealerUpcard required' });
    }

    const session = stateManager.getOrCreate(sessionId);
    const countState = session.counting.getState();
    const trueCount = TrueCountEngine.calculate(
      countState.runningCount, countState.cardsDealt, countState.numDecks
    );

    // Basic strategy recommendation
    const strategy = ProbabilityEngine.getBasicStrategy(
      playerTotal, dealerUpcard, isSoft, isPair, pairCard
    );

    // EV calculation
    const ev = ProbabilityEngine.expectedValue(playerTotal, dealerUpcard, trueCount, isSoft);

    // Count deviations — override basic strategy if TC warrants
    const deviations = TrueCountEngine.getDeviations(trueCount);
    const applicableDeviation = deviations.find(d => {
      const handStr = `${playerTotal} vs ${dealerUpcard}`;
      return d.play.includes(String(playerTotal)) && d.play.includes(String(dealerUpcard));
    });

    const finalAction = applicableDeviation
      ? applicableDeviation.action.split(' ')[0].charAt(0).toUpperCase()
      : strategy.action;

    res.json({
      playerTotal,
      dealerUpcard,
      trueCount: parseFloat(trueCount.toFixed(2)),
      action: finalAction,
      actionLabel: ProbabilityEngine.actionLabel(finalAction),
      actionColor: ProbabilityEngine.actionColor(finalAction),
      basicStrategy: strategy,
      deviation: applicableDeviation || null,
      ev,
      insurance: TrueCountEngine.shouldTakeInsurance(trueCount),
      confidence: Math.min(0.7 + Math.abs(trueCount) * 0.05, 0.99)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
