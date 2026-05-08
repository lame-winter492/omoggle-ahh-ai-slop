/**
 * WebRTC helper service.
 *
 * Wraps RTCPeerConnection setup and abstracts offer/answer/ICE exchange.
 */

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

/**
 * Create a new RTCPeerConnection and wire up ICE candidate forwarding.
 *
 * @param {import('socket.io-client').Socket} socket - connected signaling socket
 * @param {string} peerId - remote peer's socket ID
 * @param {(stream: MediaStream) => void} onRemoteStream - called when remote track arrives
 * @returns {RTCPeerConnection}
 */
export function createPeerConnection(socket, peerId, onRemoteStream) {
  const pc = new RTCPeerConnection(ICE_SERVERS);

  pc.onicecandidate = ({ candidate }) => {
    if (candidate) {
      socket.emit('webrtc-ice', { to: peerId, candidate });
    }
  };

  pc.ontrack = (event) => {
    if (onRemoteStream && event.streams[0]) {
      onRemoteStream(event.streams[0]);
    }
  };

  return pc;
}

/**
 * Add a local MediaStream's tracks to an existing peer connection.
 *
 * @param {RTCPeerConnection} pc
 * @param {MediaStream} stream
 */
export function addLocalStream(pc, stream) {
  stream.getTracks().forEach((track) => pc.addTrack(track, stream));
}

/**
 * Request camera + microphone access.
 * @returns {Promise<MediaStream>}
 */
export async function getLocalStream() {
  return navigator.mediaDevices.getUserMedia({ video: true, audio: true });
}
