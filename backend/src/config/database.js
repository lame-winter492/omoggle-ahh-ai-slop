const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME || 'omoggle',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
});

async function connectDB() {
  try {
    const client = await pool.connect();
    console.log('Connected to PostgreSQL');
    await initSchema(client);
    client.release();
  } catch (err) {
    console.error('Database connection failed:', err.message);
    // Non-fatal in development — app can still run without DB
    if (process.env.NODE_ENV === 'production') throw err;
  }
}

async function initSchema(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      socket_id VARCHAR(255) UNIQUE,
      elo INTEGER NOT NULL DEFAULT 1000,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS sessions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user1_id UUID REFERENCES users(id),
      user2_id UUID REFERENCES users(id),
      started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      ended_at TIMESTAMPTZ
    );
  `);
}

module.exports = { pool, connectDB };
