const express = require('express');
const router = express.Router();
const { BetRampEngine } = require('../engine/betRamp');
const counter = require('../engine/counting');
const { evSummary } = require('../utils/evTools');
const { validateBet, validateNumDecks, validateSessionId } = require('../utils/secure');

// POST /api/recommend — get bet recommendation based on current count
router.post('/', (req, res) => {
  try {
    const sessionId = validateSessionId(req.headers['x-session-id']);
    const numDecks = validateNumDecks(req.body.numDecks || 6);
    const minBet = validateBet(req.body.minBet || 25);
    const maxBet = validateBet(req.body.maxBet || 500);
    const bankroll = parseFloat(req.body.bankroll) || 1000;

    const trueCount = counter.getTrueCount();
    const recommendation = BetRampEngine.recommend(trueCount, bankroll, minBet, maxBet, numDecks);
    const ev = evSummary(trueCount, recommendation.recommendedBet, bankroll, minBet);

    return res.json({
      ...recommendation,
      ev,
      sessionId
    });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

module.exports = router;
