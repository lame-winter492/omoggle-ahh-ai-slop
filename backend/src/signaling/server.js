/**
 * WebRTC Signaling Server
 *
 * Uses Socket.io to relay WebRTC offer/answer/ICE-candidate messages between
 * peers.  Also drives the matchmaking flow.
 *
 * Socket events (client → server):
 *   join-queue          – user wants to be matched
 *   leave-queue         – user cancels queuing
 *   webrtc-offer        – forward SDP offer to peer        { to, offer }
 *   webrtc-answer       – forward SDP answer to peer       { to, answer }
 *   webrtc-ice          – forward ICE candidate to peer    { to, candidate }
 *   end-session         – user ended the current session   { sessionId }
 *
 * Socket events (server → client):
 *   matched             – a peer was found                 { peerId, initiator }
 *   peer-disconnected   – the peer closed the connection
 *   webrtc-offer        – incoming SDP offer from peer     { from, offer }
 *   webrtc-answer       – incoming SDP answer from peer    { from, answer }
 *   webrtc-ice          – incoming ICE candidate from peer { from, candidate }
 *   queue-position      – current queue position           { position }
 */

const { Server } = require('socket.io');
const { enqueue, dequeue, findMatch, queueSize } = require('../services/matchmaking');
const { createSession, endSession } = require('../models/Session');
const { createUser } = require('../models/User');

/** @type {Map<string, string>} socketId → sessionId */
const activeSessions = new Map();
/** @type {Map<string, string>} socketId → peerId */
const peerMap = new Map();

function initSignalingServer(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', async (socket) => {
    console.log(`[signaling] connected: ${socket.id}`);

    // Register user in DB (best-effort)
    await createUser(socket.id);

    // ── Queue management ──────────────────────────────────────────────────

    socket.on('join-queue', async () => {
      enqueue(socket.id);
      socket.emit('queue-position', { position: queueSize() });

      const peer = findMatch(socket.id);
      if (!peer) return; // still waiting

      const sessionRecord = await createSession(null, null); // user UUIDs resolved later
      const sessionId = sessionRecord ? sessionRecord.id : null;

      // Remember the pairing
      activeSessions.set(socket.id, sessionId);
      activeSessions.set(peer.socketId, sessionId);
      peerMap.set(socket.id, peer.socketId);
      peerMap.set(peer.socketId, socket.id);

      // Notify both parties; the socket that joined latest is the initiator
      socket.emit('matched', { peerId: peer.socketId, initiator: true, sessionId });
      io.to(peer.socketId).emit('matched', {
        peerId: socket.id,
        initiator: false,
        sessionId,
      });
    });

    socket.on('leave-queue', () => {
      dequeue(socket.id);
    });

    // ── WebRTC relay ──────────────────────────────────────────────────────

    socket.on('webrtc-offer', ({ to, offer }) => {
      io.to(to).emit('webrtc-offer', { from: socket.id, offer });
    });

    socket.on('webrtc-answer', ({ to, answer }) => {
      io.to(to).emit('webrtc-answer', { from: socket.id, answer });
    });

    socket.on('webrtc-ice', ({ to, candidate }) => {
      io.to(to).emit('webrtc-ice', { from: socket.id, candidate });
    });

    // ── Session management ────────────────────────────────────────────────

    socket.on('end-session', async ({ sessionId }) => {
      if (sessionId) await endSession(sessionId);

      const peerId = peerMap.get(socket.id);
      if (peerId) {
        io.to(peerId).emit('peer-disconnected');
        peerMap.delete(peerId);
        activeSessions.delete(peerId);
      }
      peerMap.delete(socket.id);
      activeSessions.delete(socket.id);
    });

    // ── Disconnect ────────────────────────────────────────────────────────

    socket.on('disconnect', async () => {
      console.log(`[signaling] disconnected: ${socket.id}`);
      dequeue(socket.id);

      const sessionId = activeSessions.get(socket.id);
      if (sessionId) await endSession(sessionId);

      const peerId = peerMap.get(socket.id);
      if (peerId) {
        io.to(peerId).emit('peer-disconnected');
        peerMap.delete(peerId);
        activeSessions.delete(peerId);
      }
      peerMap.delete(socket.id);
      activeSessions.delete(socket.id);
    });
  });

  return io;
}

module.exports = { initSignalingServer };
