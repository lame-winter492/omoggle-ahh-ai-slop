import React, { useEffect, useRef, useState } from 'react';
import { connectSocket, getSocket } from '../services/socket';
import {
  createPeerConnection,
  addLocalStream,
  getLocalStream,
} from '../services/webrtc';
import FaceRating from './FaceRating';
import '../styles/VideoChat.css';

/**
 * VideoChat component
 *
 * Handles:
 *  - Acquiring local media stream
 *  - WebRTC offer/answer/ICE exchange via the signaling socket
 *  - Displaying local + remote video feeds
 *  - Showing face rating results (stub)
 */
export default function VideoChat({ sessionInfo, onEnd }) {
  const { peerId, initiator, sessionId } = sessionInfo;

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const pcRef = useRef(null);
  const localStreamRef = useRef(null);

  const [rating, setRating] = useState(null);
  const [status, setStatus] = useState('connecting');

  useEffect(() => {
    const socket = connectSocket();

    async function setup() {
      try {
        const stream = await getLocalStream();
        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        const pc = createPeerConnection(socket, peerId, (remoteStream) => {
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = remoteStream;
          }
          setStatus('connected');
        });
        pcRef.current = pc;

        addLocalStream(pc, stream);

        // ── WebRTC signaling listeners ──────────────────────────────────
        socket.on('webrtc-offer', async ({ from, offer }) => {
          if (from !== peerId) return;
          await pc.setRemoteDescription(new RTCSessionDescription(offer));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socket.emit('webrtc-answer', { to: from, answer });
        });

        socket.on('webrtc-answer', async ({ from, answer }) => {
          if (from !== peerId) return;
          await pc.setRemoteDescription(new RTCSessionDescription(answer));
        });

        socket.on('webrtc-ice', async ({ from, candidate }) => {
          if (from !== peerId) return;
          try {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
          } catch (err) {
            // Stale or invalid ICE candidates can be safely ignored; log at
            // debug level to aid troubleshooting without cluttering the console.
            console.debug('[webrtc] addIceCandidate skipped:', err.message);
          }
        });

        socket.on('peer-disconnected', handlePeerLeft);

        // The initiating side creates and sends the offer
        if (initiator) {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          socket.emit('webrtc-offer', { to: peerId, offer });
        }
      } catch (err) {
        console.error('Media/WebRTC error:', err);
        setStatus('error');
      }
    }

    setup();

    return () => {
      cleanup(socket);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handlePeerLeft() {
    setStatus('peer-left');
    cleanup(getSocket());
  }

  function cleanup(socket) {
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }
    socket.off('webrtc-offer');
    socket.off('webrtc-answer');
    socket.off('webrtc-ice');
    socket.off('peer-disconnected');
  }

  function handleEnd() {
    const socket = getSocket();
    socket.emit('end-session', { sessionId });
    cleanup(socket);
    onEnd();
  }

  /** Stub: request a face rating from the backend (placeholder). */
  async function handleAnalyseFace() {
    // Capture a frame from the local video
    const video = localVideoRef.current;
    if (!video) return;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 320;
    canvas.height = video.videoHeight || 240;
    canvas.getContext('2d').drawImage(video, 0, 0);
    const imageBase64 = canvas.toDataURL('image/jpeg');

    // TODO: send imageBase64 to backend /api/analyse endpoint when implemented
    // For now simulate a stub response
    const stubScore = parseFloat((Math.random() * 9 + 1).toFixed(2));
    setRating({
      score: stubScore,
      breakdown: {
        symmetry: parseFloat((Math.random() * 10).toFixed(2)),
        jawline: parseFloat((Math.random() * 10).toFixed(2)),
        eyes: parseFloat((Math.random() * 10).toFixed(2)),
        skin: parseFloat((Math.random() * 10).toFixed(2)),
      },
      note: 'STUB — real AI model not yet integrated',
    });

    void imageBase64; // suppress unused-var warning until backend endpoint exists
  }

  return (
    <div className="video-chat">
      <div className="video-grid">
        <div className="video-wrapper local">
          <video ref={localVideoRef} autoPlay muted playsInline className="video-el" />
          <span className="video-label">You</span>
        </div>
        <div className="video-wrapper remote">
          <video ref={remoteVideoRef} autoPlay playsInline className="video-el" />
          <span className="video-label">
            {status === 'connecting' ? 'Connecting…' : status === 'peer-left' ? 'Peer left' : 'Stranger'}
          </span>
        </div>
      </div>

      {rating && <FaceRating rating={rating} />}

      <div className="video-controls">
        <button className="btn btn-secondary" onClick={handleAnalyseFace}>
          Analyse face (stub)
        </button>
        <button className="btn btn-danger" onClick={handleEnd}>
          End / Next
        </button>
      </div>
    </div>
  );
}
