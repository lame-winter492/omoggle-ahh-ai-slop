/**
 * Matchmaking service.
 *
 * Maintains an in-memory waiting queue. When two users are available they are
 * paired and removed from the queue. Elo-based matching will be added in a
 * future iteration.
 */

/** @type {Array<{ socketId: string, userId: string|null, joinedAt: number }>} */
const waitingQueue = [];

/**
 * Add a user to the waiting queue.
 * @param {string} socketId
 * @param {string|null} userId
 */
function enqueue(socketId, userId = null) {
  // Prevent duplicates
  if (waitingQueue.some((u) => u.socketId === socketId)) return;
  waitingQueue.push({ socketId, userId, joinedAt: Date.now() });
}

/**
 * Remove a user from the waiting queue.
 * @param {string} socketId
 */
function dequeue(socketId) {
  const idx = waitingQueue.findIndex((u) => u.socketId === socketId);
  if (idx !== -1) waitingQueue.splice(idx, 1);
}

/**
 * Try to find a match for the given socket. The caller must already be in the
 * queue (via enqueue). Returns the matched peer or null.
 * @param {string} socketId
 * @returns {{ socketId: string, userId: string|null } | null}
 */
function findMatch(socketId) {
  // The caller must be in the queue to participate in a match
  if (!waitingQueue.some((u) => u.socketId === socketId)) return null;

  const peer = waitingQueue.find((u) => u.socketId !== socketId);
  if (!peer) return null;

  // Remove both from the queue
  dequeue(socketId);
  dequeue(peer.socketId);

  return peer;
}

/** Returns current queue size (for monitoring). */
function queueSize() {
  return waitingQueue.length;
}

module.exports = { enqueue, dequeue, findMatch, queueSize };
