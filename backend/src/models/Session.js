const { pool } = require('../config/database');

async function createSession(user1Id, user2Id) {
  try {
    const result = await pool.query(
      'INSERT INTO sessions (user1_id, user2_id) VALUES ($1, $2) RETURNING *',
      [user1Id, user2Id]
    );
    return result.rows[0];
  } catch {
    return null;
  }
}

async function endSession(sessionId) {
  try {
    const result = await pool.query(
      'UPDATE sessions SET ended_at = NOW() WHERE id = $1 RETURNING *',
      [sessionId]
    );
    return result.rows[0] || null;
  } catch {
    return null;
  }
}

async function getSessionHistory(userId) {
  try {
    const result = await pool.query(
      `SELECT * FROM sessions
       WHERE user1_id = $1 OR user2_id = $1
       ORDER BY started_at DESC
       LIMIT 50`,
      [userId]
    );
    return result.rows;
  } catch {
    return [];
  }
}

module.exports = { createSession, endSession, getSessionHistory };
