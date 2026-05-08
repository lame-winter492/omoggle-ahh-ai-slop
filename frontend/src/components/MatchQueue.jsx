import React, { useEffect, useState } from 'react';
import { connectSocket } from '../services/socket';
import '../styles/MatchQueue.css';

/**
 * MatchQueue component
 *
 * Connects to the signaling server, joins the waiting queue, and waits for
 * the 'matched' event before calling onMatched with session info.
 */
export default function MatchQueue({ phase, onMatched, onCancel }) {
  const [queuePos, setQueuePos] = useState(null);
  const [dots, setDots] = useState('');

  useEffect(() => {
    const socket = connectSocket();

    socket.emit('join-queue');

    socket.on('queue-position', ({ position }) => setQueuePos(position));

    socket.on('matched', (info) => {
      socket.off('queue-position');
      socket.off('matched');
      onMatched(info);
    });

    // Animated dots
    const timer = setInterval(() => setDots((d) => (d.length >= 3 ? '' : d + '.')), 500);

    return () => {
      clearInterval(timer);
      socket.emit('leave-queue');
      socket.off('queue-position');
      socket.off('matched');
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="match-queue">
      <div className="spinner" aria-label="Searching for match" />
      <p className="queue-text">
        {phase === 'queuing' ? `Finding a match${dots}` : 'Matched!'}
      </p>
      {queuePos !== null && (
        <p className="queue-pos">Users in queue: {queuePos}</p>
      )}
      <button className="btn btn-secondary" onClick={onCancel}>
        Cancel
      </button>
    </div>
  );
}
