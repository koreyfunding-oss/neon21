/**
 * NEON21 — /api/recommend
 */
const express = require('express');
const router = express.Router();
const { stateManager } = require('../state/stateManager');

router.get('/', (req, res) => {
  try {
    const state = stateManager.getFullState(req.sessionId);
    res.json(state);
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
});

module.exports = router;
