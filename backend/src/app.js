const express = require('express');
const cors = require('cors');
const matchRoutes = require('./routes/match');
const sessionRoutes = require('./routes/session');

const app = express();

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000' }));
app.use(express.json());

// Health check
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

// API routes
app.use('/api/match', matchRoutes);
app.use('/api/session', sessionRoutes);

// 404 handler
app.use((_req, res) => res.status(404).json({ error: 'Not found' }));

// Error handler
app.use((err, _req, res, _next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

module.exports = app;
