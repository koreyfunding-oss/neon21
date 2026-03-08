const express = require('express');
const router = express.Router();
const counter = require('../engine/counting');
const { evSummary } = require('../utils/evTools');
const { validateSessionId } = require('../utils/secure');

// GET /api/stats — current count and session statistics
router.get('/', (req, res) => {
  try {
    const sessionId = validateSessionId(req.headers['x-session-id']);
    const trueCount = counter.getTrueCount();
    const ev = evSummary(trueCount, 25, 1000, 25);

    return res.json({
      sessionId,
      runningCount: counter.runningCount,
      trueCount: parseFloat(trueCount.toFixed(2)),
      cardsSeen: counter.cardsSeen,
      ev
    });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

module.exports = router;
