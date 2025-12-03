const express = require("express");
const router = express.Router();
const counter = require("../engine/counting");

router.post("/", (req, res) => {
  counter.reset();
  return res.json({ message: "Counter reset" });
});

module.exports = router;
