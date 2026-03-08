const express = require("express");
const router = express.Router();
const { ProbabilityEngine } = require("../engine/probability");
const counter = require("../engine/counting");
const { validateCard, validatePlayerTotal, validateSessionId } = require("../utils/secure");

router.post("/", (req, res) => {
  try {
    const sessionId = validateSessionId(req.headers["x-session-id"]);
    const { playerTotal: rawTotal, dealerUpcard: rawUpcard, isSoft = false, isPair = false, pairCard } = req.body;

    const playerTotal = validatePlayerTotal(rawTotal);
    const dealerUpcard = validateCard(rawUpcard);

    const trueCount = counter.getTrueCount();
    const { action, source } = ProbabilityEngine.getBasicStrategy(
      playerTotal, dealerUpcard, isSoft, isPair, pairCard || null
    );
    const actionLabel = ProbabilityEngine.actionLabel(action);
    const ev = ProbabilityEngine.expectedValue(playerTotal, dealerUpcard, trueCount, isSoft);
    const insurance = counter.getTrueCount() >= 3 && dealerUpcard === "A";

    // Check if true count suggests a deviation from basic strategy
    let deviation = null;
    if (trueCount >= 4 && playerTotal === 16 && ["10", "J", "Q", "K"].includes(dealerUpcard)) {
      deviation = { play: "16 vs 10", action: "STAND" };
    } else if (trueCount >= 4 && playerTotal === 15 && ["10", "J", "Q", "K"].includes(dealerUpcard)) {
      deviation = { play: "15 vs 10", action: "STAND" };
    } else if (trueCount >= 3 && playerTotal === 12 && dealerUpcard === "3") {
      deviation = { play: "12 vs 3", action: "STAND" };
    } else if (trueCount >= 2 && playerTotal === 12 && dealerUpcard === "4") {
      deviation = { play: "12 vs 4", action: "STAND" };
    } else if (trueCount >= 5 && playerTotal === 10 && dealerUpcard === "A") {
      deviation = { play: "10 vs A", action: "DOUBLE" };
    }

    // Confidence score based on count strength and source
    const countStrength = Math.min(Math.abs(trueCount) / 5, 1);
    const baseConfidence = source === "pairs" ? 0.90 : source === "soft" ? 0.88 : 0.85;
    const confidence = parseFloat(Math.min(baseConfidence + countStrength * 0.1, 0.99).toFixed(2));

    return res.json({
      action,
      actionLabel,
      actionColor: ProbabilityEngine.actionColor(action),
      trueCount: parseFloat(trueCount.toFixed(2)),
      insurance,
      ev: { stand: ev.stand, hit: ev.hit },
      deviation,
      confidence,
      source,
      sessionId
    });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

module.exports = router;
