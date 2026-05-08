import React, { useState, useCallback } from 'react';
import VideoChat from './components/VideoChat';
import MatchQueue from './components/MatchQueue';
import './styles/global.css';

/**
 * App state machine:
 *   idle → queuing → chatting → idle
 */
export default function App() {
  const [phase, setPhase] = useState('idle'); // 'idle' | 'queuing' | 'chatting'
  const [sessionInfo, setSessionInfo] = useState(null);

  const handleStartQueue = useCallback(() => setPhase('queuing'), []);

  const handleMatched = useCallback((info) => {
    setSessionInfo(info);
    setPhase('chatting');
  }, []);

  const handleEndChat = useCallback(() => {
    setSessionInfo(null);
    setPhase('idle');
  }, []);

  return (
    <div className="app">
      <header className="app-header">
        <h1 className="logo">omoggle<span className="accent">.ai</span></h1>
        <p className="tagline">Random video chat · AI face analysis</p>
      </header>

      <main className="app-main">
        {phase === 'idle' && (
          <div className="home-screen">
            <p className="home-description">
              Match with a random stranger. An AI will rate your facial features
              on the PSL scale (1–10). Whoever scores higher wins Elo.
            </p>
            <button className="btn btn-primary" onClick={handleStartQueue}>
              Start matching
            </button>
          </div>
        )}

        {(phase === 'queuing' || phase === 'chatting') && (
          <MatchQueue
            phase={phase}
            sessionInfo={sessionInfo}
            onMatched={handleMatched}
            onCancel={handleEndChat}
          />
        )}

        {phase === 'chatting' && sessionInfo && (
          <VideoChat sessionInfo={sessionInfo} onEnd={handleEndChat} />
        )}
      </main>
    </div>
  );
}
