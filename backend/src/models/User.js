const { pool } = require('../config/database');

async function createUser(socketId) {
  try {
    const result = await pool.query(
      'INSERT INTO users (socket_id) VALUES ($1) ON CONFLICT (socket_id) DO UPDATE SET socket_id = $1 RETURNING *',
      [socketId]
    );
    return result.rows[0];
  } catch {
    return null;
  }
}

async function getUserBySocketId(socketId) {
  try {
    const result = await pool.query('SELECT * FROM users WHERE socket_id = $1', [socketId]);
    return result.rows[0] || null;
  } catch {
    return null;
  }
}

async function updateUserElo(userId, newElo) {
  try {
    const result = await pool.query(
      'UPDATE users SET elo = $1 WHERE id = $2 RETURNING *',
      [newElo, userId]
    );
    return result.rows[0] || null;
  } catch {
    return null;
  }
}

module.exports = { createUser, getUserBySocketId, updateUserElo };
