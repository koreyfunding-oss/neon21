const express = require('express');
const router = express.Router();
const { stateManager } = require('../state/stateManager');

// POST /api/reset — reset shoe (new shuffle)
router.post('/', (req, res) => {
  try {
    const result = stateManager.resetShoe(req.sessionId);
    const state = stateManager.getFullState(req.sessionId);
    res.json({ ...result, state });
  } catch (err) { res.status(404).json({ error: err.message }); }
});

// DELETE /api/reset/session — end session entirely
router.delete('/session', (req, res) => {
  stateManager.deleteSession(req.sessionId);
  res.json({ success: true, message: 'Session terminated' });
});

module.exports = router;
