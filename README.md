# Omoggle — AI Face Chat

Random video chat app with AI facial analysis (PSL 1–10 scoring) and Elo-based matchmaking.

## Stack

| Layer | Technology |
|---|---|
| Backend | Node.js · Express · Socket.io |
| Frontend | React 18 |
| Database | PostgreSQL |
| Signaling | Socket.io (WebRTC) |
| AI (planned) | TensorFlow.js / MediaPipe / DeepFace |

---

## Project Structure

```
omoggle-ahh-ai-slop/
├── backend/                  # Node.js / Express API + WebRTC signaling
│   ├── src/
│   │   ├── index.js          # Entry point (HTTP + Socket.io server)
│   │   ├── app.js            # Express app
│   │   ├── config/
│   │   │   └── database.js   # PostgreSQL pool + schema init
│   │   ├── routes/
│   │   │   ├── match.js      # GET /api/match/status
│   │   │   └── session.js    # GET /api/session/history/:userId
│   │   ├── signaling/
│   │   │   └── server.js     # Socket.io WebRTC relay
│   │   ├── models/
│   │   │   ├── User.js       # User DB helpers
│   │   │   └── Session.js    # Session DB helpers
│   │   └── services/
│   │       ├── matchmaking.js # In-memory queue
│   │       └── facial.js     # AI analysis STUB (placeholder)
│   └── .env.example
└── frontend/                 # React application
    ├── public/index.html
    └── src/
        ├── App.jsx
        ├── components/
        │   ├── VideoChat.jsx  # WebRTC video chat UI
        │   ├── MatchQueue.jsx # Queuing / spinner UI
        │   └── FaceRating.jsx # PSL score display
        └── services/
            ├── socket.js      # Socket.io client singleton
            └── webrtc.js      # RTCPeerConnection helpers
```

---

## Quick Start

### Prerequisites
- Node.js ≥ 18
- PostgreSQL (or use Docker Compose below)

### 1. Clone & install

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Configure environment

```bash
cd backend
cp .env.example .env
# Edit .env with your PostgreSQL credentials
```

### 3. Run

```bash
# Terminal 1 — backend
cd backend
npm run dev

# Terminal 2 — frontend
cd frontend
npm start
```

Open [http://localhost:3000](http://localhost:3000).

---

## Docker Compose (optional)

```bash
docker compose up
```

This starts PostgreSQL + the backend on port 3001.  
Run the frontend separately with `npm start` inside `frontend/`.

---

## WebRTC Signaling Flow

```
Client A                  Server                  Client B
   |--- join-queue --------->|                        |
   |                         |<------- join-queue ----|
   |<-- matched (initiator) -|-- matched (receiver) ->|
   |--- webrtc-offer ------->|--- webrtc-offer ------->|
   |<-- webrtc-answer -------|<-- webrtc-answer -------|
   |<-- webrtc-ice ----------|--- webrtc-ice ----------|
   |======== P2P video/audio connection ===============|
```

---

## Roadmap

- [x] WebRTC signaling server
- [x] Random matchmaking queue
- [x] Video chat UI
- [x] PostgreSQL session logging
- [x] Facial analysis placeholder / stub
- [ ] Real AI facial scoring (TensorFlow.js / MediaPipe)
- [ ] Elo rating updates after each match
- [ ] Leaderboard
- [ ] TURN server for NAT traversal