require('dotenv').config();
const { createServer } = require('http');
const app = require('./app');
const { initSignalingServer } = require('./signaling/server');
const { connectDB } = require('./config/database');

const PORT = process.env.PORT || 3001;

const httpServer = createServer(app);
initSignalingServer(httpServer);

async function start() {
  await connectDB();
  httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
