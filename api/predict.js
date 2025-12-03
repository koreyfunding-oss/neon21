const express = require("express");
const router = express.Router();

router.get("/", (req, res) => {
  return res.json({ message: "Predict endpoint not yet implemented" });
});

module.exports = router;
