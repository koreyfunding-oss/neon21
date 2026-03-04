const express = require('express');
const router = express.Router();
router.get('/', (req, res) => {
  res.json({ status: 'ONLINE', system: 'NEON21', timestamp: Date.now(), version: '2.0.0' });
});
module.exports = router;
