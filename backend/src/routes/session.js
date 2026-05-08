const express = require('express');
const { getSessionHistory } = require('../models/Session');

const router = express.Router();

/**
 * GET /api/session/history/:userId
 * Returns match history for a given user UUID.
 */
router.get('/history/:userId', async (req, res) => {
  const { userId } = req.params;
  const history = await getSessionHistory(userId);
  res.json({ sessions: history });
});

module.exports = router;
