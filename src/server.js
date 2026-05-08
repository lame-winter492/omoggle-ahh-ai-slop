const path = require("path");
const http = require("http");
const express = require("express");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const port = Number(process.env.PORT || 3000);
const host = process.env.HOST || "0.0.0.0";

const players = new Map();
const queue = [];

const startingElo = 1000;
const kFactor = 24;

function expectedScore(playerA, playerB) {
  return 1 / (1 + 10 ** ((playerB.elo - playerA.elo) / 400));
}

function applyElo(playerA, playerB, outcomeA) {
  const expectedA = expectedScore(playerA, playerB);
  const expectedB = expectedScore(playerB, playerA);

  const actualA = outcomeA;
  const actualB = 1 - outcomeA;

  const nextA = Math.round(playerA.elo + kFactor * (actualA - expectedA));
  const nextB = Math.round(playerB.elo + kFactor * (actualB - expectedB));

  const deltaA = nextA - playerA.elo;
  const deltaB = nextB - playerB.elo;

  playerA.elo = nextA;
  playerB.elo = nextB;

  return { deltaA, deltaB };
}

function pruneQueue() {
  for (let i = queue.length - 1; i >= 0; i -= 1) {
    if (!players.has(queue[i])) {
      queue.splice(i, 1);
    }
  }
}

function startNextMatch() {
  pruneQueue();
  if (queue.length < 2) return;

  const firstId = queue.shift();
  const secondId = queue.shift();

  const first = players.get(firstId);
  const second = players.get(secondId);

  if (!first || !second) {
    startNextMatch();
    return;
  }

  let firstScore = Math.floor(Math.random() * 10) + 1;
  let secondScore = Math.floor(Math.random() * 10) + 1;
  let tieBreakAttempts = 0;
  while (firstScore === secondScore && tieBreakAttempts < 5) {
    firstScore = Math.floor(Math.random() * 10) + 1;
    secondScore = Math.floor(Math.random() * 10) + 1;
    tieBreakAttempts += 1;
  }
  if (firstScore === secondScore) {
    if (Math.random() >= 0.5) {
      if (firstScore < 10) firstScore += 1;
      else secondScore -= 1;
    } else {
      if (secondScore < 10) secondScore += 1;
      else firstScore -= 1;
    }
  }
  const firstWon = firstScore > secondScore;
  const firstOutcome = firstWon ? 1 : 0;

  const { deltaA, deltaB } = applyElo(first, second, firstOutcome);
  const matchId = `${Date.now()}-${firstId}-${secondId}`;

  io.to(firstId).emit("match_result", {
    matchId,
    opponent: second.name,
    you: {
      score: firstScore,
      elo: first.elo,
      delta: deltaA
    },
    opponentData: {
      score: secondScore,
      elo: second.elo,
      delta: deltaB
    },
    winner: firstWon ? "you" : "opponent"
  });

  io.to(secondId).emit("match_result", {
    matchId,
    opponent: first.name,
    you: {
      score: secondScore,
      elo: second.elo,
      delta: deltaB
    },
    opponentData: {
      score: firstScore,
      elo: first.elo,
      delta: deltaA
    },
    winner: firstWon ? "opponent" : "you"
  });

  setTimeout(startNextMatch, 0);
}

io.on("connection", (socket) => {
  players.set(socket.id, {
    id: socket.id,
    name: "Anonymous",
    elo: startingElo
  });

  socket.emit("connected", {
    id: socket.id,
    elo: startingElo
  });

  socket.on("register", (payload) => {
    const player = players.get(socket.id);
    if (!player) return;

    const value = String(payload?.name || "").trim();
    player.name = value ? value.slice(0, 24) : "Anonymous";
    socket.emit("profile", { name: player.name, elo: player.elo });
  });

  socket.on("join_queue", () => {
    const player = players.get(socket.id);
    if (!player) return;
    if (!queue.includes(socket.id)) {
      queue.push(socket.id);
    }
    socket.emit("queue_status", { queued: true, queueSize: queue.length });
    startNextMatch();
  });

  socket.on("leave_queue", () => {
    const index = queue.indexOf(socket.id);
    if (index >= 0) queue.splice(index, 1);
    socket.emit("queue_status", { queued: false, queueSize: queue.length });
  });

  socket.on("disconnect", () => {
    const index = queue.indexOf(socket.id);
    if (index >= 0) queue.splice(index, 1);
    players.delete(socket.id);
  });
});

app.use(express.static(path.join(__dirname, "..", "public")));

app.get("/health", (_, res) => {
  res.json({ ok: true, queueSize: queue.length, players: players.size });
});

server.listen(port, host, () => {
  console.log(`Server listening on http://${host}:${port}`);
});
