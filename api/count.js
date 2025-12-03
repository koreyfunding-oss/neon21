const express = require("express");
const router = express.Router();
const counter = require("../engine/counting");

router.post("/", (req, res) => {
  const { card } = req.body;

  if (!card) {
    return res.json({ error: "Card is required." });
  }

  counter.update(card);

  return res.json({
    runningCount: counter.runningCount,
    trueCount: counter.getTrueCount(),
    cardsSeen: counter.cardsSeen
  });
});

module.exports = router;
