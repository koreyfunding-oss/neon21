const express = require('express');
const router = express.Router();

// Placeholder stats endpoint
router.get('/', (req, res) => {
  res.json({ message: 'Stats endpoint not implemented yet.' });
});

module.exports = router;
