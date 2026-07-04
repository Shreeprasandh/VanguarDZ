import express from 'express';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.static(path.join(__dirname, 'dist')));

const server = createServer(app);
const wss = new WebSocketServer({ server });

// Data structures
const onlinePlayers = new Map(); // socketId -> { socket, username, score, level, state: 'lobby'|'playing', roomId }
const rooms = new Map(); // roomId -> { code, players: [], state: 'lobby'|'playing', wave: 1, wordTargetProgress: {}, hostId }

const LEADERBOARD_FILE = path.join(__dirname, 'leaderboard.json');
let highScores = [];
try {
  if (fs.existsSync(LEADERBOARD_FILE)) {
    highScores = JSON.parse(fs.readFileSync(LEADERBOARD_FILE, 'utf8'));
  }
} catch (e) {
  console.log('Failed to load leaderboard.json, starting empty.', e);
}

function broadcastHighScores() {
  const payload = JSON.stringify({ type: 'LEADERBOARD_UPDATE', leaderboard: highScores });
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  });
}

// Helpers
function generateRoomCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function broadcastLeaderboard() {
  broadcastHighScores();
}

function sendToRoom(roomId, messageObj, excludeSocketId = null) {
  const room = rooms.get(roomId);
  if (!room) return;
  const payload = JSON.stringify(messageObj);
  room.players.forEach(p => {
    if (p.socketId !== excludeSocketId) {
      const playerSocket = onlinePlayers.get(p.socketId)?.socket;
      if (playerSocket && playerSocket.readyState === WebSocket.OPEN) {
        playerSocket.send(payload);
      }
    }
  });
}

function getRoomPlayersData(roomId) {
  const room = rooms.get(roomId);
  if (!room) return [];
  return room.players.map(p => {
    const globalPlayer = onlinePlayers.get(p.socketId);
    return {
      socketId: p.socketId,
      username: p.username,
      color: p.color,
      position: p.position,
      isHost: p.isHost,
      score: globalPlayer ? globalPlayer.score : 0,
      level: globalPlayer ? globalPlayer.level : 1
    };
  });
}

