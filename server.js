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
      isReady: p.isHost ? true : !!p.isReady,
      score: globalPlayer ? globalPlayer.score : 0,
      level: globalPlayer ? globalPlayer.level : 1,
      skills: p.skills || [],
      dockReady: !!p.dockReady
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

  // Send registration ID to client
  ws.send(JSON.stringify({
    type: 'REGISTERED',
    socketId: socketId
  }));

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
          if (data.color) player.color = data.color;
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
            const room = rooms.get(player.roomId);
            sendToRoom(player.roomId, {
              type: 'ROOM_PLAYERS_UPDATE',
              players: getRoomPlayersData(player.roomId),
              maxPlayers: room ? room.maxPlayers : 3
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

          const maxPlayers = data.maxPlayers === 2 ? 2 : 3;

          const room = {
            code,
            players: [{
              socketId,
              username: data.username || player.username,
              color: data.color || player.color || null,
              skills: data.skills || [],
              position: maxPlayers === 2 ? 'left' : 'center', // If 2 players, host starts as 'left'
              isHost: true,
              isReady: true
            }],
            state: 'lobby',
            wave: 1,
            hostId: socketId,
            maxPlayers: maxPlayers
          };

          rooms.set(code, room);
          player.roomId = code;
          player.state = 'lobby';

          ws.send(JSON.stringify({
            type: 'ROOM_CREATED',
            roomCode: code,
            players: getRoomPlayersData(code),
            maxPlayers: room.maxPlayers
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

          const maxPlayers = room.maxPlayers || 3;
          if (room.players.length >= maxPlayers) {
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

          // Assign position based on room player count and capacity
          let position = 'center';
          if (maxPlayers === 2) {
            position = 'right'; // 1st is host (left), 2nd is right
          } else {
            // For 3 players: 1st host (center), 2nd (right), 3rd (left)
            if (room.players.length === 1) {
              position = 'right';
            } else if (room.players.length === 2) {
              position = 'left';
            }
          }

          room.players.push({
            socketId,
            username: data.username || player.username,
            color: data.color || player.color || null,
            skills: data.skills || [],
            position,
            isHost: false,
            isReady: false
          });

          player.roomId = code;
          player.state = 'lobby';

          // Notify joined player
          ws.send(JSON.stringify({
            type: 'ROOM_JOINED',
            roomCode: code,
            players: getRoomPlayersData(code),
            maxPlayers: room.maxPlayers
          }));

          // Notify room members
          sendToRoom(code, {
            type: 'ROOM_PLAYERS_UPDATE',
            players: getRoomPlayersData(code),
            maxPlayers: room.maxPlayers
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
            roomPlayer.isReady = false; // Reset ready on color change
          }

          sendToRoom(code, {
            type: 'ROOM_PLAYERS_UPDATE',
            players: getRoomPlayersData(code),
            maxPlayers: room.maxPlayers
          });
          break;
        }

        case 'TOGGLE_READY': {
          const code = player.roomId;
          const room = rooms.get(code);
          if (!room) break;

          const roomPlayer = room.players.find(p => p.socketId === socketId);
          if (roomPlayer && !roomPlayer.isHost) {
            roomPlayer.isReady = !roomPlayer.isReady;
          }

          sendToRoom(code, {
            type: 'ROOM_PLAYERS_UPDATE',
            players: getRoomPlayersData(code),
            maxPlayers: room.maxPlayers
          });
          break;
        }

        case 'UPDATE_PROFILE': {
          const code = player.roomId;
          const room = rooms.get(code);
          if (!room) break;

          const roomPlayer = room.players.find(p => p.socketId === socketId);
          if (roomPlayer) {
            roomPlayer.username = data.username || roomPlayer.username;
            roomPlayer.color = data.color || roomPlayer.color;
            roomPlayer.skills = data.skills || roomPlayer.skills;
            roomPlayer.isReady = false; // Reset ready on profile update
          }

          sendToRoom(code, {
            type: 'ROOM_PLAYERS_UPDATE',
            players: getRoomPlayersData(code),
            maxPlayers: room.maxPlayers
          });
          break;
        }

        case 'DOCK_PLAYER_UPDATE': {
          const code = player.roomId;
          const room = rooms.get(code);
          if (!room) break;

          const roomPlayer = room.players.find(p => p.socketId === socketId);
          if (roomPlayer) {
            roomPlayer.color = data.color || roomPlayer.color;
            roomPlayer.skills = data.skills || roomPlayer.skills;
            roomPlayer.dockReady = data.ready !== undefined ? data.ready : false;
          }

          sendToRoom(code, {
            type: 'ROOM_PLAYERS_UPDATE',
            players: getRoomPlayersData(code),
            maxPlayers: room.maxPlayers
          });
          break;
        }

        case 'LAUNCH_NEXT_WAVE': {
          const code = player.roomId;
          const room = rooms.get(code);
          if (!room || room.hostId !== socketId) break;

          // Reset docking readiness for all players for next cycles
          room.players.forEach(p => {
            p.dockReady = false;
          });

          sendToRoom(code, {
            type: 'LAUNCH_NEXT_WAVE'
          });
          break;
        }

        case 'CAST_SKILL': {
          const code = player.roomId;
          if (!code) break;
          sendToRoom(code, {
            type: 'CAST_SKILL',
            socketId: socketId,
            skillId: data.skillId,
            slot: data.slot
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

          // Re-align positions based on the count of players actually starting the game
          const startCount = room.players.length;
          room.players.forEach((p, idx) => {
            if (startCount === 1) {
              p.position = 'center';
            } else if (startCount === 2) {
              if (idx === 0) p.position = 'left';
              else if (idx === 1) p.position = 'right';
            } else {
              if (idx === 0) p.position = 'center';
              else if (idx === 1) p.position = 'right';
              else if (idx === 2) p.position = 'left';
            }
          });
          
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
              bossId: data.bossId,
              bossType: data.bossType,
              bossName: data.bossName,
              bossColor: data.bossColor,
              bossWidth: data.bossWidth,
              bossHeight: data.bossHeight,
              bossHealth: data.bossHealth,
              bossWords: data.bossWords,
              hostId: socketId
            }, socketId);
          }
          break;
        }

        case 'BOSS_WARNING': {
          if (player.roomId) {
            sendToRoom(player.roomId, {
              type: 'BOSS_WARNING'
            }, socketId);
          }
          break;
        }

        case 'ANOMALY_WARNING': {
          if (player.roomId) {
            sendToRoom(player.roomId, {
              type: 'ANOMALY_WARNING'
            }, socketId);
          }
          break;
        }

        case 'SYNC_POSITIONS': {
          if (player.roomId) {
            sendToRoom(player.roomId, {
              type: 'SYNC_POSITIONS',
              enemies: data.enemies,
              bullets: data.bullets,
              hostId: socketId
            }, socketId);
          }
          break;
        }

        case 'REPLICATOR_SPLIT': {
          if (player.roomId) {
            sendToRoom(player.roomId, {
              type: 'REPLICATOR_SPLIT',
              parentId: data.parentId,
              child1: data.child1,
              child2: data.child2
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

        case 'INIT_DOCK': {
          if (player.roomId) {
            sendToRoom(player.roomId, {
              type: 'INIT_DOCK',
              wave: data.wave
            });
          }
          break;
        }

        case 'PAUSE_REQUEST': {
          const code = player.roomId;
          const room = rooms.get(code);
          if (room) {
            if (!room.pausingPlayers) {
              room.pausingPlayers = [];
            }
            if (!room.pausingPlayers.includes(socketId)) {
              room.pausingPlayers.push(socketId);
            }
            sendToRoom(code, {
              type: 'GAME_PAUSED',
              pausingPlayers: room.pausingPlayers.map(pId => {
                const p = room.players.find(pl => pl.socketId === pId);
                return p ? p.username : 'Unknown';
              }),
              pausingSocketIds: room.pausingPlayers
            });
          }
          break;
        }

        case 'RESUME_REQUEST': {
          const code = player.roomId;
          const room = rooms.get(code);
          if (room && room.pausingPlayers) {
            room.pausingPlayers = room.pausingPlayers.filter(pId => pId !== socketId);
            if (room.pausingPlayers.length === 0) {
              sendToRoom(code, {
                type: 'GAME_RESUMED'
              });
            } else {
              sendToRoom(code, {
                type: 'GAME_PAUSED',
                pausingPlayers: room.pausingPlayers.map(pId => {
                  const p = room.players.find(pl => pl.socketId === pId);
                  return p ? p.username : 'Unknown';
                }),
                pausingSocketIds: room.pausingPlayers
              });
            }
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
    // Remove from pausing list if they were paused
    if (room.pausingPlayers) {
      room.pausingPlayers = room.pausingPlayers.filter(pId => pId !== socketId);
      if (room.pausingPlayers.length === 0) {
        sendToRoom(code, {
          type: 'GAME_RESUMED'
        });
      } else {
        sendToRoom(code, {
          type: 'GAME_PAUSED',
          pausingPlayers: room.pausingPlayers.map(pId => {
            const p = room.players.find(pl => pl.socketId === pId);
            return p ? p.username : 'Unknown';
          }),
          pausingSocketIds: room.pausingPlayers
        });
      }
    }

    // Re-assign host if host left
    if (wasHost) {
      room.players[0].isHost = true;
      room.hostId = room.players[0].socketId;
    }

    // Re-assign positions so they align correctly based on remaining players
    const remainingCount = room.players.length;
    room.players.forEach((p, idx) => {
      if (remainingCount === 1) {
        p.position = 'center';
      } else if (remainingCount === 2) {
        if (idx === 0) p.position = 'left';
        else if (idx === 1) p.position = 'right';
      } else {
        if (idx === 0) p.position = 'center';
        else if (idx === 1) p.position = 'right';
        else if (idx === 2) p.position = 'left';
      }
    });

    // Notify remaining players
    sendToRoom(code, {
      type: 'ROOM_PLAYERS_UPDATE',
      players: getRoomPlayersData(code),
      maxPlayers: room.maxPlayers
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
