/**
 * NEON21 — /api/count
 * Add cards to the running count
 */

const express = require('express');
const router = express.Router();
const { stateManager } = require('../state/stateManager');

// POST /api/count — add one or more cards
router.post('/', (req, res) => {
  try {
    const { cards, card, numDecks, system, minBet, maxBet, bankroll } = req.body;
    const sessionId = req.sessionId;

    // Create session if needed
    stateManager.getOrCreate(sessionId, { numDecks, system, minBet, maxBet, bankroll });

    const cardsToAdd = cards || (card ? [card] : []);
    if (cardsToAdd.length === 0) {
      return res.status(400).json({ error: 'No cards provided' });
    }

    const results = [];
    for (const c of cardsToAdd) {
      const result = stateManager.addCard(sessionId, c);
      results.push(result);
    }

    const fullState = stateManager.getFullState(sessionId);
    res.json({ success: true, cards: results, state: fullState });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/count/last — undo last card
router.delete('/last', (req, res) => {
  try {
    const session = stateManager.getSession(req.sessionId);
    if (!session) return res.status(404).json({ error: 'Session not found' });
    const removed = session.counting.removeLastCard();
    const fullState = stateManager.getFullState(req.sessionId);
    res.json({ success: true, removed, state: fullState });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