// Socket communication
wss.on('connection', (ws) => {
  const socketId = Math.random().toString(36).substring(2, 9);
  
  // Set initial player record
  onlinePlayers.set(socketId, {
    socket: ws,
    username: 'Guest-' + socketId.substring(0, 4),
    score: 0,
    level: 1,
    state: 'lobby',
    roomId: null
  });

  // Send initial leaderboard update to new connector
  broadcastHighScores();

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      const player = onlinePlayers.get(socketId);
      if (!player) return;

      switch (data.type) {
        case 'REGISTER': {
          player.username = data.username || player.username;
          broadcastHighScores();
          break;
        }

        case 'SUBMIT_SCORE': {
          const { username, score } = data;
          if (!username || typeof score !== 'number') break;

          const existingIndex = highScores.findIndex(h => h.username.toLowerCase() === username.toLowerCase());
          if (existingIndex !== -1) {
            if (score > highScores[existingIndex].score) {
              highScores[existingIndex].score = score;
              highScores[existingIndex].date = new Date().toISOString();
            }
          } else {
            highScores.push({ username, score, date: new Date().toISOString() });
          }

          highScores.sort((a, b) => b.score - a.score);
          highScores = highScores.slice(0, 15);

          try {
            fs.writeFileSync(LEADERBOARD_FILE, JSON.stringify(highScores, null, 2));
          } catch (err) {
            console.error('Failed to write leaderboard.json', err);
          }

          broadcastHighScores();
          break;
        }

        case 'UPDATE_SCORE': {
          player.score = data.score !== undefined ? data.score : player.score;
          player.level = data.level !== undefined ? data.level : player.level;
          
          // Also sync score inside active room
          if (player.roomId) {
            sendToRoom(player.roomId, {
              type: 'ROOM_PLAYERS_UPDATE',
              players: getRoomPlayersData(player.roomId)
            });
          }
          break;
        }

        case 'CREATE_ROOM': {
          // Leave old room if any
          if (player.roomId) {
            handleLeaveRoom(socketId);
          }
          
          let code = generateRoomCode();
          while (rooms.has(code)) {
            code = generateRoomCode();
          }

          const room = {
            code,
            players: [{
              socketId,
              username: player.username,
              color: null,
              position: 'center', // Host is center
              isHost: true
            }],
            state: 'lobby',
            wave: 1,
            hostId: socketId
          };

          rooms.set(code, room);
          player.roomId = code;
          player.state = 'lobby';

          ws.send(JSON.stringify({
            type: 'ROOM_CREATED',
            roomCode: code,
            players: getRoomPlayersData(code)
          }));
          
          broadcastLeaderboard();
          break;
        }

        case 'JOIN_ROOM': {
          const code = (data.roomCode || '').toUpperCase();
          const room = rooms.get(code);

          if (!room) {
            ws.send(JSON.stringify({ type: 'ROOM_ERROR', message: 'Room not found.' }));
            break;
          }

          if (room.players.length >= 3) {
            ws.send(JSON.stringify({ type: 'ROOM_ERROR', message: 'Room is full.' }));
            break;
          }

          if (room.state === 'playing') {
            ws.send(JSON.stringify({ type: 'ROOM_ERROR', message: 'Game has already started in this room.' }));
            break;
          }

          // Leave old room if any
          if (player.roomId) {
            handleLeaveRoom(socketId);
          }

          // Assign position: 1st host (center), 2nd (right), 3rd (left)
          let position = 'center';
          if (room.players.length === 1) {
            position = 'right';
          } else if (room.players.length === 2) {
            position = 'left';
          }

          room.players.push({
            socketId,
            username: player.username,
            color: null,
            position,
            isHost: false
          });

          player.roomId = code;
          player.state = 'lobby';

          // Notify joined player
          ws.send(JSON.stringify({
            type: 'ROOM_JOINED',
            roomCode: code,
            players: getRoomPlayersData(code)
          }));

          // Notify room members
          sendToRoom(code, {
            type: 'ROOM_PLAYERS_UPDATE',
            players: getRoomPlayersData(code)
          });

          broadcastLeaderboard();
          break;
        }

        case 'SELECT_COLOR': {
          const code = player.roomId;
          const room = rooms.get(code);
          if (!room) break;

          const chosenColor = data.color; // 'red', 'blue', 'green'

          const roomPlayer = room.players.find(p => p.socketId === socketId);
          if (roomPlayer) {
            roomPlayer.color = chosenColor;
          }

          sendToRoom(code, {
            type: 'ROOM_PLAYERS_UPDATE',
            players: getRoomPlayersData(code)
          });
          break;
        }

        case 'START_GAME': {
          const code = player.roomId;
          const room = rooms.get(code);
          if (!room || room.hostId !== socketId) break;

          // Verify all players have selected a color
          const anyMissingColor = room.players.some(p => !p.color);
          if (anyMissingColor && room.players.length > 1) {
            ws.send(JSON.stringify({ type: 'ROOM_ERROR', message: 'All players must choose a color first.' }));
            break;
          }
          const colors = room.players.map(p => p.color).filter(Boolean);
          const hasDuplicates = new Set(colors).size !== colors.length;
          if (hasDuplicates && room.players.length > 1) {
            ws.send(JSON.stringify({ type: 'ROOM_ERROR', message: 'All players must choose unique colors.' }));
            break;
          }

          room.state = 'playing';
          room.wave = 1;
          
          // Set states to playing
          room.players.forEach(p => {
            const gp = onlinePlayers.get(p.socketId);
            if (gp) {
              gp.state = 'playing';
              gp.score = 0;
              gp.level = 1;
            }
          });

          sendToRoom(code, {
            type: 'GAME_STARTED',
            players: getRoomPlayersData(code)
          });

          broadcastLeaderboard();
          break;
        }

        // Gameplay forwarding packets
        case 'SPAWN_ENEMIES': {
          if (player.roomId) {
            sendToRoom(player.roomId, {
              type: 'SPAWN_ENEMIES',
              enemies: data.enemies
            }, socketId);
          }
          break;
        }

        case 'TYPING_STRIKE': {
          if (player.roomId) {
            sendToRoom(player.roomId, {
              type: 'TYPING_STRIKE',
              playerId: socketId,
              wordId: data.wordId,
              charIndex: data.charIndex,
              damage: data.damage,
              x: data.x,
              y: data.y,
              wordFinished: data.wordFinished
            }, socketId);
          }
          break;
        }

        case 'CANCEL_BULLET': {
          if (player.roomId) {
            sendToRoom(player.roomId, {
              type: 'CANCEL_BULLET',
              bulletId: data.bulletId,
              playerId: socketId
            });
          }
          break;
        }

        case 'SPAWN_BULLET': {
          if (player.roomId) {
            sendToRoom(player.roomId, {
              type: 'SPAWN_BULLET',
              bullet: data.bullet
            }, socketId);
          }
          break;
        }

        case 'SYNC_BOSS_PHASE': {
          if (player.roomId) {
            sendToRoom(player.roomId, {
              type: 'SYNC_BOSS_PHASE',
              phase: data.phase,
              bossWords: data.bossWords
            }, socketId);
          }
          break;
        }

        case 'PLAYER_HIT': {
          if (player.roomId) {
            sendToRoom(player.roomId, {
              type: 'PLAYER_HIT',
              playerId: data.playerId,
              health: data.health
            });
          }
          break;
        }

        case 'GAME_OVER': {
          if (player.roomId) {
            sendToRoom(player.roomId, {
              type: 'GAME_OVER',
              finalScore: data.finalScore,
              waveReached: data.waveReached
            });
            const room = rooms.get(player.roomId);
            if (room) {
              room.state = 'lobby';
              room.players.forEach(p => {
                const gp = onlinePlayers.get(p.socketId);
                if (gp) gp.state = 'lobby';
              });
            }
            broadcastLeaderboard();
          }
          break;
        }

        case 'NEXT_WAVE': {
          const code = player.roomId;
          const room = rooms.get(code);
          if (room) {
            room.wave = data.wave;
            sendToRoom(code, {
              type: 'NEXT_WAVE',
              wave: data.wave
            }, socketId);
          }
          break;
        }

        case 'LEAVE_ROOM': {
          if (player.roomId) {
            handleLeaveRoom(socketId);
          }
          break;
        }
      }
    } catch (e) {
      console.error('Error handling socket message:', e);
    }
  });

  ws.on('close', () => {
    handleLeaveRoom(socketId);
    onlinePlayers.delete(socketId);
    broadcastLeaderboard();
  });
});

