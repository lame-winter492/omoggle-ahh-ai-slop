const express = require('express');
const { queueSize } = require('../services/matchmaking');

const router = express.Router();

/**
 * GET /api/match/status
 * Returns current queue statistics.
 */
router.get('/status', (_req, res) => {
  res.json({ waitingUsers: queueSize() });
});

module.exports = router;