function handleLeaveRoom(socketId) {
  const player = onlinePlayers.get(socketId);
  if (!player || !player.roomId) return;

  const code = player.roomId;
  const room = rooms.get(code);
  if (!room) return;

  // Remove player from room
  const playerIndex = room.players.findIndex(p => p.socketId === socketId);
  let wasHost = false;
  if (playerIndex !== -1) {
    wasHost = room.players[playerIndex].isHost;
    room.players.splice(playerIndex, 1);
  }

  player.roomId = null;
  player.state = 'lobby';

  // If room is empty, delete it
  if (room.players.length === 0) {
    rooms.delete(code);
  } else {
    // Re-assign host if host left
    if (wasHost) {
      room.players[0].isHost = true;
      room.hostId = room.players[0].socketId;
    }

    // Re-assign positions so they align correctly
    room.players.forEach((p, idx) => {
      if (idx === 0) p.position = 'center';
      else if (idx === 1) p.position = 'right';
      else if (idx === 2) p.position = 'left';
    });

    // Notify remaining players
    sendToRoom(code, {
      type: 'ROOM_PLAYERS_UPDATE',
      players: getRoomPlayersData(code)
    });

    sendToRoom(code, {
      type: 'PLAYER_LEFT',
      socketId,
      message: `${player.username} left the game.`
    });
  }
}

// Fallback to static client routing
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
